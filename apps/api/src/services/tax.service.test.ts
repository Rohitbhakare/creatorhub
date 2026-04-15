import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (must come before imports that touch these modules) ─────────────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn() }
  return { supabase: mockSupabase }
})

vi.mock('../env.js', () => ({
  env: {
    CREATORHUB_GSTIN: '27AABCC1234A1Z5',
  },
}))

import {
  calculateTaxBreakdown,
  generateBuyerInvoice,
  getTdsInfo,
  getAnnualTdsSummary,
} from './tax.service.js'
import { supabase } from '../lib/supabase.js'

// ─── Mock helpers ─────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => any

function mockChain(data: unknown, error: unknown = null) {
  const resolvedVal = { data, error }
  // Build a chain object where every method returns `this` (for chaining),
  // and `.single()` / `.maybeSingle()` return the resolved value.
  const chain: Record<string, AnyFn> = {}

  const chainable = [
    'select', 'eq', 'neq', 'is', 'gte', 'lte', 'lt', 'gt',
    'in', 'not', 'or', 'order', 'limit', 'update', 'insert',
    'delete', 'upsert', 'head',
  ]

  for (const method of chainable) {
    chain[method] = vi.fn().mockReturnThis()
  }

  chain['single'] = vi.fn().mockResolvedValue({ data, error })
  chain['maybeSingle'] = vi.fn().mockResolvedValue({ data, error })
  // Allow awaiting the chain itself (for queries without .single())
  chain['then'] = (
    onFulfilled: (val: typeof resolvedVal) => unknown,
    onRejected?: (reason: unknown) => unknown,
  ) => Promise.resolve(resolvedVal).then(onFulfilled, onRejected)

  return chain
}

