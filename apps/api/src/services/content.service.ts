import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import type {
  CreateContentInput,
  ContentListQueryInput,
  ContentType,
} from '@creatorhub/shared'

// ─── Types ──────────────────────────────────────────────────────

type ContentRow = Record<string, unknown>

type CreatorSummary = {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
}

// ─── createDraft ────────────────────────────────────────────────

export async function createDraft(
  userId: string,
  input: CreateContentInput,
): Promise<ContentRow> {
  const { data, error } = await supabase
    .from('content')
    .insert({
      user_id: userId,
      type: input.type,
      vertical: input.vertical,
      status: 'draft',
      visibility: 'public',
      pricing_model: 'free',
      price_paisa: 0,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new AppError('db-error', 500, 'Failed to create content draft')
  }

  return data
}

// ─── getById ────────────────────────────────────────────────────

/**
 * Look up content by either UUID or slug. The web sends slugs; the mobile
 * app sends UUIDs; both resolve here.
 *
 * NOTE: slug column requires migration 031_content_slug.sql to be deployed.
 * Until then, we tolerate "column does not exist" by catching the lookup
 * error on the slug branch and 404-ing — same UX as a not-found content.
 */
export async function getById(
  contentIdOrSlug: string,
  requesterId?: string | null,
): Promise<{ content: ContentRow; media: ContentRow[]; creator: CreatorSummary }> {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(contentIdOrSlug)

  let query = supabase.from('content').select('*').is('deleted_at', null)
  if (isUuid) {
    query = query.eq('id', contentIdOrSlug)
  } else {
    // Slug lookup will 42703 (column does not exist) until migration deploys
    // — surface as 404 so the route renders not-found.tsx instead of 500.
    query = query.eq('slug', contentIdOrSlug)
  }

  const { data: content, error } = await query.maybeSingle()

  if (error || !content) {
    throw new AppError('not-found', 404, 'Content not found')
  }
  const contentId = content.id as string

  // Visibility check: non-owners can only see published + public content
  const isOwner = requesterId != null && content.user_id === requesterId
  if (!isOwner) {
    if (content.status !== 'published' || content.visibility === 'private') {
      throw new AppError('not-found', 404, 'Content not found')
    }
  }

  // Fetch media
  const { data: media } = await supabase
    .from('content_media')
    .select('*')
    .eq('content_id', contentId)
    .order('display_order', { ascending: true })

  // Fetch creator profile
  const { data: creator } = await supabase
    .from('users')
    .select('id, display_name, username, avatar_url')
    .eq('id', content.user_id as string)
    .single()

  if (!creator) {
    throw new AppError('not-found', 404, 'Creator not found')
  }

  // Type-specific extras — needed by the web reader. The web expects:
  //   - self_paced_itinerary → flat `spots[]` (with day info attached)
  //   - scheduled_experience → `scheduled_dates[]` + `meeting_point`
  //   - event → `event_occurrence`
  // Without these the reader renders a placeholder body and falls back to
  // ch-page-grid (no day-nav, no map). Web's transformContentDetail reads
  // `raw.spots` and `raw.scheduled_dates` directly.
  let spots: Record<string, unknown>[] = []
  let scheduledDates: Record<string, unknown>[] = []

  const contentType = content.type as string
  if (contentType === 'self_paced_itinerary') {
    const { data: days } = await supabase
      .from('itinerary_days')
      .select('id, day_number, title, description, total_distance_km, estimated_hours')
      .eq('content_id', contentId)
      .order('day_number', { ascending: true })
    const dayList = days ?? []
    if (dayList.length > 0) {
      const dayIds = dayList.map((d) => d.id as string)
      const { data: spotRows } = await supabase
        .from('itinerary_spots')
        .select(
          'id, itinerary_day_id, spot_order, name, category, thumbnail_url, creator_note, duration_minutes, stop_type, is_free_preview, point',
        )
        .in('itinerary_day_id', dayIds)
        .order('spot_order', { ascending: true })
      const dayById = new Map<string, (typeof dayList)[number]>()
      for (const d of dayList) dayById.set(d.id as string, d)
      spots = (spotRows ?? []).map((sp) => {
        const day = dayById.get(sp.itinerary_day_id as string)
        // Decode PostGIS geography(point) `0101000020E6100000…` hex into
        // separate lat/lng for the web map. The point column is returned as
        // an EWKB hex string by Supabase JS — we parse the doubles out.
        const { lat, lng } = decodePointHex(sp.point as string | null)
        return {
          id: sp.id,
          spot_order: sp.spot_order,
          day_number: day?.day_number ?? null,
          day_title: day?.title ?? null,
          name: sp.name,
          category: sp.category,
          thumbnail_url: sp.thumbnail_url,
          creator_note: sp.creator_note,
          duration_minutes: sp.duration_minutes,
          stop_type: sp.stop_type,
          is_free_preview: sp.is_free_preview,
          lat,
          lng,
        }
      })
    }
  } else if (contentType === 'scheduled_experience') {
    const today = new Date().toISOString().slice(0, 10)
    const { data: dates } = await supabase
      .from('scheduled_dates')
      .select('id, start_date, end_date, capacity, spots_booked, is_active')
      .eq('content_id', contentId)
      .eq('is_active', true)
      .gte('start_date', today)
      .order('start_date', { ascending: true })
      .limit(20)
    scheduledDates = (dates ?? []).map((d) => ({
      id: d.id,
      start_date: d.start_date,
      end_date: d.end_date,
      capacity: d.capacity,
      spots_booked: d.spots_booked,
      is_active: d.is_active,
    }))
  }

  // Itineraries can also have scheduled departure dates (E5.4/BUG-001 fix).
  if (contentType === 'self_paced_itinerary') {
    const today = new Date().toISOString().slice(0, 10)
    const { data: dates } = await supabase
      .from('scheduled_dates')
      .select('id, start_date, end_date, capacity, spots_booked, is_active')
      .eq('content_id', contentId)
      .eq('is_active', true)
      .gte('start_date', today)
      .order('start_date', { ascending: true })
      .limit(20)
    scheduledDates = (dates ?? []).map((d) => ({
      id: d.id,
      start_date: d.start_date,
      end_date: d.end_date,
      capacity: d.capacity,
      spots_booked: d.spots_booked,
      is_active: d.is_active,
    }))
  }

  return {
    content: { ...content, spots, scheduled_dates: scheduledDates },
    media: media ?? [],
    creator: {
      id: creator.id as string,
      display_name: (creator.display_name as string) ?? null,
      username: (creator.username as string) ?? null,
      avatar_url: (creator.avatar_url as string) ?? null,
    },
  }
}

/**
 * Decodes a PostGIS `geography(POINT, 4326)` value returned by Supabase JS as
 * an EWKB hex string. Layout:
 *   bytes 0      — endianness (01 = little)
 *   bytes 1-4    — type (01000020 with SRID flag)
 *   bytes 5-8    — SRID (E6100000 = 4326 LE)
 *   bytes 9-16   — X coordinate (longitude) as float64 LE
 *   bytes 17-24  — Y coordinate (latitude) as float64 LE
 * Returns 0,0 if the input is null or malformed.
 */
function decodePointHex(hex: string | null): { lat: number; lng: number } {
  if (!hex || hex.length < 50) return { lat: 0, lng: 0 }
  try {
    const buf = Buffer.from(hex, 'hex')
    // Skip endianness(1) + type(4) + srid(4) = 9 bytes header.
    const lng = buf.readDoubleLE(9)
    const lat = buf.readDoubleLE(17)
    return { lat, lng }
  } catch {
    return { lat: 0, lng: 0 }
  }
}

// ─── updateDraft ────────────────────────────────────────────────

export async function updateDraft(
  contentId: string,
  userId: string,
  updates: Record<string, unknown>,
): Promise<ContentRow> {
  // Verify ownership and draft status
  const { data: existing, error: fetchError } = await supabase
    .from('content')
    .select('id, user_id, status')
    .eq('id', contentId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existing) {
    throw new AppError('not-found', 404, 'Content not found')
  }

  if (existing.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You do not own this content')
  }

  if (existing.status !== 'draft') {
    throw new AppError('unprocessable', 422, 'Only draft content can be edited')
  }

  // Strip enum fields that are empty strings — they fail DB CHECK constraints
  // and signal "not set yet" rather than an intentional clear.
  if (updates.vertical === '') delete (updates as Record<string, unknown>).vertical

  const { data, error } = await supabase
    .from('content')
    .update(updates)
    .eq('id', contentId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error || !data) {
    throw new AppError('db-error', 500, 'Failed to update content')
  }

  return data
}

// ─── listDrafts ─────────────────────────────────────────────────

export async function listDrafts(
  userId: string,
  type?: ContentType,
): Promise<ContentRow[]> {
  let query = supabase
    .from('content')
    .select('id, type, title, updated_at')
    .eq('user_id', userId)
    .eq('status', 'draft')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    throw new AppError('db-error', 500, 'Failed to fetch drafts')
  }

  return data ?? []
}

