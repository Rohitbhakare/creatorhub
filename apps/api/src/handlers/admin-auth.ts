// Admin auth handlers (E4.1).
//
// Endpoints:
//   POST /api/v1/admin/auth/login           → public, rate-limited
//   POST /api/v1/admin/auth/logout          → any signed-in admin
//   GET  /api/v1/admin/auth/me              → any signed-in admin
//   POST /api/v1/admin/auth/change-password → any signed-in admin
//
// Handlers are thin: validate → call service → shape response.
// Service layer owns business rules; handlers own HTTP concerns
// (cookies, status codes, audit entries).

import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'
import {
  loginAdmin,
  changeAdminPassword,
  getAdminProfile,
} from '../services/admin-auth.service.js'
import {
  ADMIN_SESSION_COOKIE,
  signAdminSession,
  setAdminSessionCookie,
  clearAdminSessionCookie,
  verifyAdminSession,
} from '../utils/admin-session.js'
import {
  recordAdminAudit,
  extractRequestMeta,
} from '../services/admin-audit.service.js'
import type {
  AdminLoginInput,
  AdminChangePasswordInput,
  AdminRole,
} from '@creatorhub/shared'

/**
 * POST /api/v1/admin/auth/login
 *
 * Body: { email, password }
 * 200: { success: true, data: { admin, mustChangePassword } }
 * 401: invalid-credentials (generic, covers wrong password + unknown email)
 * 403: admin-forbidden (inactive, only after password proven)
 * 423: account-locked
 *
 * Side effects:
 *   - Sets `ch_admin_session` cookie on success
 *   - Writes 'login' audit row on success (fire-and-forget)
 */
export async function handleAdminLogin(c: Context): Promise<Response> {
  const body = c.get('validatedBody') as AdminLoginInput
  const { ipAddress, userAgent } = extractRequestMeta(c)

  const result = await loginAdmin(body.email, body.password)

  const token = await signAdminSession({
    adminId: result.adminRow.id,
    role: result.adminRow.role,
    email: result.adminRow.email,
    mustChangePassword: result.mustChangePassword,
  })
  setAdminSessionCookie(c, token)

  // Fire-and-forget audit. Must not delay the response.
  void recordAdminAudit({
    adminId: result.adminRow.id,
    adminEmail: result.adminRow.email,
    action: 'login',
    ipAddress,
    userAgent,
  })

  return c.json({
    success: true,
    data: {
      admin: result.admin,
      must_change_password: result.mustChangePassword,
    },
  })
}

/**
 * POST /api/v1/admin/auth/logout
 *
 * 204 always. Idempotent — safe to call with a missing, expired, or
 * malformed cookie. We try to read the session for audit purposes
 * but swallow any error; the primary action is cookie removal.
 *
 * This endpoint is NOT behind requireAdminRole so that stuck
 * sessions can still be cleared client-side.
 */
export async function handleAdminLogout(c: Context): Promise<Response> {
  const { ipAddress, userAgent } = extractRequestMeta(c)
  const token = getCookie(c, ADMIN_SESSION_COOKIE)

  clearAdminSessionCookie(c)

  if (token) {
    try {
      const payload = await verifyAdminSession(token)
      void recordAdminAudit({
        adminId: payload.sub,
        adminEmail: payload.email,
        action: 'logout',
        ipAddress,
        userAgent,
      })
    } catch {
      // Expired/invalid cookie — nothing to audit. Cookie already cleared.
    }
  }

  return c.body(null, 204)
}

/**
 * GET /api/v1/admin/auth/me
 * 200: { success: true, data: AdminProfile }
 *
 * Allowed even when must_change_password=true so the UI can render
 * the change-password screen.
 */
export async function handleAdminMe(c: Context): Promise<Response> {
  const adminId = c.get('adminId') as string
  const profile = await getAdminProfile(adminId)
  return c.json({ success: true, data: profile })
}

/**
 * POST /api/v1/admin/auth/change-password
 * Body: { current_password, new_password }
 * 204: success (password rotated, must_change_password cleared)
 * 401: invalid-credentials (wrong current_password)
 *
 * Side effects:
 *   - Re-signs session cookie with mcp=false
 *   - Writes 'change_password' audit row
 */
export async function handleAdminChangePassword(c: Context): Promise<Response> {
  const adminId = c.get('adminId') as string
  const adminEmail = c.get('adminEmail') as string
  const adminRole = c.get('adminRole') as AdminRole
  const body = c.get('validatedBody') as AdminChangePasswordInput
  const { ipAddress, userAgent } = extractRequestMeta(c)

  await changeAdminPassword(adminId, body.current_password, body.new_password)

  // Re-sign session so mcp flag flips immediately, without forcing
  // a logout/login round trip.
  const token = await signAdminSession({
    adminId,
    role: adminRole,
    email: adminEmail,
    mustChangePassword: false,
  })
  setAdminSessionCookie(c, token)

  void recordAdminAudit({
    adminId,
    adminEmail,
    action: 'change_password',
    ipAddress,
    userAgent,
  })

  return c.body(null, 204)
}
