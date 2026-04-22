// Dual-auth admin middleware (E4.1, T5).
//
// Transitional middleware for the 2-week cutover window. Accepts
// EITHER:
//   (a) The legacy `x-admin-secret` header (Retool, scripts) — any role
//       implied; `adminId` is not populated, handlers fall back to
//       body `admin_id` for audit attribution.
//   (b) A valid `ch_admin_session` cookie whose admin row holds a role
//       in the `allowed` list — sets `adminId` / `adminRole` /
//       `adminEmail` on context (see requireAdminRole).
//
// Ordering: secret path is checked FIRST because it is cheap (no DB
// lookup). If the secret is missing or wrong we fall through to the
// session path — that path is authoritative for errors (401/403/428).
//
// This middleware is removed in T23, leaving requireAdminRole only.

import type { Context, Next } from 'hono'
import { env } from '../env.js'
import { requireAdminRole } from './requireAdminRole.js'
import type { AdminRole } from '@creatorhub/shared'

export function dualAdminAuth(allowed: AdminRole[]) {
  // Build the session-path middleware once at wiring time so we fail
  // fast on an empty allowed list (see requireAdminRole guard).
  const sessionMiddleware = requireAdminRole(allowed)

  return async (c: Context, next: Next): Promise<void | Response> => {
    const secret = c.req.header('x-admin-secret')
    if (
      secret !== undefined &&
      env.ADMIN_SECRET !== undefined &&
      secret === env.ADMIN_SECRET
    ) {
      // Mark the request so handlers can tell which path authorized
      // them (useful for audit + future removal checks). Context vars
      // normally set by requireAdminRole stay unset.
      c.set('adminAuthMode', 'legacy-secret')
      await next()
      return
    }

    // Fall through — session path owns 401/403/428 error shapes.
    return sessionMiddleware(c, next)
  }
}