// Cast helper — avoids repeating the ugly double cast in every test
function asFromReturn(chain: Record<string, AnyFn>) {
  return chain as unknown as ReturnType<typeof supabase.from>
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BOOKING_ID = 'booking-uuid-0000-0000-0000-001'
const CREATOR_ID = 'creator-uuid-001'
const BUYER_ID = 'buyer-uuid-001'
const CONTENT_ID = 'content-uuid-001'

const BOOKING_ROW = {
  id: BOOKING_ID,
  user_id: BUYER_ID,
  creator_id: CREATOR_ID,
  content_id: CONTENT_ID,
  created_at: '2025-08-15T10:00:00.000Z',
}

const FINANCIALS_ROW = {
  base_price_paisa: 100000,
  platform_fee_paisa: 17000,
  gst_paisa: 3060,
  total_paisa: 120060,
  tds_paisa: 1000,
  creator_payout_paisa: 99000,
}

const CONTENT_ROW = { title: 'Sunrise Trek to Triund' }
const BUYER_ROW = { display_name: 'Arjun Sharma' }
const CREATOR_ROW = { display_name: 'Priya Nair', kyc_status: 'verified' }
const KYC_ROW = { pan_number: 'ABCDE1234F', status: 'verified' }
const DATE_ROW = { start_date: '2025-09-01' }

// ─── calculateTaxBreakdown ────────────────────────────────────────────────────

describe('calculateTaxBreakdown', () => {
  it('correctly calculates breakdown for ₹1,000 (100000 paisa)', () => {
    const result = calculateTaxBreakdown(100000)
    // Platform fee: floor(100000 * 0.17) = 17000
    expect(result.platformFeePaisa).toBe(17000)
    // GST on fee: floor(17000 * 0.18) = 3060
    expect(result.gstOnFeePaisa).toBe(3060)
    // TDS: floor(100000 * 0.01) = 1000
    expect(result.tdsPaisa).toBe(1000)
    // Buyer total: 100000 + 17000 + 3060 = 120060
    expect(result.buyerTotalPaisa).toBe(120060)
    // Creator payout: 100000 - 1000 = 99000
    expect(result.creatorPayoutPaisa).toBe(99000)
    expect(result.basePricePaisa).toBe(100000)
  })

  it('correctly calculates breakdown for ₹5,000 (500000 paisa)', () => {
    const result = calculateTaxBreakdown(500000)
    // Platform fee: floor(500000 * 0.17) = 85000
    expect(result.platformFeePaisa).toBe(85000)
    // GST on fee: floor(85000 * 0.18) = 15300
    expect(result.gstOnFeePaisa).toBe(15300)
    // TDS: floor(500000 * 0.01) = 5000
    expect(result.tdsPaisa).toBe(5000)
    // Buyer total: 500000 + 85000 + 15300 = 600300
    expect(result.buyerTotalPaisa).toBe(600300)
    // Creator payout: 500000 - 5000 = 495000
    expect(result.creatorPayoutPaisa).toBe(495000)
    expect(result.basePricePaisa).toBe(500000)
  })

  it('correctly calculates breakdown for ₹10,000 (1000000 paisa)', () => {
    const result = calculateTaxBreakdown(1000000)
    // Platform fee: floor(1000000 * 0.17) = 170000
    expect(result.platformFeePaisa).toBe(170000)
    // GST on fee: floor(170000 * 0.18) = 30600
    expect(result.gstOnFeePaisa).toBe(30600)
    // TDS: floor(1000000 * 0.01) = 10000
    expect(result.tdsPaisa).toBe(10000)
    // Buyer total: 1000000 + 170000 + 30600 = 1200600
    expect(result.buyerTotalPaisa).toBe(1200600)
    // Creator payout: 1000000 - 10000 = 990000
    expect(result.creatorPayoutPaisa).toBe(990000)
    expect(result.basePricePaisa).toBe(1000000)
  })

  it('uses floor rounding — does not round up partial paisa', () => {
    // ₹333 base = 33300 paisa
    // Platform fee: floor(33300 * 0.17) = floor(5661) = 5661
    // GST on fee: floor(5661 * 0.18) = floor(1018.98) = 1018
    // TDS: floor(33300 * 0.01) = floor(333) = 333
    const result = calculateTaxBreakdown(33300)
    expect(result.platformFeePaisa).toBe(5661)
    expect(result.gstOnFeePaisa).toBe(1018)
    expect(result.tdsPaisa).toBe(333)
    expect(result.buyerTotalPaisa).toBe(33300 + 5661 + 1018)
    expect(result.creatorPayoutPaisa).toBe(33300 - 333)
  })

  it('handles zero base price', () => {
    const result = calculateTaxBreakdown(0)
    expect(result.platformFeePaisa).toBe(0)
    expect(result.gstOnFeePaisa).toBe(0)
    expect(result.tdsPaisa).toBe(0)
    expect(result.buyerTotalPaisa).toBe(0)
    expect(result.creatorPayoutPaisa).toBe(0)
  })
})

// ─── generateBuyerInvoice ─────────────────────────────────────────────────────

describe('generateBuyerInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a well-formed invoice for a valid booking', async () => {
    const fromMock = vi.mocked(supabase.from)
    // Sequential calls from the service:
    // 1. bookings (core row)
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(BOOKING_ROW)))
    // 2–5. Promise.all: booking_financials, content, buyer, creator
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(FINANCIALS_ROW)))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(CONTENT_ROW)))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(BUYER_ROW)))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(CREATOR_ROW)))
    // 6. scheduled_dates
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(DATE_ROW)))

    const invoice = await generateBuyerInvoice(BOOKING_ID)

    expect(invoice.bookingId).toBe(BOOKING_ID)
    expect(invoice.buyerName).toBe('Arjun Sharma')
    expect(invoice.creatorName).toBe('Priya Nair')
    expect(invoice.experienceTitle).toBe('Sunrise Trek to Triund')
    expect(invoice.basePricePaisa).toBe(100000)
    expect(invoice.platformFeePaisa).toBe(17000)
    expect(invoice.gstPaisa).toBe(3060)
    expect(invoice.totalPaisa).toBe(120060)
    expect(invoice.creatorhubGstin).toBe('27AABCC1234A1Z5')
    expect(invoice.generatedAt).toBeDefined()
  })

  it('formats invoice number as INV-{year}-{booking_id_short}', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(BOOKING_ROW)))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(FINANCIALS_ROW)))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(CONTENT_ROW)))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(BUYER_ROW)))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(CREATOR_ROW)))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(DATE_ROW)))

    const invoice = await generateBuyerInvoice(BOOKING_ID)

    // year = 2025 (from created_at '2025-08-15...')
    expect(invoice.invoiceNumber).toMatch(/^INV-2025-[A-Z0-9]{8}$/)
  })

  it('uses booking created_at as experienceDate when no scheduled_dates exist', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(BOOKING_ROW)))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(FINANCIALS_ROW)))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(CONTENT_ROW)))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(BUYER_ROW)))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(CREATOR_ROW)))
    // scheduled_dates returns null (no date)
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(null)))

    const invoice = await generateBuyerInvoice(BOOKING_ID)
    expect(invoice.experienceDate).toBe('2025-08-15T10:00:00.000Z')
  })

  it('throws 404 when booking not found', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      asFromReturn(mockChain(null, { message: 'not found' })),
    )

    await expect(generateBuyerInvoice('nonexistent-id')).rejects.toMatchObject({
      status: 404,
      type: 'not-found',
    })
  })
})

