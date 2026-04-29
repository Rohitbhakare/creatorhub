import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createBookingIntent, type CreateBookingIntentInput } from '@/lib/api'
import { getSession } from '@/lib/session'
import { logger } from '@/lib/logger'
import { AppError } from '@/lib/errors'

const Schema = z.object({
  content_id: z.string().min(1).max(64),
  scheduled_date_id: z.string().optional(),
  event_occurrence_id: z.string().optional(),
  travellers: z.number().int().min(1).max(20).optional(),
})

/**
 * POST /api/booking/start
 *
 * Concurrency-safe seat hold: passes through to API booking-intents which
 * runs the hold inside a Postgres transaction with `SELECT ... FOR UPDATE`
 * on the scheduled_date row.
 *
 * Idempotency: we generate a key per (user, contentId, dateId) so a refresh
 * within the same browser session doesn't double-hold; the API recognises
 * a duplicate and returns the existing intent.
 */
export async function POST(req: NextRequest) {
  const log = logger.child({ route: 'api/booking/start' })
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { type: 'unauthorized', status: 401, detail: 'Sign in' },
      { status: 401 },
    )
  }

  let parsed: CreateBookingIntentInput
  try {
    parsed = Schema.parse(await req.json()) as CreateBookingIntentInput
  } catch (err) {
    log.warn({ err: String(err) }, 'booking-start:bad-input')
    return NextResponse.json(
      { type: 'bad-request', status: 400, detail: 'Invalid input' },
      { status: 400 },
    )
  }

  // Stable idempotency key — same (user, content, date) yields the same key
  // across retries within ~1h, so an accidental double-click doesn't hold
  // two seats.
  const idempotencyKey = await stableKey(
    session.userId,
    parsed.content_id,
    parsed.scheduled_date_id ?? parsed.event_occurrence_id ?? 'itinerary',
  )

  try {
    const intent = await createBookingIntent(parsed, idempotencyKey)
    log.info(
      { userId: session.userId, contentId: parsed.content_id, intentId: intent.intent_id },
      'booking-start:ok',
    )
    return NextResponse.json({
      intentId: intent.intent_id,
      expiresAt: intent.expires_at,
      travellers: intent.travellers,
    })
  } catch (err) {
    const e = err instanceof AppError ? err : AppError.upstream()
    if (e.status === 409) {
      log.info({ userId: session.userId, contentId: parsed.content_id }, 'booking-start:soldout')
    } else {
      log.error({ err: e.toJSON() }, 'booking-start:failed')
    }
    return NextResponse.json(e.toJSON(), { status: e.status })
  }
}

async function stableKey(userId: string, contentId: string, targetId: string): Promise<string> {
  const epoch = Math.floor(Date.now() / (60 * 60 * 1000)) // hourly bucket
  const raw = `${userId}:${contentId}:${targetId}:${String(epoch)}`
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
  return Array.from(new Uint8Array(hash))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
