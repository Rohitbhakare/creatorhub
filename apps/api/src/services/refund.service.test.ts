import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (must come before any imports that touch these modules) ─────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn() }
  return { supabase: mockSupabase }
})

// Mock global fetch for Razorpay API calls
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import {
  calculateRefundAmount,
  getRefundPolicy,
  setRefundPolicy,
  cancelBookingByBuyer,
  cancelBookingByCreator,
  getRefundStatus,
} from './refund.service.js'
import { supabase } from '../lib/supabase.js'

// ─── Mock helpers ──────────────────────────────────────────────────────────

function mockChain(
  data: unknown,
  error: unknown = null,
  singleData?: unknown,
) {
  const resolvedVal = { data, error, count: null }
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: singleData ?? data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data: singleData ?? data, error }),
    then: (
      onFulfilled: (val: typeof resolvedVal) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolvedVal).then(onFulfilled, onRejected),
  }
  return chain
}

function mockRazorpayRefundOk(refundId = 'rfnd_001') {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ id: refundId }),
  })
}

// ─── Fixtures ──────────────────────────────────────────────────────────────

const BUYER_ID = 'user-buyer-001'
const CREATOR_ID = 'user-creator-001'
const CONTENT_ID = 'content-001'
const BOOKING_ID = 'booking-001'
const SCHEDULED_DATE_ID = 'sd-001'
const PAYMENT_ID = 'pay_001'

// 10 days from now
const FAR_FUTURE = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
// 5 days from now (middle window)
const MID_FUTURE = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
// 1 day from now (< 2 days window)
const NEAR_FUTURE = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()

const confirmedBooking = {
  id: BOOKING_ID,
  user_id: BUYER_ID,
  creator_id: CREATOR_ID,
  content_id: CONTENT_ID,
  scheduled_date_id: SCHEDULED_DATE_ID,
  status: 'confirmed',
  total_paisa: 100000,
  razorpay_payment_id: PAYMENT_ID,
}

const scheduledDateFarFuture = {
  id: SCHEDULED_DATE_ID,
  start_date: FAR_FUTURE,
  spots_booked: 3,
}

const scheduledDateNearFuture = {
  id: SCHEDULED_DATE_ID,
  start_date: NEAR_FUTURE,
  spots_booked: 3,
}

// ─── calculateRefundAmount ─────────────────────────────────────────────────

describe('calculateRefundAmount', () => {
  const TOTAL = 100000 // 100000 paisa = ₹1000

  // Flexible policy
  describe('flexible policy', () => {
    it('returns 100% when > 7 days before start', () => {
      expect(calculateRefundAmount(TOTAL, 'flexible', 8)).toBe(100000)
    })

    it('returns 50% when 2-7 days before start', () => {
      expect(calculateRefundAmount(TOTAL, 'flexible', 5)).toBe(50000)
    })

    it('returns 0% when < 2 days before start', () => {
      expect(calculateRefundAmount(TOTAL, 'flexible', 1)).toBe(0)
    })
  })

  // Moderate policy
  describe('moderate policy', () => {
    it('returns 75% when > 7 days before start', () => {
      expect(calculateRefundAmount(TOTAL, 'moderate', 10)).toBe(75000)
    })

    it('returns 25% when 2-7 days before start', () => {
      expect(calculateRefundAmount(TOTAL, 'moderate', 3)).toBe(25000)
    })

    it('returns 0% when < 2 days before start', () => {
      expect(calculateRefundAmount(TOTAL, 'moderate', 0)).toBe(0)
    })
  })

  // Strict policy
  describe('strict policy', () => {
    it('returns 50% when > 7 days before start', () => {
      expect(calculateRefundAmount(TOTAL, 'strict', 14)).toBe(50000)
    })

    it('returns 0% when 2-7 days before start', () => {
      expect(calculateRefundAmount(TOTAL, 'strict', 4)).toBe(0)
    })

    it('returns 0% when < 2 days before start', () => {
      expect(calculateRefundAmount(TOTAL, 'strict', 1)).toBe(0)
    })
  })

  // Boundary cases
  describe('boundary days', () => {
    it('exactly 7 days → middle tier (2-7 days), flexible → 50%', () => {
      expect(calculateRefundAmount(TOTAL, 'flexible', 7)).toBe(50000)
    })

    it('exactly 2 days → middle tier (2-7 days), moderate → 25%', () => {
      expect(calculateRefundAmount(TOTAL, 'moderate', 2)).toBe(25000)
    })
  })
})

// ─── getRefundPolicy ──────────────────────────────────────────────────────

describe('getRefundPolicy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns policy type when found', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      mockChain({ policy_type: 'moderate' }) as never,
    )

    const result = await getRefundPolicy(CONTENT_ID)
    expect(result).toBe('moderate')
  })

  it('returns null when no policy found', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      mockChain(null) as never,
    )

    const result = await getRefundPolicy(CONTENT_ID)
    expect(result).toBeNull()
  })
})

// ─── setRefundPolicy ──────────────────────────────────────────────────────

