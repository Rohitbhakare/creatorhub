/**
 * Booking Service — paid experience bookings via Razorpay.
 *
 * State machine:
 *   pending_payment → confirmed (on successful payment webhook)
 *   confirmed       → completed (creator marks done)
 *                  → cancelled / refunded
 */

import crypto from 'node:crypto'
import Razorpay from 'razorpay'
import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import { env } from '../env.js'
import { calculateBookingAmounts } from '../utils/money.js'
import { getActiveRazorpayAccountId } from './linked-account.service.js'
import { schedulePayoutOnBookingCompleted } from './payout.service.js'

// Placeholder hold window — recomputed on booking completion (T8).
const INITIAL_HOLD_DAYS = 30

// ─── Razorpay client (lazy singleton) ────────────────────────────────────────

function getRazorpay(): Razorpay {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError('internal', 500, 'Razorpay credentials not configured')
  }
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  })
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type BookingDetails = {
  id: string
  contentId: string
  scheduledDateId: string | null
  userId: string
  creatorId: string
  status: string
  basePricePaisa: number
  platformFeePaisa: number
  gstPaisa: number
  tdsPaisa: number
  totalPaisa: number
  creatorPayoutPaisa: number
  razorpayOrderId: string | null
  createdAt: string
}

type Row = Record<string, unknown>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rowToBookingDetails(row: Row): BookingDetails {
  return {
    id: row.id as string,
    contentId: row.content_id as string,
    scheduledDateId: (row.scheduled_date_id as string | null) ?? null,
    userId: row.user_id as string,
    creatorId: row.creator_id as string,
    status: row.status as string,
    basePricePaisa: row.base_price_paisa as number,
    platformFeePaisa: row.platform_fee_paisa as number,
    gstPaisa: row.gst_paisa as number,
    tdsPaisa: row.tds_paisa as number,
    totalPaisa: row.total_paisa as number,
    creatorPayoutPaisa: row.creator_payout_paisa as number,
    razorpayOrderId: (row.razorpay_order_id as string | null) ?? null,
    createdAt: row.created_at as string,
  }
}

function encodeCursor(createdAt: string, id: string): string {
  return Buffer.from(`${createdAt}|${id}`).toString('base64url')
}

function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8')
    const [createdAt, id] = decoded.split('|')
    if (!createdAt || !id) return null
    return { createdAt, id }
  } catch {
    return null
  }
}

// ─── createBooking ────────────────────────────────────────────────────────────

/**
 * Create a booking and a Razorpay order.
 *
 * Steps:
 *  1. Verify content is published and paid
 *  2. Fetch scheduled_date
 *  3. Atomic capacity check + increment (spots_booked < capacity guard)
 *  4. Calculate amounts
 *  5. Create Razorpay order
 *  6. Insert booking row with status = 'pending_payment'
 */