// ─── getTdsInfo ───────────────────────────────────────────────────────────────

describe('getTdsInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns TDS info with PAN for a verified creator', async () => {
    const fromMock = vi.mocked(supabase.from)
    // 1. bookings
    fromMock.mockReturnValueOnce(asFromReturn(mockChain({
      ...BOOKING_ROW,
      creator_id: CREATOR_ID,
    })))
    // 2–5. Promise.all: booking_financials, content, users, kyc_submissions
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(FINANCIALS_ROW)))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(CONTENT_ROW)))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(CREATOR_ROW)))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(KYC_ROW)))

    const tds = await getTdsInfo(BOOKING_ID, CREATOR_ID)

    expect(tds.bookingId).toBe(BOOKING_ID)
    expect(tds.creatorName).toBe('Priya Nair')
    expect(tds.pan).toBe('ABCDE1234F')
    expect(tds.grossAmountPaisa).toBe(100000)
    expect(tds.tdsDeductedPaisa).toBe(1000)
    expect(tds.netPayoutPaisa).toBe(99000)
    expect(tds.section).toBe('194-O')
    expect(tds.experienceTitle).toBe('Sunrise Trek to Triund')
  })

  it('returns pan: null when KYC not verified', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(asFromReturn(mockChain({
      ...BOOKING_ROW,
      creator_id: CREATOR_ID,
    })))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(FINANCIALS_ROW)))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(CONTENT_ROW)))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain({ display_name: 'Priya Nair', kyc_status: 'pending' })))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain({ pan_number: 'ABCDE1234F', status: 'pending' })))

    const tds = await getTdsInfo(BOOKING_ID, CREATOR_ID)
    expect(tds.pan).toBeNull()
  })

  it('returns pan: null when no KYC submission exists', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(asFromReturn(mockChain({
      ...BOOKING_ROW,
      creator_id: CREATOR_ID,
    })))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(FINANCIALS_ROW)))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(CONTENT_ROW)))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(CREATOR_ROW)))
    // No KYC submission
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(null)))

    const tds = await getTdsInfo(BOOKING_ID, CREATOR_ID)
    expect(tds.pan).toBeNull()
  })

  it('throws 403 when booking belongs to a different creator', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      asFromReturn(mockChain({
        ...BOOKING_ROW,
        creator_id: 'other-creator-id',
      })),
    )

    await expect(getTdsInfo(BOOKING_ID, CREATOR_ID)).rejects.toMatchObject({
      status: 403,
      type: 'forbidden',
    })
  })

  it('throws 404 when booking not found', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      asFromReturn(mockChain(null, { message: 'not found' })),
    )

    await expect(getTdsInfo('nonexistent', CREATOR_ID)).rejects.toMatchObject({
      status: 404,
    })
  })
})

