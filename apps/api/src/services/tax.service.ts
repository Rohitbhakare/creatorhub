import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import { env } from '../env.js'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TaxBreakdown {
  basePricePaisa: number
  platformFeePaisa: number    // 17% of base (floor)
  gstOnFeePaisa: number       // 18% of platform fee (floor)
  tdsPaisa: number            // 1% of base (floor)
  buyerTotalPaisa: number     // base + platformFee + gstOnFee
  creatorPayoutPaisa: number  // base - tds
}

export interface BuyerInvoice {
  invoiceNumber: string       // INV-{year}-{booking_id_short}
  bookingId: string
  buyerName: string
  creatorName: string
  experienceTitle: string
  experienceDate: string
  basePricePaisa: number
  platformFeePaisa: number
  gstPaisa: number            // gstOnFeePaisa
  totalPaisa: number
  creatorhubGstin: string
  generatedAt: string
}

export interface TdsInfo {
  creatorName: string
  pan: string | null          // from kyc_submissions if verified
  bookingId: string
  experienceTitle: string
  transactionDate: string
  grossAmountPaisa: number    // base price
  tdsDeductedPaisa: number    // 1%
  netPayoutPaisa: number      // grossAmount - tds
  section: '194-O'
}

export interface AnnualTdsSummary {
  financialYear: string       // e.g. "2025-26"
  creatorId: string
  totalGrossAmountPaisa: number
  totalTdsDeductedPaisa: number
  bookingCount: number
}

type Row = Record<string, unknown>

// ─── calculateTaxBreakdown ────────────────────────────────────────────────────

/**
 * Calculate full tax breakdown from a base price (in paisa).
 *
 * Platform fee : 17% of base  (floor)
 * GST          : 18% of platform fee (floor) — GST on CreatorHub's service fee
 * TDS          : 1%  of base  (floor) — deducted from creator payout (Sec 194-O)
 * Buyer pays   : base + platformFee + gstOnFee
 * Creator gets : base - tds
 */
export function calculateTaxBreakdown(basePricePaisa: number): TaxBreakdown {
  const platformFeePaisa = Math.floor(basePricePaisa * 0.17)
  const gstOnFeePaisa = Math.floor(platformFeePaisa * 0.18)
  const tdsPaisa = Math.floor(basePricePaisa * 0.01)
  const buyerTotalPaisa = basePricePaisa + platformFeePaisa + gstOnFeePaisa
  const creatorPayoutPaisa = basePricePaisa - tdsPaisa

  return {
    basePricePaisa,
    platformFeePaisa,
    gstOnFeePaisa,
    tdsPaisa,
    buyerTotalPaisa,
    creatorPayoutPaisa,
  }
}

// ─── generateBuyerInvoice ─────────────────────────────────────────────────────

export async function generateBuyerInvoice(bookingId: string): Promise<BuyerInvoice> {
  // Fetch core booking row
  const { data: bookingRaw, error: bookingError } = await supabase
    .from('bookings')
    .select('id, created_at, user_id, creator_id, content_id')
    .eq('id', bookingId)
    .single()

  if (bookingError || !bookingRaw) {
    throw new AppError('not-found', 404, 'Booking not found')
  }

  const booking = bookingRaw as Row

  // Fetch financials, content, buyer, creator in parallel
  const [
    financialsResult,
    contentResult,
    buyerResult,
    creatorResult,
  ] = await Promise.all([
    supabase
      .from('booking_financials')
      .select('base_price_paisa, platform_fee_paisa, gst_paisa, total_paisa')
      .eq('booking_id', bookingId)
      .single(),

    supabase
      .from('content')
      .select('title')
      .eq('id', booking['content_id'] as string)
      .single(),

    supabase
      .from('users')
      .select('display_name')
      .eq('id', booking['user_id'] as string)
      .single(),

    supabase
      .from('users')
      .select('display_name')
      .eq('id', booking['creator_id'] as string)
      .single(),
  ])

  if (!financialsResult.data) {
    throw new AppError('not-found', 404, 'Booking financials not found')
  }
  if (buyerResult.error || !buyerResult.data) {
    throw new AppError('not-found', 404, 'Buyer not found')
  }
  if (creatorResult.error || !creatorResult.data) {
    throw new AppError('not-found', 404, 'Creator not found')
  }

  const fin = financialsResult.data as Row
  const content = (contentResult.data as Row | null) ?? {}
  const buyer = buyerResult.data as Row
  const creator = creatorResult.data as Row

  // Fetch earliest scheduled date for experience date display
  const { data: dateRow } = await supabase
    .from('scheduled_dates')
    .select('start_date')
    .eq('content_id', booking['content_id'] as string)
    .order('start_date', { ascending: true })
    .limit(1)
    .single()

  const experienceDate =
    dateRow && (dateRow as Row)['start_date']
      ? ((dateRow as Row)['start_date'] as string)
      : (booking['created_at'] as string)

  // Build invoice number: INV-{year}-{first 8 chars of booking id (no dashes) uppercase}
  const bookingCreatedAt = new Date(booking['created_at'] as string)
  const year = bookingCreatedAt.getFullYear()
  const bookingIdShort = (booking['id'] as string).replace(/-/g, '').slice(0, 8).toUpperCase()
  const invoiceNumber = `INV-${year}-${bookingIdShort}`

  return {
    invoiceNumber,
    bookingId: booking['id'] as string,
    buyerName: (buyer['display_name'] as string) ?? '',
    creatorName: (creator['display_name'] as string) ?? '',
    experienceTitle: (content['title'] as string) ?? '',
    experienceDate,
    basePricePaisa: Number(fin['base_price_paisa']),
    platformFeePaisa: Number(fin['platform_fee_paisa']),
    gstPaisa: Number(fin['gst_paisa']),
    totalPaisa: Number(fin['total_paisa']),
    creatorhubGstin: env.CREATORHUB_GSTIN ?? '',
    generatedAt: new Date().toISOString(),
  }
}