describe('setRefundPolicy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets policy successfully when caller is the content owner', async () => {
    // First call: content lookup
    vi.mocked(supabase.from)
      .mockReturnValueOnce(
        mockChain({ id: CONTENT_ID, user_id: CREATOR_ID }) as never,
      )
      // Second call: upsert
      .mockReturnValueOnce(
        mockChain(null) as never,
      )

    await expect(
      setRefundPolicy(CONTENT_ID, CREATOR_ID, 'strict'),
    ).resolves.toBeUndefined()
  })

  it('throws 403 when caller is not the content owner', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain({ id: CONTENT_ID, user_id: CREATOR_ID }) as never,
    )

    await expect(
      setRefundPolicy(CONTENT_ID, BUYER_ID, 'flexible'),
    ).rejects.toMatchObject({ status: 403 })
  })
})

// ─── cancelBookingByBuyer ────────────────────────────────────────────────

describe('cancelBookingByBuyer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it('issues full refund for flexible policy > 7 days out', async () => {
    mockRazorpayRefundOk('rfnd_full')

    vi.mocked(supabase.from)
      // 1. booking lookup
      .mockReturnValueOnce(
        mockChain(confirmedBooking) as never,
      )
      // 2. scheduled_date lookup
      .mockReturnValueOnce(
        mockChain(scheduledDateFarFuture) as never,
      )
      // 3. refund_policies lookup (null → flexible default)
      .mockReturnValueOnce(
        mockChain(null) as never,
      )
      // 4. bookings UPDATE (cancel)
      .mockReturnValueOnce(
        mockChain(null) as never,
      )
      // 5. scheduled_dates UPDATE (decrement spots)
      .mockReturnValueOnce(
        mockChain(null) as never,
      )
      // 6. refunds INSERT
      .mockReturnValueOnce(
        mockChain({ id: 'refund-row-001' }) as never,
      )

    const result = await cancelBookingByBuyer(BOOKING_ID, BUYER_ID)

    expect(result.refundAmountPaisa).toBe(100000) // 100% of 100000
    expect(result.refundId).toBe('refund-row-001')
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('issues zero refund for moderate policy < 2 days out', async () => {
    vi.mocked(supabase.from)
      // 1. booking lookup
      .mockReturnValueOnce(
        mockChain(confirmedBooking) as never,
      )
      // 2. scheduled_date lookup — near future
      .mockReturnValueOnce(
        mockChain(scheduledDateNearFuture) as never,
      )
      // 3. refund_policies lookup — moderate
      .mockReturnValueOnce(
        mockChain({ policy_type: 'moderate' }) as never,
      )
      // 4. bookings UPDATE
      .mockReturnValueOnce(
        mockChain(null) as never,
      )
      // 5. scheduled_dates UPDATE
      .mockReturnValueOnce(
        mockChain(null) as never,
      )
      // 6. refunds INSERT
      .mockReturnValueOnce(
        mockChain({ id: 'refund-row-002' }) as never,
      )

    const result = await cancelBookingByBuyer(BOOKING_ID, BUYER_ID)

    expect(result.refundAmountPaisa).toBe(0)
    expect(mockFetch).not.toHaveBeenCalled() // no Razorpay call when 0
  })

  it('throws 422 when booking is already cancelled', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain({
        ...confirmedBooking,
        status: 'cancelled',
      }) as never,
    )

    await expect(
      cancelBookingByBuyer(BOOKING_ID, BUYER_ID),
    ).rejects.toMatchObject({ status: 422 })
  })
})

// ─── cancelBookingByCreator ──────────────────────────────────────────────

describe('cancelBookingByCreator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it('cancels booking and initiates full refund', async () => {
    mockRazorpayRefundOk('rfnd_creator_001')

    vi.mocked(supabase.from)
      // 1. booking lookup
      .mockReturnValueOnce(
        mockChain(confirmedBooking) as never,
      )
      // 2. bookings UPDATE (cancel)
      .mockReturnValueOnce(
        mockChain(null) as never,
      )
      // 3. scheduled_dates SELECT (spots_booked)
      .mockReturnValueOnce(
        mockChain({ spots_booked: 3 }) as never,
      )
      // 4. scheduled_dates UPDATE (decrement)
      .mockReturnValueOnce(
        mockChain(null) as never,
      )
      // 5. refunds INSERT
      .mockReturnValueOnce(
        mockChain(null) as never,
      )

    await expect(
      cancelBookingByCreator(BOOKING_ID, CREATOR_ID, 'Creator is unavailable'),
    ).resolves.toBeUndefined()

    // Full refund was sent to Razorpay
    expect(mockFetch).toHaveBeenCalledOnce()
    const callBody = JSON.parse((mockFetch.mock.calls[0] as [string, RequestInit])[1]?.body as string) as { amount: number }
    expect(callBody.amount).toBe(100000)
  })
})

// ─── getRefundStatus ──────────────────────────────────────────────────────

describe('getRefundStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns status and amount when refund exists', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      mockChain({ status: 'processed', amount_paisa: 75000 }) as never,
    )

    const result = await getRefundStatus(BOOKING_ID)
    expect(result).toEqual({ status: 'processed', amountPaisa: 75000 })
  })

  it('returns null when no refund exists', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      mockChain(null) as never,
    )

    const result = await getRefundStatus(BOOKING_ID)
    expect(result).toBeNull()
  })
})