// ─── getAnnualTdsSummary ──────────────────────────────────────────────────────

describe('getAnnualTdsSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const BOOKING_IDS = [
    { id: 'b1' },
    { id: 'b2' },
    { id: 'b3' },
  ]

  const FINANCIALS_ROWS = [
    { base_price_paisa: 100000, tds_paisa: 1000 },
    { base_price_paisa: 200000, tds_paisa: 2000 },
    { base_price_paisa: 50000, tds_paisa: 500 },
  ]

  it('sums gross and TDS across all bookings in the financial year', async () => {
    const fromMock = vi.mocked(supabase.from)
    // 1. creator check
    fromMock.mockReturnValueOnce(asFromReturn(mockChain({ id: CREATOR_ID })))
    // 2. bookings query
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(BOOKING_IDS)))
    // 3. booking_financials
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(FINANCIALS_ROWS)))

    const summary = await getAnnualTdsSummary(CREATOR_ID, '2025-26')

    expect(summary.financialYear).toBe('2025-26')
    expect(summary.creatorId).toBe(CREATOR_ID)
    expect(summary.bookingCount).toBe(3)
    // 100000 + 200000 + 50000 = 350000
    expect(summary.totalGrossAmountPaisa).toBe(350000)
    // 1000 + 2000 + 500 = 3500
    expect(summary.totalTdsDeductedPaisa).toBe(3500)
  })

  it('returns zero totals when no bookings in the financial year', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(asFromReturn(mockChain({ id: CREATOR_ID })))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain([])))
    // No financials call (short-circuits when empty)

    const summary = await getAnnualTdsSummary(CREATOR_ID, '2024-25')
    expect(summary.bookingCount).toBe(0)
    expect(summary.totalGrossAmountPaisa).toBe(0)
    expect(summary.totalTdsDeductedPaisa).toBe(0)
  })

  it('uses April–March boundary for financial year date range (2025-26)', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(asFromReturn(mockChain({ id: CREATOR_ID })))

    // Capture the bookings chain to verify gte/lte calls
    const bookingsChain = mockChain(BOOKING_IDS)
    fromMock.mockReturnValueOnce(asFromReturn(bookingsChain))
    fromMock.mockReturnValueOnce(asFromReturn(mockChain(FINANCIALS_ROWS)))

    await getAnnualTdsSummary(CREATOR_ID, '2025-26')

    // gte should have been called with April 1 2025
    expect(bookingsChain['gte']).toHaveBeenCalledWith(
      'completed_at',
      expect.stringContaining('2025-04-01'),
    )
    // lte should have been called with March 31 2026
    expect(bookingsChain['lte']).toHaveBeenCalledWith(
      'completed_at',
      expect.stringContaining('2026-03-31'),
    )
  })

  it('throws 400 for invalid financial year format', async () => {
    await expect(getAnnualTdsSummary(CREATOR_ID, 'invalid')).rejects.toMatchObject({
      status: 400,
      type: 'validation-failed',
    })
  })

  it('throws 400 for financial year without hyphen', async () => {
    await expect(getAnnualTdsSummary(CREATOR_ID, '202526')).rejects.toMatchObject({
      status: 400,
      type: 'validation-failed',
    })
  })

  it('throws 404 when creator not found', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      asFromReturn(mockChain(null, { message: 'not found' })),
    )

    await expect(getAnnualTdsSummary('nonexistent-creator', '2025-26')).rejects.toMatchObject({
      status: 404,
    })
  })
})
