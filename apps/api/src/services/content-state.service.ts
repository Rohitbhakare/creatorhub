import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import { trackContentPublished } from './analytics.service.js'

// ─── publish ────────────────────────────────────────────────────

export async function publish(
  contentId: string,
  userId: string,
  tncAccepted: boolean,
): Promise<Record<string, unknown>> {
  if (!tncAccepted) {
    throw new AppError('validation-failed', 400, 'You must accept the Terms & Conditions')
  }

  // Fetch content
  const { data: content, error: fetchError } = await supabase
    .from('content')
    .select('*')
    .eq('id', contentId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !content) {
    throw new AppError('not-found', 404, 'Content not found')
  }

  if (content.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You do not own this content')
  }

  if (content.status !== 'draft') {
    throw new AppError('unprocessable', 422, 'Only draft content can be published')
  }

  // Validate required fields per type
  validateRequiredFields(content)

  // Additional async validation for itineraries
  if (content.type === 'self_paced_itinerary') {
    await validateItineraryDays(contentId)
  }

  // If paid content, check KYC
  if (content.pricing_model === 'paid') {
    const { data: user } = await supabase
      .from('users')
      .select('kyc_status')
      .eq('id', userId)
      .single()

    if (user?.kyc_status !== 'verified') {
      throw new AppError('forbidden', 403, 'KYC verification required to publish paid content')
    }
  }

  // Transition: draft → published (skip under_review for MVP)
  const { data: updated, error: updateError } = await supabase
    .from('content')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .eq('id', contentId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (updateError || !updated) {
    throw new AppError('db-error', 500, 'Failed to publish content')
  }

  // Track publish event (ANL-FR-001)
  trackContentPublished(userId, contentId, updated.type as string)

  // Increment user content_count (fire-and-forget)
  void supabase.rpc('increment_count', {
    table_name: 'users',
    column_name: 'content_count',
    row_id: userId,
    amount: 1,
  })

  return updated
}

// ─── unpublish ──────────────────────────────────────────────────

export async function unpublish(
  contentId: string,
  userId: string,
): Promise<Record<string, unknown>> {
  const { data: content, error: fetchError } = await supabase
    .from('content')
    .select('id, user_id, status')
    .eq('id', contentId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !content) {
    throw new AppError('not-found', 404, 'Content not found')
  }

  if (content.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You do not own this content')
  }

  if (content.status !== 'published') {
    throw new AppError('unprocessable', 422, 'Only published content can be unpublished')
  }

  const { data: updated, error: updateError } = await supabase
    .from('content')
    .update({
      status: 'unpublished',
      unpublished_at: new Date().toISOString(),
    })
    .eq('id', contentId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (updateError || !updated) {
    throw new AppError('db-error', 500, 'Failed to unpublish content')
  }

  // Decrement user content_count (fire-and-forget)
  void supabase.rpc('increment_count', {
    table_name: 'users',
    column_name: 'content_count',
    row_id: userId,
    amount: -1,
  })

  return updated
}

// ─── archive ────────────────────────────────────────────────────

export async function archive(
  contentId: string,
  userId: string,
): Promise<Record<string, unknown>> {
  const { data: content, error: fetchError } = await supabase
    .from('content')
    .select('id, user_id, status')
    .eq('id', contentId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !content) {
    throw new AppError('not-found', 404, 'Content not found')
  }

  if (content.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You do not own this content')
  }

  if (content.status !== 'published' && content.status !== 'unpublished') {
    throw new AppError('unprocessable', 422, 'Only published or unpublished content can be archived')
  }

  const wasPublished = content.status === 'published'

  const { data: updated, error: updateError } = await supabase
    .from('content')
    .update({ status: 'archived' })
    .eq('id', contentId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (updateError || !updated) {
    throw new AppError('db-error', 500, 'Failed to archive content')
  }

  // If archiving from published, decrement content_count
  if (wasPublished) {
    void supabase.rpc('increment_count', {
      table_name: 'users',
      column_name: 'content_count',
      row_id: userId,
      amount: -1,
    })
  }

  return updated
}

// ─── Validation per type ────────────────────────────────────────

function validateRequiredFields(content: Record<string, unknown>): void {
  const type = content.type as string

  switch (type) {
    case 'post': {
      if (!content.title || (content.title as string).trim().length === 0) {
        throw new AppError('validation-failed', 400, 'Posts require a title')
      }
      if (!content.body || (content.body as string).trim().length === 0) {
        throw new AppError('validation-failed', 400, 'Posts require a body')
      }
      break
    }
    case 'self_paced_itinerary': {
      if (!content.title || (content.title as string).trim().length === 0) {
        throw new AppError('validation-failed', 400, 'Itineraries require a title')
      }
      // We cannot easily check days+spots from the content row alone,
      // so do an async check separately. For now, we validate synchronously
      // that the title exists. The days/spots check is done outside this function.
      break
    }
    case 'scheduled_experience':
    case 'event': {
      if (!content.title || (content.title as string).trim().length === 0) {
        throw new AppError('validation-failed', 400, `${type} requires a title`)
      }
      break
    }
    default:
      throw new AppError('unprocessable', 422, `Unknown content type: ${type}`)
  }
}

/**
 * Additional async validation for itineraries: at least 1 day with spots.
 * Called from publish() when type is self_paced_itinerary.
 */
export async function validateItineraryDays(contentId: string): Promise<void> {
  const { data: days, error } = await supabase
    .from('itinerary_days')
    .select('id')
    .eq('content_id', contentId)

  if (error || !days || days.length === 0) {
    throw new AppError('validation-failed', 400, 'Itineraries require at least 1 day')
  }

  // Check at least one day has spots
  const dayIds = days.map((d) => d.id as string)
  const { count, error: spotError } = await supabase
    .from('itinerary_spots')
    .select('id', { count: 'exact', head: true })
    .in('itinerary_day_id', dayIds)

  if (spotError || (count ?? 0) === 0) {
    throw new AppError('validation-failed', 400, 'Itineraries require at least 1 spot')
  }
}
