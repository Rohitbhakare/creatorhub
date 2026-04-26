import { z } from 'zod'

const uuidSchema = z.string().uuid()

// POST /api/v1/booking-intents
// Body must specify which content + (optionally) which scarce target. Itinerary
// purchases omit both date/occurrence ids — they're digital goods.
export const createBookingIntentSchema = z
  .object({
    content_id: uuidSchema,
    scheduled_date_id: uuidSchema.optional(),
    event_occurrence_id: uuidSchema.optional(),
    travellers: z.number().int().min(1).max(20).default(1),
  })
  .refine(
    (d) => !(d.scheduled_date_id && d.event_occurrence_id),
    'Provide only one of scheduled_date_id or event_occurrence_id',
  )

export type CreateBookingIntentInput = z.infer<typeof createBookingIntentSchema>
