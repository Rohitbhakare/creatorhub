// Admin-initiated payout actions (E4.1, T8 · ADM-FR-004).
//
// Currently exposes a single operation: `forceReleasePayout`. This
// bypasses the 48-hour post-completion dispute window used by the
// scheduled release cron, but retains the two financial integrity
// guards (booking must be completed; no refund may be in flight) —
// those are correctness invariants, not time gates.
//
// The actual Razorpay call and DB transitions are delegated to
// `releasePayout(payoutId, { force: true })` in `payout.service`.
// This keeps payout lifecycle logic in one place.

import { releasePayout } from './payout.service.js'
import { AppError } from '../errors/AppError.js'

export interface ForceReleaseResult {
  status: 'released' | 'already_released'
}

/**
 * Force-release a payout. Throws 404 if the payout does not exist
 * (surfaced by releasePayout), 409 if the action is unsafe (booking
 * not completed, refund in flight, or no transfer id linked), and 502
 * if Razorpay rejected the release.
 */
export async function forceReleasePayout(
  payoutId: string,
): Promise<ForceReleaseResult> {
  const result = await releasePayout(payoutId, { force: true })

  if (result.status === 'released') return { status: 'released' }

  if (result.status === 'skipped') {
    switch (result.reason) {
      case 'already_released':
        return { status: 'already_released' }
      case 'booking_not_completed':
        throw new AppError(
          'conflict',
          409,
          'Cannot release payout: booking is not completed',
        )
      case 'refund_in_flight':
        throw new AppError(
          'conflict',
          409,
          'Cannot release payout: a refund is pending or processing on this booking',
        )
      case 'no_transfer_id':
        throw new AppError(
          'conflict',
          409,
          'Cannot release payout: no Razorpay transfer is linked',
        )
      case 'not_due':
        // Not reachable when force=true.
        throw new AppError('internal', 500, 'Unexpected not_due skip during force release')
    }
  }

  // result.status === 'failed' — Razorpay rejected the release.
  throw new AppError(
    'external_service',
    502,
    `Razorpay failed to release transfer: ${result.error}`,
  )
}
