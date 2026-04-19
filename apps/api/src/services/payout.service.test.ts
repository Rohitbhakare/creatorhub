import { describe, it, expect, vi, beforeEach } from 'vitest'

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

import {
  createPayoutOnPaymentCaptured,
  schedulePayoutOnBookingCompleted,
  releasePayout,
  releasePendingPayouts,
  reversePayout,
  listPayoutsForCreator,
  getPayoutSummary,
  updatePayoutByTransferId,
} from './payout.service.js'
import { supabase } from '../lib/supabase.js'
import * as razorpay from '../lib/razorpay.js'
import { AppError } from '../errors/AppError.js'

function chain(res: { data: unknown; error?: unknown }) {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(res),
    maybeSingle: vi.fn().mockResolvedValue(res),
    then: (ok: (v: unknown) => unknown, fail?: (r: unknown) => unknown) =>
      Promise.resolve(res).then(ok, fail),
  }
}

const BOOKING_ID = '22222222-2222-2222-2222-222222222222'
const CREATOR_ID = '33333333-3333-3333-3333-333333333333'
const PAYOUT_ID = '44444444-4444-4444-4444-444444444444'
const TRANSFER_ID = 'trf_aaa'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createPayoutOnPaymentCaptured', () => {
  it('inserts a pending payout with creator + amount from booking', async () => {
    const bookingChain = chain({
      data: { id: BOOKING_ID, creator_id: CREATOR_ID, creator_payout_paisa: 500_00, tds_paisa: 5_00 },
      error: null,
    })
    const insertChain = chain({ data: null, error: null })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(bookingChain as never)
      .mockReturnValueOnce(insertChain as never)

    await createPayoutOnPaymentCaptured(BOOKING_ID, TRANSFER_ID)
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        booking_id: BOOKING_ID,
        creator_id: CREATOR_ID,
        status: 'pending',
        amount_paisa: 500_00,
        tds_paisa: 5_00,
        razorpay_transfer_id: TRANSFER_ID,
      }),
    )
  })

  it('idempotent on UNIQUE violation (code 23505)', async () => {
    const bookingChain = chain({
      data: { id: BOOKING_ID, creator_id: CREATOR_ID, creator_payout_paisa: 100, tds_paisa: 0 },
      error: null,
    })
    const insertChain = chain({ data: null, error: { code: '23505' } })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(bookingChain as never)
      .mockReturnValueOnce(insertChain as never)

    await expect(createPayoutOnPaymentCaptured(BOOKING_ID, TRANSFER_ID)).resolves.toBeUndefined()
  })
})

