import type { Context } from 'hono'
import {
  createIntent,
  releaseIntent,
  type IntentTarget,
} from '../services/booking-intent.service.js'
import { AppError } from '../errors/AppError.js'
import type { CreateBookingIntentInput } from '@creatorhub/shared'

/**
 * POST /api/v1/booking-intents
 * Body: { content_id, scheduled_date_id?, event_occurrence_id?, travellers }
 * Exactly one of scheduled_date_id / event_occurrence_id may be set; both
 * omitted means an itinerary unlock (no scarcity).
 */
export async function handleCreateBookingIntent(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const body = c.get('validatedBody') as CreateBookingIntentInput

  let target: IntentTarget
  if (body.scheduled_date_id && body.event_occurrence_id) {
    throw new AppError(
      'validation',
      422,
      'Provide only one of scheduled_date_id or event_occurrence_id',
    )
  } else if (body.scheduled_date_id) {
    target = { kind: 'scheduled_date', scheduledDateId: body.scheduled_date_id }
  } else if (body.event_occurrence_id) {
    target = {
      kind: 'event_occurrence',
      eventOccurrenceId: body.event_occurrence_id,
    }
  } else {
    target = { kind: 'itinerary' }
  }

  const intent = await createIntent(
    userId,
    body.content_id,
    target,
    body.travellers ?? 1,
  )

  c.header('Location', `/api/v1/booking-intents/${intent.id}`)
  return c.json(
    {
      success: true,
      data: {
        intent_id: intent.id,
        expires_at: intent.expiresAt,
        travellers: intent.travellers,
      },
    },
    201,
  )
}

/**
 * DELETE /api/v1/booking-intents/:id
 * User backed out — release the hold immediately.
 */
export async function handleReleaseBookingIntent(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const intentId = c.req.param('id')!
  await releaseIntent(intentId, userId)
  return c.json({ success: true, data: { released: true } })
}
