import { Hono } from 'hono'
import {
  handleSubmitReview,
  handleSubmitCreatorResponse,
  handleGetReview,
  handleListContentReviews,
  handleReviewsSummary,
  handleRevealDueReviews,
} from '../handlers/reviews.js'
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import {
  submitReviewSchema,
  submitCreatorResponseSchema,
  reviewListQuerySchema,
} from '@creatorhub/shared'

const reviewsRoutes = new Hono()

// ── Submit review (booking owner only) ──────────────────────────
reviewsRoutes.post(
  '/',
  authenticate,
  validateBody(submitReviewSchema),
  handleSubmitReview,
)

// ── Submit creator response ──────────────────────────────────────
reviewsRoutes.post(
  '/:id/response',
  authenticate,
  validateBody(submitCreatorResponseSchema),
  handleSubmitCreatorResponse,
)

// ── Get single review ────────────────────────────────────────────
reviewsRoutes.get('/:id', optionalAuthenticate, handleGetReview)

// ── Admin: reveal due reviews ────────────────────────────────────
// NOTE: must come before /:id to avoid conflict
reviewsRoutes.post('/reveal-due', handleRevealDueReviews)

export default reviewsRoutes

// ── Content-scoped reviews list (mounted separately in index.ts) ─

export const contentReviewsRoutes = new Hono()

contentReviewsRoutes.get(
  '/:contentId/reviews',
  optionalAuthenticate,
  validateQuery(reviewListQuerySchema),
  handleListContentReviews,
)

contentReviewsRoutes.get(
  '/:contentId/reviews-summary',
  handleReviewsSummary,
)
