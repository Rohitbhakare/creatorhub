import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiFetch } from '@/lib/api-client'
import { getSession } from '@/lib/session'
import { logger } from '@/lib/logger'
import { AppError } from '@/lib/errors'

const Schema = z.object({
  travellers: z.array(
    z.object({
      name: z.string().min(1).max(120),
      email: z.string().email().max(180),
      phone: z.string().min(8).max(20),
    }),
  ),
})

interface ConfirmResult {
  bookingId: string
  paymentSessionUrl?: string
}

/**
 * POST /api/booking/[intentId]/confirm
 *
 * Converts a held intent into a confirmed booking. The API does the
 * transactional work:
 *  1. Re-checks the hold is still valid.
 *  2. Creates a Razorpay order.
 *  3. Returns the bookingId and payment session URL.
 *
 * If the hold has expired, returns 410 — UI maps that to "start over".
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ intentId: string }> },
) {
  const log = logger.child({ route: 'api/booking/confirm' })
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { type: 'unauthorized', status: 401, detail: 'Sign in' },
      { status: 401 },
    )
  }

  const { intentId } = await context.params

  let body
  try {
    body = Schema.parse(await req.json())
  } catch (err) {
    log.warn({ err: String(err) }, 'booking-confirm:bad-input')
    return NextResponse.json(
      { type: 'bad-request', status: 400, detail: 'Invalid input' },
      { status: 400 },
    )
  }

  try {
    const result = await apiFetch<ConfirmResult>(`/api/v1/bookings`, {
      method: 'POST',
      body: { intent_id: intentId, travellers: body.travellers },
      idempotencyKey: `confirm:${intentId}`,
      retries: 0,
      timeoutMs: 12_000,
    })

    log.info(
      { userId: session.userId, intentId, bookingId: result.bookingId },
      'booking-confirm:ok',
    )
    return NextResponse.json(result)
  } catch (err) {
    const e = err instanceof AppError ? err : AppError.upstream()
    log.error({ err: e.toJSON(), intentId }, 'booking-confirm:failed')
    return NextResponse.json(e.toJSON(), { status: e.status })
  }
}
