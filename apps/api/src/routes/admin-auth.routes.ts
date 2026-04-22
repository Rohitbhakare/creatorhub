// Admin auth routes (E4.1).
//
// Mounted under /api/v1/admin/auth. The login endpoint is public +
// tightly rate-limited (10 req/min/IP); the others require a valid
// session. /me and /change-password tolerate must_change_password=true
// so the UI can complete the rotation flow.

import { Hono } from 'hono'
import { validateBody } from '../middleware/validate.js'
import { authRateLimit } from '../middleware/rateLimit.js'
import { requireAnyAdmin } from '../middleware/requireAdminRole.js'
import {
  handleAdminLogin,
  handleAdminLogout,
  handleAdminMe,
  handleAdminChangePassword,
} from '../handlers/admin-auth.js'
import {
  adminLoginSchema,
  adminChangePasswordSchema,
} from '@creatorhub/shared'

const adminAuthRoutes = new Hono()

// POST /login — public, rate-limited per IP to frustrate brute-force.
adminAuthRoutes.post(
  '/login',
  authRateLimit,
  validateBody(adminLoginSchema),
  handleAdminLogin,
)

// POST /logout — public (accepts missing/expired cookie). Idempotent.
adminAuthRoutes.post('/logout', handleAdminLogout)

// GET /me — any signed-in admin; allowed even with must_change_password.
adminAuthRoutes.get('/me', requireAnyAdmin, handleAdminMe)

// POST /change-password — any signed-in admin; allowed while mcp=true.
adminAuthRoutes.post(
  '/change-password',
  requireAnyAdmin,
  validateBody(adminChangePasswordSchema),
  handleAdminChangePassword,
)

export default adminAuthRoutes
