import { z } from 'zod'

export const PAYOUT_STATUSES = [
  'pending',
  'scheduled',
  'processing',
  'completed',
  'failed',
] as const

export const listPayoutsQuerySchema = z.object({
  status: z.enum(PAYOUT_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().optional(),
})

export type ListPayoutsQueryInput = z.infer<typeof listPayoutsQuerySchema>
