import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'

// ─── Types ──────────────────────────────────────────────────────

export interface Review {
  id: string
  bookingId: string
  contentId: string
  reviewerId: string
  creatorId: string
  rating: number
  reviewerText: string | null      // null if not yet revealed (to non-reviewer)
  creatorResponse: string | null   // null if not yet revealed (to non-creator)
  isRevealed: boolean
  revealedAt: string | null
  createdAt: string
  reviewer?: {
    id: string
    displayName: string | null
    avatarUrl: string | null
    username: string | null
  }
}

// ─── Cursor helpers ──────────────────────────────────────────────

function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`).toString('base64url')
}

function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8')
    const parts = decoded.split('|')
    if (parts.length < 2) return null
    const id = parts[parts.length - 1]!
    const createdAt = parts.slice(0, -1).join('|')
    if (!createdAt || !id) return null
    return { createdAt, id }
  } catch {
    return null
  }
}

// ─── Row mapper ─────────────────────────────────────────────────

function mapRow(
  row: Record<string, unknown>,
  requesterId: string | undefined,
  maskText: boolean,
): Review {
  const id = row.id as string
  const reviewerId = row.reviewer_id as string
  const creatorId = row.creator_id as string
  const isRevealed = row.is_revealed as boolean

  // Reviewer always sees their own text.
  // Creator always sees creator response (they wrote it).
  // Others only see text when revealed.
  const showReviewerText =
    isRevealed || requesterId === reviewerId
  const showCreatorResponse =
    isRevealed || requesterId === creatorId

  const reviewerRow = row.reviewer as Record<string, unknown> | null | undefined

  return {
    id,
    bookingId: row.booking_id as string,
    contentId: row.content_id as string,
    reviewerId,
    creatorId,
    rating: row.rating as number,
    reviewerText: showReviewerText && !maskText
      ? (row.reviewer_text as string | null)
      : null,
    creatorResponse: showCreatorResponse && !maskText
      ? (row.creator_response as string | null)
      : null,
    isRevealed,
    revealedAt: (row.revealed_at as string) ?? null,
    createdAt: row.created_at as string,
    ...(reviewerRow != null && {
      reviewer: {
        id: reviewerRow.id as string,
        displayName: (reviewerRow.display_name as string) ?? null,
        avatarUrl: (reviewerRow.avatar_url as string) ?? null,
        username: (reviewerRow.username as string) ?? null,
      },
    }),
  }
}

// ─── submitReview ────────────────────────────────────────────────

/**
 * Submit a review for a completed booking.
 * - Booking must be 'completed'
 * - Reviewer must own the booking
 * - No existing review for the booking
 * - Sets revealed_at = now() + 14 days
 */
export async function submitReview(
  reviewerId: string,
  bookingId: string,
  rating: number,
  reviewerText: string,
): Promise<{ id: string }> {
  // Fetch booking — verify ownership and status
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, user_id, content_id, creator_id, status')
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingError || !booking) {
    throw new AppError('not-found', 404, 'Booking not found')
  }

  if ((booking.user_id as string) !== reviewerId) {
    throw new AppError('forbidden', 403, 'You do not own this booking')
  }

  if ((booking.status as string) !== 'completed') {
    throw new AppError(
      'unprocessable',
      422,
      'Reviews can only be submitted for completed bookings',
      [{ field: 'booking_id', message: 'Booking must be completed', code: 'booking_not_completed' }],
    )
  }

  // Check for existing review
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', bookingId)
    .maybeSingle()

  if (existing) {
    throw new AppError('conflict', 409, 'A review already exists for this booking', [
      { field: 'booking_id', message: 'Review already submitted', code: 'review_exists' },
    ])
  }

  // Set revealed_at to now + 14 days
  const revealedAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

  const { data: review, error: insertError } = await supabase
    .from('reviews')
    .insert({
      booking_id: bookingId,
      content_id: booking.content_id as string,
      reviewer_id: reviewerId,
      creator_id: booking.creator_id as string,
      rating,
      reviewer_text: reviewerText,
      revealed_at: revealedAt,
      is_revealed: false,
    })
    .select('id')
    .single()

  if (insertError || !review) {
    throw new AppError('db-error', 500, 'Failed to submit review')
  }

  return { id: review.id as string }
}

// ─── submitCreatorResponse ───────────────────────────────────────

/**
 * Submit creator's response to an existing review.
 * - Creator must be the content creator
 * - Review must exist and not already have a response
 */
export async function submitCreatorResponse(
  creatorId: string,
  reviewId: string,
  response: string,
): Promise<void> {
  const { data: review, error } = await supabase
    .from('reviews')
    .select('id, creator_id, creator_response')
    .eq('id', reviewId)
    .maybeSingle()

  if (error || !review) {
    throw new AppError('not-found', 404, 'Review not found')
  }

  if ((review.creator_id as string) !== creatorId) {
    throw new AppError('forbidden', 403, 'You are not the creator for this review')
  }

  if (review.creator_response != null) {
    throw new AppError('conflict', 409, 'A response has already been submitted for this review', [
      { field: 'review_id', message: 'Response already submitted', code: 'response_exists' },
    ])
  }

  const { error: updateError } = await supabase
    .from('reviews')
    .update({ creator_response: response })
    .eq('id', reviewId)

  if (updateError) {
    throw new AppError('db-error', 500, 'Failed to submit creator response')
  }
}

// ─── getReview ───────────────────────────────────────────────────

/**
 * Get a single review by ID.
 * - Reviewer always sees their own reviewerText
 * - Creator always sees (but not public) creatorResponse
 * - Others only see text when is_revealed = true
 */
export async function getReview(reviewId: string, requesterId: string): Promise<Review> {
  const { data: row, error } = await supabase
    .from('reviews')
    .select(`
      *,
      reviewer:users!reviews_reviewer_id_fkey(id, display_name, avatar_url, username)
    `)
    .eq('id', reviewId)
    .maybeSingle()

  if (error || !row) {
    throw new AppError('not-found', 404, 'Review not found')
  }

  return mapRow(row as Record<string, unknown>, requesterId, false)
}

// ─── listContentReviews ──────────────────────────────────────────

/**
 * List reviews for a content piece.
 * - Only revealed reviews visible to public
 * - Creator sees all reviews (including unrevealed text hidden)
 * - Returns average rating across all revealed reviews
 */
export async function listContentReviews(
  contentId: string,
  requesterId: string | undefined,
  options: { cursor?: string; limit?: number },
): Promise<{ items: Review[]; nextCursor: string | null; averageRating: number }> {
  const limit = options.limit ?? 20
  const decodedCursor = options.cursor ? decodeCursor(options.cursor) : null

  // Determine if requester is the creator
  let isCreator = false
  if (requesterId) {
    const { data: content } = await supabase
      .from('content')
      .select('user_id')
      .eq('id', contentId)
      .maybeSingle()
    isCreator = content != null && (content.user_id as string) === requesterId
  }

  // Build query
  let query = supabase
    .from('reviews')
    .select(`
      *,
      reviewer:users!reviews_reviewer_id_fkey(id, display_name, avatar_url, username)
    `)
    .eq('content_id', contentId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })

  // Public only sees revealed reviews; creator sees all
  if (!isCreator) {
    query = query.eq('is_revealed', true)
  }

  // Cursor pagination
  if (decodedCursor) {
    query = query.or(
      `created_at.lt.${decodedCursor.createdAt},and(created_at.eq.${decodedCursor.createdAt},id.lt.${decodedCursor.id})`,
    )
  }

  const { data: rows, error } = await query.limit(limit + 1)

  if (error) {
    throw new AppError('db-error', 500, 'Failed to list reviews')
  }

  const allRows = (rows ?? []) as Record<string, unknown>[]
  const hasMore = allRows.length > limit
  const pageRows = hasMore ? allRows.slice(0, limit) : allRows

  const items = pageRows.map((row) => mapRow(row, requesterId, false))

  let nextCursor: string | null = null
  if (hasMore) {
    const last = pageRows[pageRows.length - 1]!
    nextCursor = encodeCursor(last.created_at as string, last.id as string)
  }

  // Calculate average rating across all revealed reviews for this content
  const { data: ratingData } = await supabase
    .from('reviews')
    .select('rating')
    .eq('content_id', contentId)
    .eq('is_revealed', true)

  const ratings = (ratingData ?? []).map((r) => r.rating as number)
  const averageRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : 0

  return { items, nextCursor, averageRating }
}

// ─── revealDueReviews ────────────────────────────────────────────

/**
 * Set is_revealed = true for all reviews where revealed_at <= now().
 * Intended to be called by cron job or admin trigger.
 */
export async function revealDueReviews(): Promise<{ count: number }> {
  const { data, error } = await supabase
    .from('reviews')
    .update({ is_revealed: true })
    .lte('revealed_at', new Date().toISOString())
    .eq('is_revealed', false)
    .select('id')

  if (error) {
    throw new AppError('db-error', 500, 'Failed to reveal due reviews')
  }

  return { count: (data ?? []).length }
}
