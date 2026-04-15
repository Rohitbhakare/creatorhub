import { Hono } from 'hono'
import { authenticate } from '../middleware/authenticate.js'
import {
  handleSubmitReport,
  handleCheckText,
  handleGetReports,
  handleActionReport,
  handleGiveStrike,
  handleGetStrikes,
} from '../handlers/trust.js'

const trustRoutes = new Hono()

// ─── User routes ─────────────────────────────────────────────────────────────

// POST /api/v1/reports — submit a report (authenticated users only)
trustRoutes.post('/reports', authenticate, handleSubmitReport)

// ─── Internal / admin routes (x-admin-secret required) ───────────────────────

// POST /api/v1/moderation/check-text — check text toxicity (internal)
trustRoutes.post('/moderation/check-text', handleCheckText)

// GET /api/v1/admin/reports — list pending reports (admin)
trustRoutes.get('/admin/reports', handleGetReports)

// POST /api/v1/admin/reports/:id/action — action a report (admin)
trustRoutes.post('/admin/reports/:id/action', handleActionReport)

// POST /api/v1/admin/users/:id/strike — give user a strike (admin)
trustRoutes.post('/admin/users/:id/strike', handleGiveStrike)

// GET /api/v1/admin/users/:id/strikes — get user strikes (admin)
trustRoutes.get('/admin/users/:id/strikes', handleGetStrikes)

export default trustRoutes
