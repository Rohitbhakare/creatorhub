/**
 * Refund Service — cancellation policies + Razorpay refund initiation.
 *
 * Policy table:
 *   Flexible : >7 days → 100% | 2-7 days → 50% | <2 days → 0%
 *   Moderate : >7 days →  75% | 2-7 days → 25% | <2 days → 0%
 *   Strict   : >7 days →  50% | 2-7 days →  0% | <2 days → 0%
 *
 * "Days before" = calendar days until scheduled_dates.start_date.
 */

import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import { env } from '../env.js'

// ─── Types ───────────────────────────────────────────────────────────────────

export type PolicyType = 'flexible' | 'moderate' | 'strict'

type Row = Record<string, unknown>

// Refund percentages per policy × time window (in basis points for safety,
// then converted to paisa via Math.round).
const REFUND_RATES: Record<PolicyType, [number, number, number]> = {
  //              >7 days   2-7 days  <2 days
  flexible: [1.0, 0.5, 0.0],
  moderate: [0.75, 0.25, 0.0],
  strict: [0.5, 0.0, 0.0],
}

// ─── calculateRefundAmount ────────────────────────────────────────────────────

/**
 * Pure function — no I/O.
 * Returns refund amount in paisa (0 if not eligible).
 *
 * Boundary behaviour:
 *   daysUntilStart > 7  → tier 0 (best)
 *   2 <= days <= 7      → tier 1 (middle)   (includes exactly 7 and exactly 2)
 *   days < 2            → tier 2 (no refund) (includes exactly 0 and 1)
 */
export function calculateRefundAmount(
  totalPaisa: number,
  policyType: PolicyType,
  daysUntilStart: number,
): number {
  const rates = REFUND_RATES[policyType]

  let rate: number
  if (daysUntilStart > 7) {
    rate = rates[0]
  } else if (daysUntilStart >= 2) {
    rate = rates[1]
  } else {
    rate = rates[2]
  }

  return Math.round(totalPaisa * rate)
}

// ─── Razorpay refund ──────────────────────────────────────────────────────────

async function initiateRazorpayRefund(
  paymentId: string,
  amountPaisa: number,
): Promise<string> {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError('internal', 500, 'Razorpay credentials not configured')
  }

  const credentials = Buffer.from(
    `${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`,
  ).toString('base64')

  const response = await fetch(
    `https://api.razorpay.com/v1/payments/${paymentId}/refund`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount: amountPaisa, speed: 'normal' }),
    },
  )

  if (!response.ok) {
    const text = await response.text()
    throw new AppError(
      'internal',
      500,
      `Razorpay refund failed: ${text.slice(0, 200)}`,
    )
  }

  const json = await response.json() as { id?: string }
  if (!json.id) {
    throw new AppError('internal', 500, 'Razorpay refund returned no ID')
  }

  return json.id
}

// ─── getRefundPolicy ──────────────────────────────────────────────────────────

/**
 * Fetch the refund policy for a content piece.
 * Returns null if no policy has been set (callers treat as flexible by default
 * or may choose to error).
 */
export async function getRefundPolicy(contentId: string): Promise<PolicyType | null> {
  const { data, error } = await supabase
    .from('refund_policies')
    .select('policy_type')
    .eq('content_id', contentId)
    .maybeSingle()

  if (error) {
    throw new AppError('db-error', 500, 'Failed to fetch refund policy')
  }

  if (!data) return null

  return (data as Row).policy_type as PolicyType
}

// ─── setRefundPolicy ──────────────────────────────────────────────────────────

/**
 * Upsert the refund policy for a content piece.
 * Only the content owner (creator) may set the policy.
 */
export async function setRefundPolicy(
  contentId: string,
  userId: string,
  policyType: PolicyType,
): Promise<void> {
  // Verify the caller owns the content
  const { data: content, error: contentError } = await supabase
    .from('content')
    .select('id, user_id')
    .eq('id', contentId)
    .is('deleted_at', null)
    .maybeSingle()

  if (contentError || !content) {
    throw new AppError('not-found', 404, 'Content not found')
  }

  if ((content as Row).user_id !== userId) {
    throw new AppError('forbidden', 403, 'Only the content creator can set the refund policy')
  }

  const { error: upsertError } = await supabase
    .from('refund_policies')
    .upsert(
      { content_id: contentId, policy_type: policyType },
      { onConflict: 'content_id' },
    )

  if (upsertError) {
    throw new AppError('db-error', 500, 'Failed to save refund policy')
  }
}

