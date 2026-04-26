/**
 * Internal cron endpoints (E2.12 T10).
 *
 * Protected by a constant-time comparison against INTERNAL_CRON_KEY passed in
 * the `x-internal-cron-key` header. Fly scheduled machines / GitHub Actions
 * are the only expected callers.
 *
 *   POST /internal/cron/payouts/release   → batch release scheduled payouts
 */

import type { Context } from 'hono'
import crypto from 'node:crypto'
import { env } from '../env.js'
import { AppError } from '../errors/AppError.js'
import { releasePendingPayouts } from '../services/payout.service.js'
import { sweepExpiredIntents } from '../services/booking-intent.service.js'

export function assertCronAuth(c: Context): void {
  const expected = env.INTERNAL_CRON_KEY
  if (!expected) {
    // Fail closed — never run cron endpoints in an unconfigured environment.
    throw new AppError('internal', 500, 'INTERNAL_CRON_KEY not configured')
  }
  const header = c.req.header('x-internal-cron-key')
  if (!header) {
    throw new AppError('unauthorized', 401, 'Missing x-internal-cron-key')
  }

  const a = Buffer.from(expected)
  const b = Buffer.from(header)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new AppError('forbidden', 403, 'Invalid cron key')
  }
}

export async function handleReleasePayoutsCron(c: Context): Promise<Response> {
  assertCronAuth(c)
  const result = await releasePendingPayouts()
  return c.json({ success: true, data: result })
}

export async function handleSweepBookingIntentsCron(
  c: Context,
): Promise<Response> {
  assertCronAuth(c)
  const result = await sweepExpiredIntents()
  return c.json({ success: true, data: result })
}
