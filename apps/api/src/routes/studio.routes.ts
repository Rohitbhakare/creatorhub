import { Hono } from 'hono'
import { authenticate } from '../middleware/authenticate.js'
import {
  handleGetAlert,
  handleDismissAlert,
  handleGetStats,
  handleListContent,
  handleGetContentCounts,
} from '../handlers/studio.js'
import { handleStudioPayoutsPdf } from '../handlers/studio-payouts-pdf.js'

const studio = new Hono()

// ─── Alerts ──────────────────────────────────────────────────────
studio.get('/alerts', authenticate, handleGetAlert)
studio.put('/alerts/:alertId/dismiss', authenticate, handleDismissAlert)

// ─── Stats ───────────────────────────────────────────────────────
studio.get('/stats', authenticate, handleGetStats)

// ─── Content ─────────────────────────────────────────────────────
// query: status, type, cursor, limit
studio.get('/content/counts', authenticate, handleGetContentCounts)
studio.get('/content', authenticate, handleListContent)

// ─── Payouts PDF (E5.7 T4) ───────────────────────────────────────
studio.get('/payouts.pdf', authenticate, handleStudioPayoutsPdf)

export default studio