// ─── cancelBookingByBuyer ─────────────────────────────────────────────────────

/**
 * Buyer-initiated cancellation.
 *
 * Steps:
 *   1. Fetch booking — must belong to userId and be 'confirmed'
 *   2. Fetch scheduled_date.start_date → calculate daysUntilStart
 *   3. Fetch refund policy for content (default: flexible if not set)
 *   4. Calculate refund amount
 *   5. If refund > 0: call Razorpay refund API
 *   6. UPDATE bookings SET status='cancelled', cancelled_at=now()
 *   7. Decrement scheduled_dates.spots_booked
 *   8. INSERT into refunds table
 *   9. Return { refundAmountPaisa, refundId }
 */
export async function cancelBookingByBuyer(
  bookingId: string,
  userId: string,
  reason?: string,
): Promise<{ refundAmountPaisa: number; refundId: string | null }> {
  // 1. Fetch booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, user_id, creator_id, content_id, scheduled_date_id, status, total_paisa, razorpay_payment_id')
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingError || !booking) {
    throw new AppError('not-found', 404, 'Booking not found')
  }

  const b = booking as Row

  if (b.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You do not have access to this booking')
  }

  if (b.status !== 'confirmed') {
    throw new AppError('unprocessable', 422, 'Only confirmed bookings can be cancelled')
  }

  // 2. Fetch scheduled_date.start_date
  const { data: scheduledDate, error: sdError } = await supabase
    .from('scheduled_dates')
    .select('id, start_date, spots_booked')
    .eq('id', b.scheduled_date_id as string)
    .maybeSingle()

  if (sdError || !scheduledDate) {
    throw new AppError('not-found', 404, 'Scheduled date not found')
  }

  const sd = scheduledDate as Row
  const startDate = new Date(sd.start_date as string)
  const now = new Date()
  const msUntilStart = startDate.getTime() - now.getTime()
  const daysUntilStart = msUntilStart / (1000 * 60 * 60 * 24)

  // 3. Get refund policy (default: flexible)
  const rawPolicy = await getRefundPolicy(b.content_id as string)
  const policyType: PolicyType = rawPolicy ?? 'flexible'

  // 4. Calculate refund amount
  const totalPaisa = b.total_paisa as number
  const refundAmountPaisa = calculateRefundAmount(totalPaisa, policyType, daysUntilStart)

  // 5. Initiate Razorpay refund if amount > 0
  let razorpayRefundId: string | null = null
  if (refundAmountPaisa > 0 && b.razorpay_payment_id) {
    razorpayRefundId = await initiateRazorpayRefund(
      b.razorpay_payment_id as string,
      refundAmountPaisa,
    )
  }

  // 6. Cancel the booking
  const { error: cancelError } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason ?? null,
    })
    .eq('id', bookingId)

  if (cancelError) {
    throw new AppError('db-error', 500, 'Failed to cancel booking')
  }

  // 7. Decrement spots_booked
  const currentSpots = sd.spots_booked as number
  await supabase
    .from('scheduled_dates')
    .update({ spots_booked: Math.max(0, currentSpots - 1) })
    .eq('id', b.scheduled_date_id as string)

  // 8. Insert refund record
  const refundInsert: Record<string, unknown> = {
    booking_id: bookingId,
    amount_paisa: refundAmountPaisa,
    status: razorpayRefundId ? 'processed' : 'pending',
    initiated_by: 'buyer',
  }
  if (razorpayRefundId) {
    refundInsert['razorpay_refund_id'] = razorpayRefundId
  }
  if (reason) {
    refundInsert['reason'] = reason
  }

  const { data: refundRow, error: refundError } = await supabase
    .from('refunds')
    .insert(refundInsert)
    .select('id')
    .single()

  if (refundError || !refundRow) {
    throw new AppError('db-error', 500, 'Failed to record refund')
  }

  return {
    refundAmountPaisa,
    refundId: (refundRow as Row).id as string,
  }
}

// ─── cancelBookingByCreator ───────────────────────────────────────────────────

/**
 * Creator-initiated cancellation.
 * Always issues a 100% refund regardless of policy.
 */