// ─── listPublished ──────────────────────────────────────────────

export async function listPublished(
  filters: ContentListQueryInput,
): Promise<{ items: ContentRow[]; next_cursor: string | null }> {
  const limit = filters.limit ?? 20

  let query = supabase
    .from('content')
    .select(`
      id, user_id, type, vertical, status, visibility, pricing_model,
      title, description, cover_image_url, starting_city_id, tags,
      like_count, comment_count, save_count, view_count,
      price_paisa, duration_minutes,
      published_at, created_at
    `)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1) // fetch one extra to detect has_more

  if (filters.type) {
    query = query.eq('type', filters.type)
  }

  if (filters.vertical) {
    query = query.eq('vertical', filters.vertical)
  }

  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id)
  }

  // Cursor-based pagination: cursor = base64(published_at|id)
  if (filters.cursor) {
    const decoded = decodeCursor(filters.cursor)
    if (decoded) {
      query = query.or(
        `published_at.lt.${decoded.published_at},and(published_at.eq.${decoded.published_at},id.lt.${decoded.id})`,
      )
    }
  }

  const { data, error } = await query

  if (error) {
    throw new AppError('db-error', 500, 'Failed to fetch content')
  }

  const items = data ?? []
  const hasMore = items.length > limit
  const resultItems = hasMore ? items.slice(0, limit) : items

  let nextCursor: string | null = null
  if (hasMore && resultItems.length > 0) {
    const last = resultItems[resultItems.length - 1]!
    nextCursor = encodeCursor(last.published_at as string, last.id as string)
  }

  return { items: resultItems, next_cursor: nextCursor }
}

// ─── softDelete ─────────────────────────────────────────────────

export async function softDelete(
  contentId: string,
  userId: string,
): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from('content')
    .select('id, user_id')
    .eq('id', contentId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existing) {
    throw new AppError('not-found', 404, 'Content not found')
  }

  if (existing.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You do not own this content')
  }

  const { error } = await supabase
    .from('content')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', contentId)
    .eq('user_id', userId)

  if (error) {
    throw new AppError('db-error', 500, 'Failed to delete content')
  }
}

// ─── Cursor helpers ─────────────────────────────────────────────

function encodeCursor(publishedAt: string, id: string): string {
  return Buffer.from(`${publishedAt}|${id}`).toString('base64url')
}

function decodeCursor(cursor: string): { published_at: string; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf-8')
    const [publishedAt, id] = decoded.split('|')
    if (!publishedAt || !id) return null
    return { published_at: publishedAt, id }
  } catch {
    return null
  }
}
