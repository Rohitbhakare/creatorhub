import { Hono } from 'hono'
import { authenticate } from '../middleware/authenticate.js'
import {
  handleGetInvoice,
  handleGetTds,
  handleGetTdsSummary,
} from '../handlers/tax.js'

const taxRoutes = new Hono()

// ── Buyer: download booking invoice ──────────────────────────────────────────
taxRoutes.get('/invoice/:bookingId', authenticate, handleGetInvoice)

// ── Creator: view TDS info for a specific booking ─────────────────────────────
taxRoutes.get('/tds/:bookingId', authenticate, handleGetTds)

// ── Creator: annual TDS summary for a financial year ──────────────────────────
// NOTE: route order matters — this must come before /tds/:bookingId if Hono
// would conflict, but since the param segment differs (:financialYear vs :bookingId)
// and the prefix is /tds/summary/ vs /tds/, there is no conflict.
taxRoutes.get('/tds/summary/:financialYear', authenticate, handleGetTdsSummary)

export default taxRoutes
