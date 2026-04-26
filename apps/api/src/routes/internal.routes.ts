import { Hono } from 'hono'
import {
  handleReleasePayoutsCron,
  handleSweepBookingIntentsCron,
} from '../handlers/internal.cron.js'

const internalRoutes = new Hono()

// Cron entry points — auth is enforced inside each handler via x-internal-cron-key.
internalRoutes.post('/cron/payouts/release', handleReleasePayoutsCron)
internalRoutes.post('/cron/booking-intents/sweep', handleSweepBookingIntentsCron)

export default internalRoutes
