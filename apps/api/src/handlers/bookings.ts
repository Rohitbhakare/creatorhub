/**
 * Booking handlers — thin layer: validate body → call service → respond.
 */

import type { Context } from 'hono'
import {
  createBooking,
  confirmPayment,
  getBooking,
  listUserBookings,
  completeBooking,
} from '../services/booking.service.js'
import { AppError } from '../errors/AppError.js'

// ─── POST /bookings ───────────────────────────────────────────────────────────

/**
 * Create a booking and return a Razorpay order for client-side payment.
 * Body: { content_id: string, scheduled_date_id: string }
 */
export async function handleCreateBooking(c: Context): Promise<Response> {
  const userId = c.get('userId') as string

  let body: {
    content_id?: unknown
    scheduled_date_id?: unknown
    intent_id?: unknown
  }
  try {
    body = await c.req.json() as {
      content_id?: unknown
      scheduled_date_id?: unknown
      intent_id?: unknown
    }
  } catch {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  }

  if (typeof body.content_id !== 'string' || !body.content_id.trim()) {
    throw new AppError('validation-failed', 400, 'content_id is required', [
      { field: 'content_id', message: 'content_id is required', code: 'required' },
    ])
  }

  if (typeof body.scheduled_date_id !== 'string' || !body.scheduled_date_id.trim()) {
    throw new AppError('validation-failed', 400, 'scheduled_date_id is required', [
      { field: 'scheduled_date_id', message: 'scheduled_date_id is required', code: 'required' },
    ])
  }

  const intentId =
    typeof body.intent_id === 'string' && body.intent_id.trim()
      ? body.intent_id
      : undefined

  const { booking, razorpayOrderId, keyId } = await createBooking(
    userId,
    body.content_id,
    body.scheduled_date_id,
    intentId,
  )

  c.header('Location', `/api/v1/bookings/${booking.id}`)
  return c.json(
    {
      success: true,
      data: {
        booking,
        razorpay_order_id: razorpayOrderId,
        key_id: keyId,
      },
    },
    201,
  )
}

// ─── POST /bookings/verify-payment ────────────────────────────────────────────

/**
 * Razorpay webhook: verify signature and confirm booking.
 * No auth middleware — called by Razorpay's server.
 * Verifies x-razorpay-signature header for webhook authenticity.
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export async function handleVerifyPayment(c: Context): Promise<Response> {
  let body: { razorpay_order_id?: unknown; razorpay_payment_id?: unknown; razorpay_signature?: unknown }
  try {
    body = await c.req.json() as typeof body
  } catch {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  }

  if (
    typeof body.razorpay_order_id !== 'string' ||
    typeof body.razorpay_payment_id !== 'string' ||
    typeof body.razorpay_signature !== 'string'
  ) {
    throw new AppError('validation-failed', 400, 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required')
  }

  await confirmPayment(
    body.razorpay_order_id,
    body.razorpay_payment_id,
    body.razorpay_signature,
  )

  return c.json({ success: true, data: { confirmed: true } })
}

// ─── GET /bookings/:id ────────────────────────────────────────────────────────

/**
 * Get a booking by ID. Accessible to buyer or creator.
 */
export async function handleGetBooking(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const bookingId = c.req.param('id')

  if (!bookingId) {
    throw new AppError('validation-failed', 400, 'Booking ID is required')
  }

  const booking = await getBooking(bookingId, userId)

  return c.json({ success: true, data: booking })
}

// ─── GET /bookings ────────────────────────────────────────────────────────────

/**
 * List authenticated user's bookings (as buyer).
 * Query: cursor (optional), limit (optional, default 20)
 */
export async function handleListBookings(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const cursorParam = c.req.query('cursor')
  const limitParam = c.req.query('limit')

  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 20

  const options: { limit: number; cursor?: string } = { limit }
  if (cursorParam) {
    options.cursor = cursorParam
  }

  const { items, nextCursor } = await listUserBookings(userId, options)

  return c.json({
    success: true,
    data: items,
    meta: {
      next_cursor: nextCursor,
      has_more: nextCursor != null,
      per_page: limit,
    },
  })
}

// ─── POST /bookings/:id/complete ──────────────────────────────────────────────

/**
 * Creator marks a booking as completed.
 */
export async function handleCompleteBooking(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const bookingId = c.req.param('id')

  if (!bookingId) {
    throw new AppError('validation-failed', 400, 'Booking ID is required')
  }

  await completeBooking(bookingId, userId)

  return c.json({ success: true, data: { completed: true } })
}
