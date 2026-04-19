/**
 * Payout Lifecycle — end-to-end integration (E2.12 T17).
 *
 * Exercises the full happy path with mocked Supabase + Razorpay + notifications:
 *
 *   1. payment.captured webhook → createPayoutOnPaymentCaptured (status=pending)
 *   2. booking.completed        → schedulePayoutOnBookingCompleted (status=scheduled)
 *   3. cron tick                → releasePendingPayouts → editTransfer (status=processing)
 *   4. transfer.settled webhook → status=completed + notifyPayoutProcessed
 *
 * Plus failure branch:
 *   3'. editTransfer throws     → status=failed + notifyPayoutFailed
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'node:crypto'

vi.mock('../lib/supabase.js', () => ({
  supabase: { from: vi.fn() },
}))

vi.mock('../lib/razorpay.js', () => ({
  editTransfer: vi.fn(),
  reverseTransfer: vi.fn(),
}))

vi.mock('./payout-notifications.service.js', () => ({
  notifyPayoutsEnabled: vi.fn().mockResolvedValue(undefined),
  notifyPayoutProcessed: vi.fn().mockResolvedValue(undefined),
  notifyPayoutFailed: vi.fn().mockResolvedValue(undefined),
  notifyLinkedAccountActionRequired: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../env.js', () => ({
  env: {
    RAZORPAY_WEBHOOK_SECRET: 'webhook_secret_test_32_chars_xx',
    NODE_ENV: 'test',
  },
}))

import {
  createPayoutOnPaymentCaptured,
  schedulePayoutOnBookingCompleted,
  releasePayout,
  releasePendingPayouts,
} from './payout.service.js'
import { handleRazorpayWebhook } from '../handlers/webhooks.razorpay.js'
import { supabase } from '../lib/supabase.js'
import * as razorpay from '../lib/razorpay.js'
import {
  notifyPayoutProcessed,
  notifyPayoutFailed,
} from './payout-notifications.service.js'

const SECRET = 'webhook_secret_test_32_chars_xx'
const BOOKING_ID = 'bk_1111'
const CREATOR_ID = '22222222-2222-2222-2222-222222222222'
const PAYOUT_ID = '33333333-3333-3333-3333-333333333333'
const TRANSFER_ID = 'trf_abc'

function sign(body: string): string {
  return crypto.createHmac('sha256', SECRET).update(body).digest('hex')
}

function makeCtx(body: string, headers: Record<string, string>) {
  const json = vi.fn((data: unknown, status?: number) => ({
    status: status ?? 200,
    body: data,
  }))
  return {
    req: {
      text: async () => body,
      header: (name: string) => headers[name.toLowerCase()],
    },
    json,
  } as unknown as Parameters<typeof handleRazorpayWebhook>[0]
}

function chain(res: { data: unknown; error?: unknown }) {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(res),
    single: vi.fn().mockResolvedValue(res),
    then: (ok: (v: unknown) => unknown, fail?: (r: unknown) => unknown) =>
      Promise.resolve(res).then(ok, fail),
  }
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe('Payout lifecycle — happy path', () => {
  it('Step 1: payment.captured webhook creates the payout row', async () => {
    // Webhook-level from() calls:
    //   1. razorpay_webhook_events.insert
    //   2. bookings lookup by razorpay_order_id
    // Then createPayoutOnPaymentCaptured:
    //   3. bookings lookup (creator + amount)
    //   4. payouts insert
    // Then handleRazorpayWebhook tail:
    //   5. razorpay_webhook_events.update processed=true
    vi.mocked(supabase.from)
      .mockReturnValueOnce(chain({ data: null, error: null }) as never)
      .mockReturnValueOnce(chain({ data: { id: BOOKING_ID }, error: null }) as never)
      .mockReturnValueOnce(
        chain({
          data: {
            id: BOOKING_ID,
            creator_id: CREATOR_ID,
            creator_payout_paisa: 500000,
            tds_paisa: 5000,
          },
          error: null,
        }) as never,
      )
      .mockReturnValueOnce(chain({ data: null, error: null }) as never)
      .mockReturnValueOnce(chain({ data: null, error: null }) as never)

    const captureBody = JSON.stringify({
      event: 'payment.captured',
      id: 'evt_pc_1',
      payload: {
        payment: { entity: { order_id: 'ord_abc', transfers: [] } },
        order: { entity: { id: 'ord_abc', transfers: [{ id: TRANSFER_ID }] } },
      },
    })

    await handleRazorpayWebhook(
      makeCtx(captureBody, { 'x-razorpay-signature': sign(captureBody) }) as never,
    )

    const calls = vi.mocked(supabase.from).mock.calls.map((c) => c[0])
    expect(calls).toContain('payouts')
    expect(calls).toContain('bookings')
  })

  it('Step 2: booking.completed schedules the payout', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: null, error: null }) as never)
    await schedulePayoutOnBookingCompleted(BOOKING_ID)
    expect(supabase.from).toHaveBeenCalledWith('payouts')
  })

  it('Step 3: cron release calls Razorpay and flips to processing', async () => {
    vi.mocked(razorpay.editTransfer).mockResolvedValueOnce({} as never)

    vi.mocked(supabase.from)
      // eligible rows
      .mockReturnValueOnce(chain({ data: [{ id: PAYOUT_ID }], error: null }) as never)
      // fetch payout
      .mockReturnValueOnce(
        chain({
          data: {
            id: PAYOUT_ID,
            booking_id: BOOKING_ID,
            status: 'scheduled',
            razorpay_transfer_id: TRANSFER_ID,
            scheduled_at: new Date(Date.now() - 60_000).toISOString(),
          },
          error: null,
        }) as never,
      )
      // booking status check
      .mockReturnValueOnce(chain({ data: { status: 'completed' }, error: null }) as never)
      // refunds
      .mockReturnValueOnce(chain({ data: [], error: null }) as never)
      // update → processing
      .mockReturnValueOnce(chain({ data: null, error: null }) as never)

    const result = await releasePendingPayouts()
    expect(result.released).toBe(1)
    expect(razorpay.editTransfer).toHaveBeenCalledWith(TRANSFER_ID, { on_hold: 0 })
  })

  it('Step 4: transfer.settled webhook marks completed + fires notifyPayoutProcessed', async () => {
    vi.mocked(supabase.from)
      // webhook: insert event
      .mockReturnValueOnce(chain({ data: null, error: null }) as never)
      // notifyCompletionIfFirst: status lookup (processing ≠ completed → notify)
      .mockReturnValueOnce(chain({ data: { status: 'processing' }, error: null }) as never)
      // payoutContextForTransfer: payout row
      .mockReturnValueOnce(
        chain({
          data: {
            creator_id: CREATOR_ID,
            amount_paisa: 500000,
            tds_paisa: 5000,
            booking_id: BOOKING_ID,
          },
          error: null,
        }) as never,
      )
      // payoutContextForTransfer: booking title lookup
      .mockReturnValueOnce(
        chain({ data: { content: { title: 'Sunset Trek' } }, error: null }) as never,
      )
      // updatePayoutByTransferId: update → completed
      .mockReturnValueOnce(chain({ data: null, error: null }) as never)
      // handleRazorpayWebhook tail: update event processed
      .mockReturnValueOnce(chain({ data: null, error: null }) as never)

    const settleBody = JSON.stringify({
      event: 'transfer.settled',
      id: 'evt_t_set',
      payload: { transfer: { entity: { id: TRANSFER_ID } } },
    })

    await handleRazorpayWebhook(
      makeCtx(settleBody, { 'x-razorpay-signature': sign(settleBody) }) as never,
    )

    expect(vi.mocked(notifyPayoutProcessed)).toHaveBeenCalledWith(
      CREATOR_ID,
      expect.objectContaining({
        amountPaisa: 500000,
        tdsPaisa: 5000,
        bookingTitle: 'Sunset Trek',
      }),
    )
  })
})

describe('Payout lifecycle — release failure', () => {
  it('Razorpay editTransfer throws → status=failed + notifyPayoutFailed fires', async () => {
    vi.mocked(razorpay.editTransfer).mockRejectedValueOnce(new Error('razorpay_5xx'))

    vi.mocked(supabase.from)
      // fetch payout
      .mockReturnValueOnce(
        chain({
          data: {
            id: PAYOUT_ID,
            booking_id: BOOKING_ID,
            status: 'scheduled',
            razorpay_transfer_id: TRANSFER_ID,
            scheduled_at: new Date(Date.now() - 60_000).toISOString(),
          },
          error: null,
        }) as never,
      )
      // booking status check
      .mockReturnValueOnce(chain({ data: { status: 'completed' }, error: null }) as never)
      // refund in-flight check
      .mockReturnValueOnce(chain({ data: [], error: null }) as never)
      // update → failed
      .mockReturnValueOnce(chain({ data: null, error: null }) as never)
      // notifyReleaseFailure: payouts lookup
      .mockReturnValueOnce(
        chain({
          data: { creator_id: CREATOR_ID, booking_id: BOOKING_ID },
          error: null,
        }) as never,
      )
      // notifyReleaseFailure: bookings.content title lookup
      .mockReturnValueOnce(
        chain({ data: { content: { title: 'Sunset Trek' } }, error: null }) as never,
      )

    const result = await releasePayout(PAYOUT_ID)

    expect(result).toEqual({ status: 'failed', error: 'razorpay_5xx' })
    expect(vi.mocked(notifyPayoutFailed)).toHaveBeenCalledWith(
      CREATOR_ID,
      expect.objectContaining({ reason: 'razorpay_5xx' }),
    )
  })
})
