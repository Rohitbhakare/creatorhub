import { Hono } from 'hono'
import {
  handleCreateBooking,
  handleVerifyPayment,
  handleGetBooking,
  handleListBookings,
  handleCompleteBooking,
} from '../handlers/bookings.js'
import {
  handleCancelByBuyer,
  handleCancelByCreator,
  handleGetRefundStatus,
} from '../handlers/refunds.js'
import { authenticate } from '../middleware/authenticate.js'

const bookingsRoutes = new Hono()

// ── Create booking + Razorpay order ─────────────────────────────
bookingsRoutes.post('/', authenticate, handleCreateBooking)

// ── Razorpay payment webhook — no auth (Razorpay server calls this) ──
bookingsRoutes.post('/verify-payment', handleVerifyPayment)

// ── List user's bookings (as buyer) ─────────────────────────────
bookingsRoutes.get('/', authenticate, handleListBookings)

// ── Get booking by ID ────────────────────────────────────────────
bookingsRoutes.get('/:id', authenticate, handleGetBooking)

// ── Creator marks booking completed ─────────────────────────────
bookingsRoutes.post('/:id/complete', authenticate, handleCompleteBooking)

// ── Cancellation & refunds ───────────────────────────────────────────────────
bookingsRoutes.post('/:id/cancel', authenticate, handleCancelByBuyer)
bookingsRoutes.post('/:id/cancel-by-creator', authenticate, handleCancelByCreator)
bookingsRoutes.get('/:id/refund', authenticate, handleGetRefundStatus)

export default bookingsRoutes
