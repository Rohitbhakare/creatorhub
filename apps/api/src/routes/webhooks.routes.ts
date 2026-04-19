import { Hono } from 'hono'
import { handleRazorpayWebhook } from '../handlers/webhooks.razorpay.js'

const webhooksRoutes = new Hono()

// ── Razorpay webhook — no auth (verified via HMAC signature) ─────────────────
webhooksRoutes.post('/razorpay', handleRazorpayWebhook)

export default webhooksRoutes
