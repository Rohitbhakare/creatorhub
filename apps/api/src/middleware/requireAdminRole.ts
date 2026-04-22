// Admin session middleware (E4.1).
//
// Validates the `ch_admin_session` cookie, loads the current
// admin_users row for a live is_active / role check, and enforces a
// role whitelist per endpoint. Must be applied to every admin-only
// route (except the login endpoint itself).
//
// Design notes:
//   - We re-read the admin row on EVERY request. Role and is_active
//     may change mid-session (plan §11 Edge Cases). The JWT alone is
//     not authoritative for authorization — only identity.
//   - If `must_change_password` is true, only the change-password
//     endpoint is allowed. Any other mutation/read returns 428.
//   - Context is populated with `adminId`, `adminRole`, `adminEmail`
//     for handlers + downstream audit logging.

import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { AppError } from '../errors/AppError.js'
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSession,
} from '../utils/admin-session.js'
import { findAdminById } from '../services/admin-auth.service.js'
import type { AdminRole } from '@creatorhub/shared'

export interface RequireAdminRoleOptions {
  /**
   * If true, the endpoint is allowed for admins who still have
   * `must_change_password=true`. Use this for the change-password
   * and /me endpoints only.
   */
  allowMustChangePassword?: boolean
}

/**
 * Factory that returns a middleware requiring a valid admin session
 * AND a role in the `allowed` list.
 *
 * Usage:
 *   app.use('/api/v1/admin/audit/*', requireAdminRole(['super_admin']))
 */
export function requireAdminRole(
  allowed: AdminRole[],
  options: RequireAdminRoleOptions = {},
) {
  if (allowed.length === 0) {
    // Programmer error — a role guard with no roles always rejects
    // and is almost certainly a bug. Fail loud at wiring time.
    throw new Error('requireAdminRole: allowed list is empty')
  }

  return async (c: Context, next: Next): Promise<void | Response> => {
    const token = getCookie(c, ADMIN_SESSION_COOKIE)
    if (!token) {
      throw new AppError('unauthorized', 401, 'Admin session required')
    }

    const payload = await verifyAdminSession(token)

    // Live row lookup — role/active state may have changed since the
    // JWT was signed. The JWT only carries identity; authorization
    // decisions come from the current row.
    const row = await findAdminById(payload.sub)
    if (!row) {
      // Admin was deleted. Session token remains cryptographically
      // valid but maps to nothing — treat as invalid.
      throw new AppError('invalid-token', 401, 'Admin session is no longer valid')
    }
    if (!row.is_active) {
      throw new AppError(
        'admin-forbidden',
        403,
        'This admin account is inactive',
      )
    }

    if (!allowed.includes(row.role)) {
      console.warn(
        `[requireAdminRole] role=${row.role} attempted ${c.req.method} ${c.req.path} (allowed: ${allowed.join(',')})`,
      )
      throw new AppError(
        'admin-forbidden',
        403,
        'You do not have permission to perform this action',
      )
    }

    if (row.must_change_password && !options.allowMustChangePassword) {
      throw new AppError(
        'password-change-required',
        428,
        'You must change your temporary password before continuing',
      )
    }

    c.set('adminId', row.id)
    c.set('adminRole', row.role)
    c.set('adminEmail', row.email)

    await next()
  }
}

/**
 * Convenience: require a valid admin session of ANY role. For
 * endpoints like /me and /change-password where role doesn't matter.
 */
export const requireAnyAdmin = requireAdminRole(
  ['super_admin', 'content_moderator', 'support', 'finance', 'operations'],
  { allowMustChangePassword: true },
)
