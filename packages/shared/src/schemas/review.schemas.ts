import { z } from 'zod'
import { uuidSchema, cursorSchema, limitSchema } from './index.js'

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

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>
export type SubmitCreatorResponseInput = z.infer<typeof submitCreatorResponseSchema>
export type ReviewListQueryInput = z.infer<typeof reviewListQuerySchema>
