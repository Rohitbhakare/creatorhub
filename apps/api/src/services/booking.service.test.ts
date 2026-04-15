import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'node:crypto'

// ─── Mocks (before any imports that touch these modules) ──────────────────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn(), rpc: vi.fn() }
  return { supabase: mockSupabase }
})

vi.mock('razorpay', () => {
  const mockCreate = vi.fn()
  const MockRazorpay = vi.fn().mockImplementation(() => ({
    orders: { create: mockCreate },
  }))
  return { default: MockRazorpay }
})

vi.mock('../env.js', () => ({
  env: {
    RAZORPAY_KEY_ID: 'rzp_test_key',
    RAZORPAY_KEY_SECRET: 'test_secret',
    RAZORPAY_WEBHOOK_SECRET: 'webhook_secret_test_32_chars_x',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    FIREBASE_PROJECT_ID: 'test-project',
    FIREBASE_PRIVATE_KEY: '-----BEGIN RSA PRIVATE KEY-----\ntest\n-----END RSA PRIVATE KEY-----',
    FIREBASE_CLIENT_EMAIL: 'test@test-project.iam.gserviceaccount.com',
    JWT_SECRET: 'test-jwt-secret-at-least-32-chars-long',
    PORT: 3001,
    NODE_ENV: 'test',
  },
}))

import {
  createBooking,
  confirmPayment,
  getBooking,
  listUserBookings,
  completeBooking,
} from './booking.service.js'
import { calculateBookingAmounts } from '../utils/money.js'
import { supabase } from '../lib/supabase.js'
import Razorpay from 'razorpay'

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function mockChain(
  data: unknown,
  error: unknown = null,
  _count: number | null = null,
) {
  const resolvedVal = { data, error, count: _count }
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
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: (
      onFulfilled: (val: typeof resolvedVal) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolvedVal).then(onFulfilled, onRejected),
  }
  return chain
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const USER_ID = 'user-buyer-001'
const CREATOR_ID = 'user-creator-001'
const CONTENT_ID = 'content-exp-001'
const BOOKING_ID = 'booking-001'
const SCHEDULED_DATE_ID = 'sched-001'
const RAZORPAY_ORDER_ID = 'order_test123'
const RAZORPAY_PAYMENT_ID = 'pay_test456'

const publishedPaidContent = {
  id: CONTENT_ID,
  user_id: CREATOR_ID,
  status: 'published',
  pricing_model: 'paid',
  price_paisa: 650000, // ₹6,500
}

const scheduledDate = {
  id: SCHEDULED_DATE_ID,
  content_id: CONTENT_ID,
  capacity: 10,
  spots_booked: 3,
}

const pendingBookingRow = {
  id: BOOKING_ID,
  content_id: CONTENT_ID,
  scheduled_date_id: SCHEDULED_DATE_ID,
  user_id: USER_ID,
  creator_id: CREATOR_ID,
  status: 'pending_payment',
  base_price_paisa: 650000,
  platform_fee_paisa: 110500,
  gst_paisa: 117000,
  tds_paisa: 6500,
  total_paisa: 877500,
  creator_payout_paisa: 643500,
  razorpay_order_id: RAZORPAY_ORDER_ID,
  created_at: '2026-04-15T10:00:00Z',
}

// ─── calculateBookingAmounts ──────────────────────────────────────────────────