describe('schedulePayoutOnBookingCompleted', () => {
  it('transitions pending → scheduled with +48h timer', async () => {
    const updateChain = chain({ data: null, error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(updateChain as never)

    await schedulePayoutOnBookingCompleted(BOOKING_ID)
    const patch = updateChain.update.mock.calls[0]![0] as { status: string; scheduled_at: string }
    expect(patch.status).toBe('scheduled')
    const diff = new Date(patch.scheduled_at).getTime() - Date.now()
    expect(diff).toBeGreaterThan(47 * 3600 * 1000)
    expect(diff).toBeLessThan(49 * 3600 * 1000)
  })
})

describe('releasePayout', () => {
  const payoutRow = {
    id: PAYOUT_ID,
    booking_id: BOOKING_ID,
    status: 'scheduled',
    razorpay_transfer_id: TRANSFER_ID,
    scheduled_at: new Date(Date.now() - 1000).toISOString(),
  }

  it('happy path: releases transfer and sets processing', async () => {
    const chains = [
      chain({ data: payoutRow, error: null }), // fetch payout
      chain({ data: { status: 'completed' }, error: null }), // booking
      chain({ data: [], error: null }), // refunds
      chain({ data: null, error: null }), // update processing
    ]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)
    vi.mocked(razorpay.editTransfer).mockResolvedValueOnce({
      id: TRANSFER_ID,
      status: 'processed',
      amount: 100,
      currency: 'INR',
      recipient: 'acc_1',
      on_hold: false,
    })

    const res = await releasePayout(PAYOUT_ID)
    expect(res.status).toBe('released')
    expect(razorpay.editTransfer).toHaveBeenCalledWith(TRANSFER_ID, { on_hold: 0 })
  })

  it('skips release when a refund is processing', async () => {
    const chains = [
      chain({ data: payoutRow, error: null }),
      chain({ data: { status: 'completed' }, error: null }),
      chain({ data: [{ id: 'rfn_1', status: 'processing' }], error: null }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const res = await releasePayout(PAYOUT_ID)
    expect(res).toEqual({ status: 'skipped', reason: 'refund_in_flight' })
    expect(razorpay.editTransfer).not.toHaveBeenCalled()
  })

  it('skips release when booking not completed', async () => {
    const chains = [
      chain({ data: payoutRow, error: null }),
      chain({ data: { status: 'confirmed' }, error: null }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const res = await releasePayout(PAYOUT_ID)
    expect(res).toEqual({ status: 'skipped', reason: 'booking_not_completed' })
    expect(razorpay.editTransfer).not.toHaveBeenCalled()
  })

  it('skips release when scheduled_at is in the future', async () => {
    const future = {
      ...payoutRow,
      scheduled_at: new Date(Date.now() + 3600_000).toISOString(),
    }
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: future, error: null }) as never)
    const res = await releasePayout(PAYOUT_ID)
    expect(res).toEqual({ status: 'skipped', reason: 'not_due' })
  })

  it('marks failed when Razorpay editTransfer throws', async () => {
    const chains = [
      chain({ data: payoutRow, error: null }),
      chain({ data: { status: 'completed' }, error: null }),
      chain({ data: [], error: null }),
      chain({ data: null, error: null }), // update failed
    ]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)
    vi.mocked(razorpay.editTransfer).mockRejectedValueOnce(new AppError('external_service', 502, 'rzp boom'))

    const res = await releasePayout(PAYOUT_ID)
    expect(res.status).toBe('failed')
  })
})

describe('releasePendingPayouts', () => {
  it('batches through eligible rows and counts outcomes', async () => {
    // First: query eligible rows
    const queryChain = chain({ data: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }], error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(queryChain as never)

    // For each payout, releasePayout will call from() multiple times.
    // Simplify: stub releasePayout flow to always skip (already_released).
    const skipChain = () => [
      chain({
        data: {
          id: 'x',
          booking_id: 'b',
          status: 'completed', // triggers "already_released" skip
          razorpay_transfer_id: TRANSFER_ID,
          scheduled_at: new Date().toISOString(),
        },
        error: null,
      }),
    ]
    const allChains = [...skipChain(), ...skipChain(), ...skipChain()]
    vi.mocked(supabase.from).mockImplementation(() => allChains.shift() as never)

    const res = await releasePendingPayouts()
    expect(res.released + res.skipped + res.failed).toBe(3)
    expect(res.skipped).toBe(3)
  })
})

describe('reversePayout', () => {
  it('calls Razorpay reverseTransfer and marks failed', async () => {
    const payoutChain = chain({
      data: { id: PAYOUT_ID, razorpay_transfer_id: TRANSFER_ID, status: 'scheduled' },
      error: null,
    })
    const updateChain = chain({ data: null, error: null })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(payoutChain as never)
      .mockReturnValueOnce(updateChain as never)
    vi.mocked(razorpay.reverseTransfer).mockResolvedValueOnce({
      id: 'rv_1',
      status: 'processed',
      transfer_id: TRANSFER_ID,
      amount: 500,
    })

    await reversePayout(PAYOUT_ID, 'refund', 500)
    expect(razorpay.reverseTransfer).toHaveBeenCalledWith(TRANSFER_ID, 500)
    expect(updateChain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed', failure_reason: 'refund' }),
    )
  })
})

describe('listPayoutsForCreator', () => {
  it('returns items with booking title lookup', async () => {
    const payoutsRes = [
      {
        id: 'p1',
        booking_id: BOOKING_ID,
        amount_paisa: 100,
        tds_paisa: 0,
        status: 'completed',
        scheduled_at: '2026-04-01T00:00:00Z',
        processed_at: '2026-04-03T00:00:00Z',
        failure_reason: null,
        created_at: '2026-04-03T00:00:00Z',
      },
    ]
    const payoutsChain = chain({ data: payoutsRes, error: null })
    const bookingChain = chain({ data: [{ id: BOOKING_ID, content: { title: 'Goa trek' } }], error: null })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(payoutsChain as never)
      .mockReturnValueOnce(bookingChain as never)

    const res = await listPayoutsForCreator(CREATOR_ID, {}, { limit: 20 })
    expect(res.items).toHaveLength(1)
    expect(res.items[0]!.bookingTitle).toBe('Goa trek')
    expect(res.nextCursor).toBeNull()
  })

  it('returns nextCursor when more than limit results', async () => {
    const mkRow = (i: number) => ({
      id: `p${i}`,
      booking_id: `b${i}`,
      amount_paisa: 100,
      tds_paisa: 0,
      status: 'pending',
      scheduled_at: '2026-04-01',
      processed_at: null,
      failure_reason: null,
      created_at: `2026-04-0${10 - i}T00:00:00Z`,
    })
    const payoutsRes = [mkRow(1), mkRow(2), mkRow(3)]
    vi.mocked(supabase.from)
      .mockReturnValueOnce(chain({ data: payoutsRes, error: null }) as never)
      .mockReturnValueOnce(chain({ data: [], error: null }) as never)

    const res = await listPayoutsForCreator(CREATOR_ID, {}, { limit: 2 })
    expect(res.items).toHaveLength(2)
    expect(res.nextCursor).not.toBeNull()
  })
})

describe('getPayoutSummary', () => {
  it('aggregates pending + processing + last 30d paid', async () => {
    const thirtyAgo = new Date(Date.now() - 31 * 24 * 3600_000).toISOString()
    const recent = new Date(Date.now() - 10 * 24 * 3600_000).toISOString()
    vi.mocked(supabase.from).mockReturnValueOnce(
      chain({
        data: [
          { amount_paisa: 1000, status: 'pending', processed_at: null },
          { amount_paisa: 2000, status: 'scheduled', processed_at: null },
          { amount_paisa: 5000, status: 'processing', processed_at: null },
          { amount_paisa: 7000, status: 'completed', processed_at: recent },
          { amount_paisa: 9999, status: 'completed', processed_at: thirtyAgo },
        ],
        error: null,
      }) as never,
    )

    const res = await getPayoutSummary(CREATOR_ID)
    expect(res.pendingPaisa).toBe(3000)
    expect(res.processingPaisa).toBe(5000)
    expect(res.paidLast30dPaisa).toBe(7000)
  })
})

describe('updatePayoutByTransferId', () => {
  it('writes the patch keyed on razorpay_transfer_id', async () => {
    const c = chain({ data: null, error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(c as never)

    await updatePayoutByTransferId(TRANSFER_ID, {
      status: 'completed',
      processedAt: '2026-04-19T10:00:00Z',
      razorpayPayoutId: 'pout_1',
    })
    expect(c.update).toHaveBeenCalledWith({
      status: 'completed',
      processed_at: '2026-04-19T10:00:00Z',
      razorpay_payout_id: 'pout_1',
    })
    expect(c.eq).toHaveBeenCalledWith('razorpay_transfer_id', TRANSFER_ID)
  })
})
