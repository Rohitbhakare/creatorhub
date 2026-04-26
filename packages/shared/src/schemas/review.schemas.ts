import { z } from 'zod'

// Inline to avoid circular dependency with index.ts
const uuidSchema = z.string().uuid()
const cursorSchema = z.string().optional()
const limitSchema = z.coerce.number().int().min(1).max(50).default(20)

export const submitReviewSchema = z.object({
  booking_id: uuidSchema,
  rating: z.number().int().min(1).max(5),
  reviewer_text: z.string().min(1, 'Review text is required').max(500),
})

export const submitCreatorResponseSchema = z.object({
  response: z.string().min(1, 'Response text is required').max(500),
})

export const reviewListQuerySchema = z.object({
  cursor: cursorSchema,
  limit: limitSchema,
})

// Output shape for GET /api/v1/content/:contentId/reviews-summary
export const reviewsSummarySchema = z.object({
  average: z.number(),
  count: z.number().int().nonnegative(),
  breakdown: z.object({
    1: z.number().int().nonnegative(),
    2: z.number().int().nonnegative(),
    3: z.number().int().nonnegative(),
    4: z.number().int().nonnegative(),
    5: z.number().int().nonnegative(),
  }),
  recent: z.array(z.unknown()).max(3),
})

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>
export type SubmitCreatorResponseInput = z.infer<typeof submitCreatorResponseSchema>
export type ReviewListQueryInput = z.infer<typeof reviewListQuerySchema>
export type ReviewsSummary = z.infer<typeof reviewsSummarySchema>