export async function createBooking(
  userId: string,
  contentId: string,
  scheduledDateId: string,
): Promise<{ booking: BookingDetails; razorpayOrderId: string; keyId: string }> {
  // 1. Verify content is published and paid
  const { data: content, error: contentError } = await supabase
    .from('content')
    .select('id, user_id, status, price_paisa, pricing_model')
    .eq('id', contentId)
    .is('deleted_at', null)
    .single()

  if (contentError || !content) {
    throw new AppError('not-found', 404, 'Content not found')
  }

  if (content.status !== 'published') {
    throw new AppError('not-found', 404, 'Content not found')
  }

  if (content.pricing_model !== 'paid') {
    throw new AppError('unprocessable', 422, 'This content is not a paid experience')
  }

  const creatorId = content.user_id as string

  // Prevent booking own experience
  if (creatorId === userId) {
    throw new AppError('unprocessable', 422, 'You cannot book your own experience')
  }

  // 2. Fetch scheduled_date
  const { data: scheduledDate, error: sdError } = await supabase
    .from('scheduled_dates')
    .select('id, content_id, capacity, spots_booked')
    .eq('id', scheduledDateId)
    .eq('content_id', contentId)
    .single()

  if (sdError || !scheduledDate) {
    throw new AppError('not-found', 404, 'Scheduled date not found')
  }

  const currentSpots = scheduledDate.spots_booked as number
  const capacity = scheduledDate.capacity as number

  // 3. Atomic capacity check: only update if spots_booked < capacity
  //    If no row returned, capacity was already full (race-condition safe).
  const { data: atomicResult, error: atomicError } = await supabase
    .from('scheduled_dates')
    .update({ spots_booked: currentSpots + 1 })
    .eq('id', scheduledDateId)
    .lt('spots_booked', capacity)
    .select('id')
    .maybeSingle()

  if (atomicError || !atomicResult) {
    throw new AppError('capacity-exceeded', 409, 'No spots available for this date')
  }

  // 4. Calculate amounts
  const basePricePaisa = content.price_paisa as number
  const amounts = calculateBookingAmounts(basePricePaisa)

  // 4a. Resolve creator's Razorpay linked account (Route) — required for paid
  //     bookings so the escrow/split is attached at order creation. If the
  //     creator hasn't yet been activated (KYC approved but Razorpay webhook
  //     pending), we hard-fail: money should not be collected with nowhere to
  //     route it. This is E2.12 BOOK-FR-005.
  let creatorRazorpayAccountId: string | null = null
  if (amounts.totalPaisa > 0) {
    creatorRazorpayAccountId = await getActiveRazorpayAccountId(creatorId)
    if (!creatorRazorpayAccountId) {
      // Rollback spots_booked increment
      await supabase
        .from('scheduled_dates')
        .update({ spots_booked: currentSpots })
        .eq('id', scheduledDateId)

      throw new AppError(
        'unprocessable',
        503,
        "Creator's payouts are not yet set up. Please try again later.",
      )
    }
  }

  // 5. Create Razorpay order (with Route transfer if linked account present).
  //    The resulting transfer.id is delivered on the payment.captured webhook
  //    and persisted into payouts there (T7).
  const razorpay = getRazorpay()
  let razorpayOrderId: string

  try {
    const orderParams: Record<string, unknown> = {
      amount: amounts.totalPaisa,
      currency: 'INR',
      receipt: `bk_${Date.now().toString(36)}`,
    }
    if (creatorRazorpayAccountId && amounts.creatorPayoutPaisa > 0) {
      const holdUntil = Math.floor(Date.now() / 1000) + INITIAL_HOLD_DAYS * 86400
      orderParams['transfers'] = [
        {
          account: creatorRazorpayAccountId,
          amount: amounts.creatorPayoutPaisa,
          currency: 'INR',
          on_hold: 1,
          on_hold_until: holdUntil,
        },
      ]
    }
    // The typed orders.create overload doesn't declare `transfers`, but the
    // underlying Razorpay API accepts it; cast via unknown to satisfy strict TS.
    const order = (await razorpay.orders.create(
      orderParams as unknown as Parameters<typeof razorpay.orders.create>[0],
    )) as unknown as { id: string }
    razorpayOrderId = order.id
  } catch {
    // Rollback spots_booked increment
    await supabase
      .from('scheduled_dates')
      .update({ spots_booked: currentSpots })
      .eq('id', scheduledDateId)

    throw new AppError('internal', 500, 'Failed to create payment order')
  }

  // 6. Insert booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      content_id: contentId,
      scheduled_date_id: scheduledDateId,
      user_id: userId,
      creator_id: creatorId,
      status: 'pending_payment',
      base_price_paisa: amounts.basePricePaisa,
      platform_fee_paisa: amounts.platformFeePaisa,
      gst_paisa: amounts.gstPaisa,
      tds_paisa: amounts.tdsPaisa,
      total_paisa: amounts.totalPaisa,
      creator_payout_paisa: amounts.creatorPayoutPaisa,
      razorpay_order_id: razorpayOrderId,
    })
    .select()
    .single()

  if (bookingError || !booking) {
    // Rollback spots_booked increment
    await supabase
      .from('scheduled_dates')
      .update({ spots_booked: currentSpots })
      .eq('id', scheduledDateId)

    throw new AppError('db-error', 500, 'Failed to create booking')
  }

  return {
    booking: rowToBookingDetails(booking as Row),
    razorpayOrderId,
    keyId: env.RAZORPAY_KEY_ID ?? '',
  }
}