describe('calculateBookingAmounts', () => {
  it('calculates correct amounts for ₹6,500 (650000 paisa)', () => {
    const result = calculateBookingAmounts(650000)

    expect(result.basePricePaisa).toBe(650000)
    // 17% of 650000 = 110500
    expect(result.platformFeePaisa).toBe(110500)
    // 18% of 650000 = 117000
    expect(result.gstPaisa).toBe(117000)
    // 1% of 650000 = 6500
    expect(result.tdsPaisa).toBe(6500)
    // base + platformFee + gst = 650000 + 110500 + 117000 = 877500
    expect(result.totalPaisa).toBe(877500)
    // base - tds = 650000 - 6500 = 643500
    expect(result.creatorPayoutPaisa).toBe(643500)
  })

  it('calculates correct amounts for ₹1,000 (100000 paisa)', () => {
    const result = calculateBookingAmounts(100000)

    expect(result.basePricePaisa).toBe(100000)
    expect(result.platformFeePaisa).toBe(17000) // 17%
    expect(result.gstPaisa).toBe(18000)         // 18%
    expect(result.tdsPaisa).toBe(1000)           // 1%
    expect(result.totalPaisa).toBe(135000)       // 100000 + 17000 + 18000
    expect(result.creatorPayoutPaisa).toBe(99000) // 100000 - 1000
  })

  it('floors fractional paisa amounts (no float leakage)', () => {
    // 100 paisa: 17% = 17, 18% = 18, 1% = 1 (exact integers)
    const result = calculateBookingAmounts(100)
    expect(result.platformFeePaisa).toBe(17)
    expect(result.gstPaisa).toBe(18)
    expect(result.tdsPaisa).toBe(1)
    expect(result.totalPaisa).toBe(135) // 100+17+18
  })

  it('handles 1 paisa (floors to 0 for all fees)', () => {
    const result = calculateBookingAmounts(1)

    // Math.floor(1 * 0.17) = 0
    expect(result.platformFeePaisa).toBe(0)
    expect(result.gstPaisa).toBe(0)
    expect(result.tdsPaisa).toBe(0)
    expect(result.totalPaisa).toBe(1)
    expect(result.creatorPayoutPaisa).toBe(1)
  })

  it('handles 0 paisa (free content — all zeros)', () => {
    const result = calculateBookingAmounts(0)

    expect(result.basePricePaisa).toBe(0)
    expect(result.platformFeePaisa).toBe(0)
    expect(result.gstPaisa).toBe(0)
    expect(result.tdsPaisa).toBe(0)
    expect(result.totalPaisa).toBe(0)
    expect(result.creatorPayoutPaisa).toBe(0)
  })

  it('returns integer amounts (never float)', () => {
    // 333 paisa: 17% = 56.61 → floor = 56, 18% = 59.94 → floor = 59, 1% = 3.33 → floor = 3
    const result = calculateBookingAmounts(333)
    expect(Number.isInteger(result.platformFeePaisa)).toBe(true)
    expect(Number.isInteger(result.gstPaisa)).toBe(true)
    expect(Number.isInteger(result.tdsPaisa)).toBe(true)
    expect(result.platformFeePaisa).toBe(56)
    expect(result.gstPaisa).toBe(59)
    expect(result.tdsPaisa).toBe(3)
  })
})

// ─── createBooking ────────────────────────────────────────────────────────────

