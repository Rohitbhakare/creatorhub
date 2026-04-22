// Admin dashboard routes (E4.1, T14 · ADM-FR-008).
//
// Mounted at `/api/v1/admin/dashboard`. Read-only; every admin role
// sees the same summary (counts + recent audit preview).

import { Hono } from 'hono'
import { requireAdminRole } from '../middleware/requireAdminRole.js'
import { handleDashboardSummary } from '../handlers/dashboard.js'

const dashboardRoutes = new Hono()

const anyAdmin = requireAdminRole([
  'super_admin',
  'content_moderator',
  'support',
  'finance',
  'operations',
])

dashboardRoutes.get('/summary', anyAdmin, handleDashboardSummary)

export default dashboardRoutes
