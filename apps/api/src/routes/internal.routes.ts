import { Hono } from 'hono'
import { handleReleasePayoutsCron } from '../handlers/internal.cron.js'

const internalRoutes = new Hono()

// Cron entry points — auth is enforced inside each handler via x-internal-cron-key.
internalRoutes.post('/cron/payouts/release', handleReleasePayoutsCron)

export default internalRoutes