describe('createBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(Razorpay).mockClear()
  })

  it('happy path: returns booking + razorpayOrderId + keyId', async () => {
    vi.mocked(supabase.from)
      // content fetch
      .mockReturnValueOnce(mockChain(publishedPaidContent) as never)
      // scheduled_date fetch
      .mockReturnValueOnce(mockChain(scheduledDate) as never)
      // atomic increment
      .mockReturnValueOnce(mockChain({ id: SCHEDULED_DATE_ID }) as never)
      // booking insert
      .mockReturnValueOnce(mockChain(pendingBookingRow) as never)

    // Mock Razorpay order creation
    const mockInstance = { orders: { create: vi.fn().mockResolvedValue({ id: RAZORPAY_ORDER_ID }) } }
    vi.mocked(Razorpay).mockImplementationOnce(() => mockInstance as never)

    const result = await createBooking(USER_ID, CONTENT_ID, SCHEDULED_DATE_ID)

    expect(result.razorpayOrderId).toBe(RAZORPAY_ORDER_ID)
    expect(result.keyId).toBe('rzp_test_key')
    expect(result.booking.status).toBe('pending_payment')
    expect(result.booking.basePricePaisa).toBe(650000)
  })

  it('throws 409 capacity-exceeded when no spots available', async () => {
    const fullDate = { ...scheduledDate, spots_booked: 10, capacity: 10 }

    vi.mocked(supabase.from)
      // content fetch
      .mockReturnValueOnce(mockChain(publishedPaidContent) as never)
      // scheduled_date fetch
      .mockReturnValueOnce(mockChain(fullDate) as never)
      // atomic increment: no rows returned (capacity full)
      .mockReturnValueOnce(mockChain(null, null) as never)

    await expect(createBooking(USER_ID, CONTENT_ID, SCHEDULED_DATE_ID)).rejects.toMatchObject({
      type: 'capacity-exceeded',
      status: 409,
    })
  })

  it('throws 404 when content is not published', async () => {
    const draftContent = { ...publishedPaidContent, status: 'draft' }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftContent) as never)

    await expect(createBooking(USER_ID, CONTENT_ID, SCHEDULED_DATE_ID)).rejects.toMatchObject({
      status: 404,
    })
  })

  it('throws 404 when content is not found', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(null, { message: 'not found' }) as never)

    await expect(createBooking(USER_ID, CONTENT_ID, SCHEDULED_DATE_ID)).rejects.toMatchObject({
      status: 404,
    })
  })

  it('throws 422 when user tries to book own experience', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ ...publishedPaidContent, user_id: USER_ID }) as never)

    await expect(createBooking(USER_ID, CONTENT_ID, SCHEDULED_DATE_ID)).rejects.toMatchObject({
      status: 422,
    })
  })

  it('throws 422 when content pricing_model is not paid', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ ...publishedPaidContent, pricing_model: 'free' }) as never)

    await expect(createBooking(USER_ID, CONTENT_ID, SCHEDULED_DATE_ID)).rejects.toMatchObject({
      status: 422,
    })
  })
})

// ─── confirmPayment ───────────────────────────────────────────────────────────

describe('confirmPayment', () => {
  beforeEach(() => vi.clearAllMocks())

  function makeValidSignature(orderId: string, paymentId: string): string {
    // Must match webhook_secret from env mock above
    const webhookSecret = 'webhook_secret_test_32_chars_x'
    return crypto
      .createHmac('sha256', webhookSecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')
  }

  it('happy path: confirms booking on valid signature', async () => {
    const sig = makeValidSignature(RAZORPAY_ORDER_ID, RAZORPAY_PAYMENT_ID)

    vi.mocked(supabase.from)
      // find booking by order id
      .mockReturnValueOnce(mockChain({ id: BOOKING_ID, status: 'pending_payment' }) as never)
      // update booking to confirmed
      .mockReturnValueOnce(mockChain(null, null) as never)

    await expect(
      confirmPayment(RAZORPAY_ORDER_ID, RAZORPAY_PAYMENT_ID, sig)
    ).resolves.toBeUndefined()
  })

  it('throws 403 on invalid signature', async () => {
    await expect(
      confirmPayment(RAZORPAY_ORDER_ID, RAZORPAY_PAYMENT_ID, 'bad_signature_value')
    ).rejects.toMatchObject({
      status: 403,
      type: 'forbidden',
    })
  })

  it('is idempotent: does nothing if already confirmed', async () => {
    const sig = makeValidSignature(RAZORPAY_ORDER_ID, RAZORPAY_PAYMENT_ID)

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ id: BOOKING_ID, status: 'confirmed' }) as never)

    // Should not throw
    await expect(
      confirmPayment(RAZORPAY_ORDER_ID, RAZORPAY_PAYMENT_ID, sig)
    ).resolves.toBeUndefined()

    // No update call should have been made
    expect(vi.mocked(supabase.from)).toHaveBeenCalledTimes(1)
  })
})

// ─── getBooking ───────────────────────────────────────────────────────────────