export async function cancelBookingByCreator(
  bookingId: string,
  creatorId: string,
  reason: string,
): Promise<void> {
  // Fetch booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, creator_id, content_id, scheduled_date_id, status, total_paisa, razorpay_payment_id')
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingError || !booking) {
    throw new AppError('not-found', 404, 'Booking not found')
  }

  const b = booking as Row

  if (b.creator_id !== creatorId) {
    throw new AppError('forbidden', 403, 'Only the experience creator can cancel this booking')
  }

  if (b.status !== 'confirmed') {
    throw new AppError('unprocessable', 422, 'Only confirmed bookings can be cancelled')
  }

  const totalPaisa = b.total_paisa as number

  // Full refund
  let razorpayRefundId: string | null = null
  if (totalPaisa > 0 && b.razorpay_payment_id) {
    razorpayRefundId = await initiateRazorpayRefund(
      b.razorpay_payment_id as string,
      totalPaisa,
    )
  }

  // Cancel booking
  const { error: cancelError } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
    })
    .eq('id', bookingId)

  if (cancelError) {
    throw new AppError('db-error', 500, 'Failed to cancel booking')
  }

  // Decrement spots_booked
  const { data: sdData } = await supabase
    .from('scheduled_dates')
    .select('spots_booked')
    .eq('id', b.scheduled_date_id as string)
    .maybeSingle()

  if (sdData) {
    const currentSpots = (sdData as Row).spots_booked as number
    await supabase
      .from('scheduled_dates')
      .update({ spots_booked: Math.max(0, currentSpots - 1) })
      .eq('id', b.scheduled_date_id as string)
  }

  // Insert refund record
  const refundInsert: Record<string, unknown> = {
    booking_id: bookingId,
    amount_paisa: totalPaisa,
    status: razorpayRefundId ? 'processed' : 'pending',
    reason,
    initiated_by: 'creator',
  }
  if (razorpayRefundId) {
    refundInsert['razorpay_refund_id'] = razorpayRefundId
  }

  await supabase.from('refunds').insert(refundInsert)
}

// ─── cancelBookingByAdmin ─────────────────────────────────────────────────────

/**
 * Admin-initiated cancellation.
 * Always issues a 100% refund regardless of policy.
 */
export async function cancelBookingByAdmin(
  bookingId: string,
  _adminId: string,
  reason: string,
): Promise<void> {
  // Fetch booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, creator_id, content_id, scheduled_date_id, status, total_paisa, razorpay_payment_id')
    .eq('id', bookingId)
    .maybeSingle()

  if (bookingError || !booking) {
    throw new AppError('not-found', 404, 'Booking not found')
  }

  const b = booking as Row

  if (b.status !== 'confirmed') {
    throw new AppError('unprocessable', 422, 'Only confirmed bookings can be cancelled')
  }

  const totalPaisa = b.total_paisa as number

  // Full refund
  let razorpayRefundId: string | null = null
  if (totalPaisa > 0 && b.razorpay_payment_id) {
    razorpayRefundId = await initiateRazorpayRefund(
      b.razorpay_payment_id as string,
      totalPaisa,
    )
  }

  // Cancel booking
  const { error: cancelError } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason,
    })
    .eq('id', bookingId)

  if (cancelError) {
    throw new AppError('db-error', 500, 'Failed to cancel booking')
  }

  // Decrement spots_booked
  const { data: sdData } = await supabase
    .from('scheduled_dates')
    .select('spots_booked')
    .eq('id', b.scheduled_date_id as string)
    .maybeSingle()

  if (sdData) {
    const currentSpots = (sdData as Row).spots_booked as number
    await supabase
      .from('scheduled_dates')
      .update({ spots_booked: Math.max(0, currentSpots - 1) })
      .eq('id', b.scheduled_date_id as string)
  }

  // Insert refund record
  const refundInsert: Record<string, unknown> = {
    booking_id: bookingId,
    amount_paisa: totalPaisa,
    status: razorpayRefundId ? 'processed' : 'pending',
    reason,
    initiated_by: 'admin',
  }
  if (razorpayRefundId) {
    refundInsert['razorpay_refund_id'] = razorpayRefundId
  }

  await supabase.from('refunds').insert(refundInsert)
}

// ─── getRefundStatus ──────────────────────────────────────────────────────────

/**
 * Get the most recent refund record for a booking.
 * Returns null if no refund exists.
 */
export async function getRefundStatus(
  bookingId: string,
): Promise<{ status: string; amountPaisa: number } | null> {
  const { data, error } = await supabase
    .from('refunds')
    .select('status, amount_paisa')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new AppError('db-error', 500, 'Failed to fetch refund status')
  }

  if (!data) return null

  const r = data as Row
  return {
    status: r.status as string,
    amountPaisa: r.amount_paisa as number,
  }
}
