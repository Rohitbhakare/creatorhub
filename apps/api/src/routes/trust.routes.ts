import { Hono } from 'hono'
import { authenticate } from '../middleware/authenticate.js'
import { dualAdminAuth } from '../middleware/dualAdminAuth.js'
import {
  handleSubmitReport,
  handleCheckText,
  handleGetReports,
  handleGetReport,
  handleActionReport,
  handleGiveStrike,
  handleGetStrikes,
} from '../handlers/trust.js'

const trustRoutes = new Hono()

const MODERATION_ROLES = ['content_moderator', 'super_admin'] as const

// ─── User routes ─────────────────────────────────────────────────────────────

// POST /api/v1/reports — submit a report (authenticated users only)
trustRoutes.post('/reports', authenticate, handleSubmitReport)

// ─── Internal — `x-admin-secret` only ────────────────────────────────────────
//
// `check-text` is a Retool/ops utility that never got a user-facing
// surface. Left on the legacy header until T23 so the existing
// internal tooling keeps working.

// POST /api/v1/moderation/check-text — check text toxicity (internal)
trustRoutes.post('/moderation/check-text', handleCheckText)

// ─── Admin — moderation (dualAdminAuth: content_moderator + super_admin) ─────

// GET /api/v1/admin/reports — list pending reports
trustRoutes.get(
  '/admin/reports',
  dualAdminAuth([...MODERATION_ROLES]),
  handleGetReports,
)

// GET /api/v1/admin/reports/:id — fetch single report
trustRoutes.get(
  '/admin/reports/:id',
  dualAdminAuth([...MODERATION_ROLES]),
  handleGetReport,
)

// POST /api/v1/admin/reports/:id/action — action a report
trustRoutes.post(
  '/admin/reports/:id/action',
  dualAdminAuth([...MODERATION_ROLES]),
  handleActionReport,
)

// POST /api/v1/admin/users/:id/strike — give user a strike
trustRoutes.post(
  '/admin/users/:id/strike',
  dualAdminAuth([...MODERATION_ROLES]),
  handleGiveStrike,
)

// GET /api/v1/admin/users/:id/strikes — get user strikes
trustRoutes.get(
  '/admin/users/:id/strikes',
  dualAdminAuth([...MODERATION_ROLES]),
  handleGetStrikes,
)

export default trustRoutes