// ─── getTdsInfo ───────────────────────────────────────────────────────────────

export async function getTdsInfo(bookingId: string, creatorId: string): Promise<TdsInfo> {
  // Fetch booking row to verify creator ownership
  const { data: bookingRaw, error: bookingError } = await supabase
    .from('bookings')
    .select('id, creator_id, content_id, created_at')
    .eq('id', bookingId)
    .single()

  if (bookingError || !bookingRaw) {
    throw new AppError('not-found', 404, 'Booking not found')
  }

  const booking = bookingRaw as Row

  if (booking['creator_id'] !== creatorId) {
    throw new AppError('forbidden', 403, 'You do not have access to this booking')
  }

  // Fetch financials, content, and creator info in parallel.
  // PAN-on-file is intentionally not fetched: schema keeps only
  // `pan_number_hash`, so the TDS certificate exposes `pan: null`
  // until a secure plaintext path is added.
  const [financialsResult, contentResult, creatorResult] = await Promise.all([
    supabase
      .from('booking_financials')
      .select('base_price_paisa, tds_paisa, creator_payout_paisa')
      .eq('booking_id', bookingId)
      .single(),

    supabase
      .from('content')
      .select('title')
      .eq('id', booking['content_id'] as string)
      .single(),

    supabase
      .from('users')
      .select('display_name, kyc_status')
      .eq('id', creatorId)
      .single(),
  ])

  if (!financialsResult.data) {
    throw new AppError('not-found', 404, 'Booking financials not found')
  }
  if (creatorResult.error || !creatorResult.data) {
    throw new AppError('not-found', 404, 'Creator not found')
  }

  const fin = financialsResult.data as Row
  const content = (contentResult.data as Row | null) ?? {}
  const creator = creatorResult.data as Row

  const pan: string | null = null

  return {
    creatorName: (creator['display_name'] as string) ?? '',
    pan,
    bookingId: booking['id'] as string,
    experienceTitle: (content['title'] as string) ?? '',
    transactionDate: booking['created_at'] as string,
    grossAmountPaisa: Number(fin['base_price_paisa']),
    tdsDeductedPaisa: Number(fin['tds_paisa']),
    netPayoutPaisa: Number(fin['creator_payout_paisa']),
    section: '194-O',
  }
}

// ─── getAnnualTdsSummary ──────────────────────────────────────────────────────

/**
 * Indian financial year: April 1 to March 31.
 * "2025-26" means April 1 2025 – March 31 2026.
 *
 * Parse: split on "-", startYear = first part → startDate = April 1 of that year.
 */
export async function getAnnualTdsSummary(
  creatorId: string,
  financialYear: string,
): Promise<AnnualTdsSummary> {
  // Validate and parse financial year format: "YYYY-YY" or "YYYY-YYYY"
  const fyMatch = financialYear.match(/^(\d{4})-(\d{2,4})$/)
  if (!fyMatch || !fyMatch[1]) {
    throw new AppError(
      'validation-failed',
      400,
      'Invalid financial year format. Expected "YYYY-YY" e.g. "2025-26"',
    )
  }

  const startYear = parseInt(fyMatch[1], 10)
  const fyStartDate = `${startYear}-04-01T00:00:00.000Z`      // April 1 00:00 UTC
  const fyEndDate = `${startYear + 1}-03-31T23:59:59.999Z`    // March 31 23:59 UTC

  // Verify creator exists
  const { data: creator, error: creatorError } = await supabase
    .from('users')
    .select('id')
    .eq('id', creatorId)
    .single()

  if (creatorError || !creator) {
    throw new AppError('not-found', 404, 'Creator not found')
  }

  // Fetch all completed bookings for this creator in the financial year
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id')
    .eq('creator_id', creatorId)
    .in('status', ['completed', 'reviewed'])
    .gte('completed_at', fyStartDate)
    .lte('completed_at', fyEndDate)

  if (bookingsError) {
    throw new AppError('db-error', 500, 'Failed to fetch booking data')
  }

  const rows = (bookings as Row[]) ?? []

  if (rows.length === 0) {
    return {
      financialYear,
      creatorId,
      totalGrossAmountPaisa: 0,
      totalTdsDeductedPaisa: 0,
      bookingCount: 0,
    }
  }

  // Fetch financials for those bookings
  const bookingIds = rows.map((b) => b['id'] as string)

  const { data: financials, error: finError } = await supabase
    .from('booking_financials')
    .select('base_price_paisa, tds_paisa')
    .in('booking_id', bookingIds)

  if (finError) {
    throw new AppError('db-error', 500, 'Failed to fetch financial data')
  }

  const finRows = (financials as Row[]) ?? []

  let totalGrossAmountPaisa = 0
  let totalTdsDeductedPaisa = 0

  for (const fin of finRows) {
    totalGrossAmountPaisa += Number(fin['base_price_paisa'])
    totalTdsDeductedPaisa += Number(fin['tds_paisa'])
  }

  return {
    financialYear,
    creatorId,
    totalGrossAmountPaisa,
    totalTdsDeductedPaisa,
    bookingCount: rows.length,
  }
}