// ─── confirmPayment ───────────────────────────────────────────────────────────

/**
 * Verify Razorpay payment signature and transition booking to 'confirmed'.
 *
 * Signature: HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, webhook_secret)
 */
export async function confirmPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
): Promise<void> {
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new AppError('internal', 500, 'Webhook secret not configured')
  }

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')

  if (expectedSignature !== razorpaySignature) {
    throw new AppError('forbidden', 403, 'Invalid payment signature')
  }

  // Find booking by razorpay_order_id
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('razorpay_order_id', razorpayOrderId)
    .single()

  if (fetchError || !booking) {
    throw new AppError('not-found', 404, 'Booking not found for this order')
  }

  // Idempotency: already confirmed is fine
  if ((booking as Row).status === 'confirmed') return

  // Transition to confirmed
  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    })
    .eq('id', (booking as Row).id as string)
    .eq('status', 'pending_payment')

  if (updateError) {
    throw new AppError('db-error', 500, 'Failed to confirm booking')
  }
}

// ─── getBooking ───────────────────────────────────────────────────────────────

/**
 * Get booking by ID. Accessible by the buyer OR the creator.
 */
export async function getBooking(bookingId: string, requesterId: string): Promise<BookingDetails> {
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    throw new AppError('not-found', 404, 'Booking not found')
  }

  const b = booking as Row
  if (b.user_id !== requesterId && b.creator_id !== requesterId) {
    throw new AppError('forbidden', 403, 'You do not have access to this booking')
  }

  return rowToBookingDetails(b)
}

// ─── listUserBookings ─────────────────────────────────────────────────────────

/**
 * List a user's bookings (as buyer), cursor-paginated, newest first.
 */
export async function listUserBookings(
  userId: string,
  options: { cursor?: string; limit?: number },
): Promise<{ items: BookingDetails[]; nextCursor: string | null }> {
  const limit = options.limit ?? 20
  const cursor = options.cursor ? decodeCursor(options.cursor) : null

  let query = supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })

  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`
    )
  }

  const { data: rows, error } = await query.limit(limit + 1)

  if (error) {
    throw new AppError('db-error', 500, 'Failed to list bookings')
  }

  const allRows = (rows ?? []) as Row[]
  const hasMore = allRows.length > limit
  const items = hasMore ? allRows.slice(0, limit) : allRows

  let nextCursor: string | null = null
  if (hasMore && items.length > 0) {
    const last = items[items.length - 1]!
    nextCursor = encodeCursor(last.created_at as string, last.id as string)
  }

  return {
    items: items.map(rowToBookingDetails),
    nextCursor,
  }
}

// ─── completeBooking ──────────────────────────────────────────────────────────

/**
 * Creator marks a booking as completed after the experience is done.
 */
export async function completeBooking(bookingId: string, creatorId: string): Promise<void> {
  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, creator_id, status')
    .eq('id', bookingId)
    .single()

  if (error || !booking) {
    throw new AppError('not-found', 404, 'Booking not found')
  }

  const b = booking as Row

  if (b.creator_id !== creatorId) {
    throw new AppError('forbidden', 403, 'Only the creator can mark this booking as completed')
  }

  if (b.status !== 'confirmed') {
    throw new AppError('unprocessable', 422, 'Only confirmed bookings can be marked as completed')
  }

  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', bookingId)

  if (updateError) {
    throw new AppError('db-error', 500, 'Failed to complete booking')
  }

  // E2.12: arm the 48h payout timer. Never block completion if this fails —
  // the release cron reconciles at the next tick.
  try {
    await schedulePayoutOnBookingCompleted(bookingId)
  } catch (err) {
    console.warn(`[booking.complete] payout scheduling deferred for ${bookingId}: ${(err as Error).message}`)
  }
}
