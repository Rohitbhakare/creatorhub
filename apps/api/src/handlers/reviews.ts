import type { Context } from 'hono'
import {
  submitReview,
  submitCreatorResponse,
  getReview,
  listContentReviews,
  getReviewsSummary,
  revealDueReviews,
} from '../services/review.service.js'
import { AppError } from '../errors/AppError.js'
import { env } from '../env.js'
import type { SubmitReviewInput, SubmitCreatorResponseInput, ReviewListQueryInput } from '@creatorhub/shared'

/**
 * POST /api/v1/reviews
 * Submit a review for a completed booking.
 * Authenticated — must be the booking owner.
 */
export async function handleSubmitReview(c: Context): Promise<Response> {
  const reviewerId = c.get('userId') as string
  const body = c.get('validatedBody') as SubmitReviewInput

  const result = await submitReview(
    reviewerId,
    body.booking_id,
    body.rating,
    body.reviewer_text,
  )

  c.header('Location', `/api/v1/reviews/${result.id}`)
  return c.json({ success: true, data: result }, 201)
}

/**
 * POST /api/v1/reviews/:id/response
 * Submit creator's response to a review.
 * Authenticated — must be the content creator.
 */
export async function handleSubmitCreatorResponse(c: Context): Promise<Response> {
  const creatorId = c.get('userId') as string
  const reviewId = c.req.param('id')!
  const body = c.get('validatedBody') as SubmitCreatorResponseInput

  await submitCreatorResponse(creatorId, reviewId, body.response)

  return c.json({ success: true, data: { reviewed: true } })
}

/**
 * GET /api/v1/reviews/:id
 * Get a single review.
 * Optional auth — reviewer always sees their own text; public sees text only after reveal.
 */
export async function handleGetReview(c: Context): Promise<Response> {
  const reviewId = c.req.param('id')!
  const requesterId = (c.get('userId') as string | null) ?? ''

  const review = await getReview(reviewId, requesterId)

  return c.json({ success: true, data: review })
}

/**
 * GET /api/v1/content/:contentId/reviews
 * List reviews for a content piece.
 * Optional auth — creator sees all; public sees only revealed.
 */
export async function handleListContentReviews(c: Context): Promise<Response> {
  const contentId = c.req.param('contentId')!
  const requesterId = (c.get('userId') as string | null) ?? undefined
  const query = c.get('validatedQuery') as ReviewListQueryInput

  const { items, nextCursor, averageRating } = await listContentReviews(
    contentId,
    requesterId,
    {
      ...(query.cursor !== undefined && { cursor: query.cursor }),
      limit: query.limit,
    },
  )

  return c.json({
    success: true,
    data: items,
    meta: {
      next_cursor: nextCursor,
      has_more: nextCursor != null,
      per_page: query.limit ?? 20,
      average_rating: averageRating,
    },
  })
}

/**
 * GET /api/v1/content/:contentId/reviews-summary
 * Aggregate stats + 3 most-recent revealed reviews for the detail screen.
 * Public endpoint — no auth required, no per-user variance in output.
 */
export async function handleReviewsSummary(c: Context): Promise<Response> {
  const contentId = c.req.param('contentId')!
  const summary = await getReviewsSummary(contentId)
  return c.json({ success: true, data: summary })
}

/**
 * POST /api/v1/reviews/reveal-due
 * Trigger reveal of all reviews where revealed_at <= now().
 * Admin-only: requires X-Admin-Secret header matching ADMIN_SECRET env var.
 */
export async function handleRevealDueReviews(c: Context): Promise<Response> {
  const adminSecret = c.req.header('X-Admin-Secret')

  if (!env.ADMIN_SECRET || adminSecret !== env.ADMIN_SECRET) {
    throw new AppError('forbidden', 403, 'Invalid admin secret')
  }

  const result = await revealDueReviews()

  return c.json({ success: true, data: result })
}