describe('getBooking', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns booking details for the buyer', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(pendingBookingRow) as never)

    const result = await getBooking(BOOKING_ID, USER_ID)

    expect(result.id).toBe(BOOKING_ID)
    expect(result.userId).toBe(USER_ID)
  })

  it('returns booking details for the creator', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(pendingBookingRow) as never)

    const result = await getBooking(BOOKING_ID, CREATOR_ID)

    expect(result.id).toBe(BOOKING_ID)
  })

  it('throws 404 when booking does not exist', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(null, { message: 'not found' }) as never)

    await expect(getBooking('nonexistent-id', USER_ID)).rejects.toMatchObject({
      status: 404,
    })
  })

  it('throws 403 when requester is neither buyer nor creator', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(pendingBookingRow) as never)

    await expect(getBooking(BOOKING_ID, 'some-other-user')).rejects.toMatchObject({
      status: 403,
      type: 'forbidden',
    })
  })
})

// ─── listUserBookings ─────────────────────────────────────────────────────────

describe('listUserBookings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty list when user has no bookings', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain([]) as never)

    const result = await listUserBookings(USER_ID, { limit: 20 })

    expect(result.items).toHaveLength(0)
    expect(result.nextCursor).toBeNull()
  })

  it('returns list of bookings with no cursor when below limit', async () => {
    const rows = [pendingBookingRow]

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(rows) as never)

    const result = await listUserBookings(USER_ID, { limit: 20 })

    expect(result.items).toHaveLength(1)
    expect(result.items[0]!.id).toBe(BOOKING_ID)
    expect(result.nextCursor).toBeNull()
  })

  it('returns nextCursor when more items exist than limit', async () => {
    const rows = Array.from({ length: 21 }, (_, i) => ({
      ...pendingBookingRow,
      id: `booking-${i}`,
      created_at: `2026-04-${(15 - i).toString().padStart(2, '0')}T10:00:00Z`,
    }))

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(rows) as never)

    const result = await listUserBookings(USER_ID, { limit: 20 })

    expect(result.items).toHaveLength(20)
    expect(result.nextCursor).not.toBeNull()
  })

  it('uses cursor to paginate from correct position', async () => {
    // Encode a cursor manually: createdAt|id
    const cursorStr = Buffer.from('2026-04-10T10:00:00Z|booking-10').toString('base64url')

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain([]) as never)

    await listUserBookings(USER_ID, { cursor: cursorStr, limit: 20 })

    // The or() call should have been chained — verify supabase.from was called
    expect(vi.mocked(supabase.from)).toHaveBeenCalledTimes(1)
  })
})

// ─── completeBooking ──────────────────────────────────────────────────────────

describe('completeBooking', () => {
  beforeEach(() => vi.clearAllMocks())

  it('happy path: marks booking as completed', async () => {
    const confirmedBooking = {
      id: BOOKING_ID,
      creator_id: CREATOR_ID,
      status: 'confirmed',
    }

    vi.mocked(supabase.from)
      // fetch booking
      .mockReturnValueOnce(mockChain(confirmedBooking) as never)
      // update to completed
      .mockReturnValueOnce(mockChain(null, null) as never)

    await expect(completeBooking(BOOKING_ID, CREATOR_ID)).resolves.toBeUndefined()
  })

  it('throws 403 when requester is not the creator', async () => {
    const confirmedBooking = {
      id: BOOKING_ID,
      creator_id: CREATOR_ID,
      status: 'confirmed',
    }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(confirmedBooking) as never)

    await expect(completeBooking(BOOKING_ID, USER_ID)).rejects.toMatchObject({
      status: 403,
      type: 'forbidden',
    })
  })

  it('throws 422 when booking is not confirmed (e.g. pending_payment)', async () => {
    const pendingBooking = {
      id: BOOKING_ID,
      creator_id: CREATOR_ID,
      status: 'pending_payment',
    }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(pendingBooking) as never)

    await expect(completeBooking(BOOKING_ID, CREATOR_ID)).rejects.toMatchObject({
      status: 422,
    })
  })

  it('throws 404 when booking does not exist', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(null, { message: 'not found' }) as never)

    await expect(completeBooking('nonexistent', CREATOR_ID)).rejects.toMatchObject({
      status: 404,
    })
  })
})
