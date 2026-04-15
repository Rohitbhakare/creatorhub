import { Hono } from 'hono'
import {
  handleGetRefundPolicy,
  handleSetRefundPolicy,
  handleCancelByBuyer,
  handleCancelByCreator,
  handleGetRefundStatus,
} from '../handlers/refunds.js'
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js'

const refundsRoutes = new Hono()

// ── Refund policy on content ──────────────────────────────────────────────────
// GET  /content/:id/refund-policy  — public (optional auth)
refundsRoutes.get('/content/:id/refund-policy', optionalAuthenticate, handleGetRefundPolicy)

// PUT  /content/:id/refund-policy  — creator only
refundsRoutes.put('/content/:id/refund-policy', authenticate, handleSetRefundPolicy)

// ── Booking cancellation ──────────────────────────────────────────────────────
// POST /bookings/:id/cancel               — buyer cancels
refundsRoutes.post('/bookings/:id/cancel', authenticate, handleCancelByBuyer)

// POST /bookings/:id/cancel-by-creator    — creator cancels
refundsRoutes.post('/bookings/:id/cancel-by-creator', authenticate, handleCancelByCreator)

// GET  /bookings/:id/refund               — get refund status
refundsRoutes.get('/bookings/:id/refund', authenticate, handleGetRefundStatus)

export default refundsRoutes
