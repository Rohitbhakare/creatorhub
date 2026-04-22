// Legacy admin handlers (pre-E4.1) — now gated by `dualAdminAuth`.
//
// Authentication + RBAC are handled by the route-level middleware.
// These handlers read the acting admin id from:
//   1. `c.get('adminId')` — populated by requireAdminRole when the
//       request authenticates via session cookie.
//   2. body `admin_id` — legacy path used by Retool / ops scripts
//       that still send `x-admin-secret`. Removed with T23.
//
// The helper `resolveActingAdminId` encapsulates that fallback so
// per-handler code doesn't repeat it. Handlers that don't need an
// admin id (read-only endpoints) simply skip the call.

import type { Context } from 'hono'
import { AppError } from '../errors/AppError.js'
import {
  searchUsers,
  getUserDetail,
  suspendUser,
  unsuspendUser,
  takedownContent,
  getContentForModeration,
  listPendingKyc,
  getKycSubmission,
  processRefund,
  getAdminBookingDetail,
  searchContent,
  getAuditLog,
} from '../services/admin.service.js'
import { approveKyc, rejectKyc } from '../services/kyc.service.js'

// ─── Helpers ──────────────────────────────────────────────────

/**
 * Resolve the admin id that should be attributed to this action.
 *
 * Priority: session context > body field. Throws 400 if neither is
 * available (legacy callers MUST send `admin_id` in the body so audit
 * log entries remain attributable).
 */
function resolveActingAdminId(
  c: Context,
  body: Record<string, unknown>,
): string {
  const ctxAdminId = c.get('adminId') as string | undefined
  if (ctxAdminId) return ctxAdminId

  const bodyAdminId = body['admin_id']
  if (typeof bodyAdminId === 'string' && bodyAdminId.trim().length > 0) {
    return bodyAdminId
  }

  throw new AppError(
    'validation-failed',
    400,
    'admin_id is required (legacy callers) or a valid admin session cookie must be present',
  )
}

function requireString(b: Record<string, unknown>, field: string): string {
  const val = b[field]
  if (typeof val !== 'string' || !val.trim()) {
    throw new AppError('validation-failed', 400, `${field} is required`)
  }
  return val
}

async function parseJsonBody(c: Context): Promise<Record<string, unknown>> {
  let raw: unknown
  try {
    raw = await c.req.json()
  } catch {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new AppError('validation-failed', 400, 'Request body must be a JSON object')
  }
  return raw as Record<string, unknown>
}

/**
 * Same as `parseJsonBody` but returns an empty object when the request
 * has no body or non-JSON body. For endpoints where the session cookie
 * is sufficient and the body is only used as a legacy fallback.
 */
async function parseOptionalJsonBody(
  c: Context,
): Promise<Record<string, unknown>> {
  let raw: unknown
  try {
    raw = await c.req.json()
  } catch {
    return {}
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return {}
  }
  return raw as Record<string, unknown>
}

function routeParam(c: Context, name: string): string {
  const val = c.req.param(name)
  if (val === undefined || val.length === 0) {
    throw new AppError('validation-failed', 400, `${name} is required`)
  }
  return val
}

// ─── GET /admin/users/search ──────────────────────────────────

export async function handleSearchUsers(c: Context): Promise<Response> {
  const query = c.req.query('q') ?? ''
  if (!query.trim()) {
    throw new AppError('validation-failed', 400, 'Query parameter "q" is required')
  }
  const rawLimit = Number(c.req.query('limit') ?? '20')
  const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100)

  const results = await searchUsers(query, limit)

  return c.json({ success: true, data: results })
}

// ─── GET /admin/users/:userId ─────────────────────────────────

export async function handleGetUserDetail(c: Context): Promise<Response> {
  const userId = routeParam(c, 'userId')
  const detail = await getUserDetail(userId)

  return c.json({ success: true, data: detail })
}

// ─── POST /admin/users/:userId/suspend ───────────────────────

export async function handleSuspendUser(c: Context): Promise<Response> {
  const userId = routeParam(c, 'userId')
  const body = await parseJsonBody(c)
  const adminId = resolveActingAdminId(c, body)
  const reason = requireString(body, 'reason')

  await suspendUser(userId, adminId, reason)

  return c.json({ success: true })
}

// ─── POST /admin/users/:userId/unsuspend ─────────────────────

export async function handleUnsuspendUser(c: Context): Promise<Response> {
  const userId = routeParam(c, 'userId')
  const body = await parseJsonBody(c)
  const adminId = resolveActingAdminId(c, body)

  await unsuspendUser(userId, adminId)

  return c.json({ success: true })
}

// ─── POST /admin/content/:contentId/takedown ──────────────────

export async function handleTakedownContent(c: Context): Promise<Response> {
  const contentId = routeParam(c, 'contentId')
  const body = await parseJsonBody(c)
  const adminId = resolveActingAdminId(c, body)
  const reason = requireString(body, 'reason')

  await takedownContent(contentId, adminId, reason)

  return c.json({ success: true })
}

// ─── GET /admin/content/search ────────────────────────────────

export async function handleSearchContent(c: Context): Promise<Response> {
  const query = c.req.query('q') ?? ''
  if (!query.trim()) {
    throw new AppError('validation-failed', 400, 'Query parameter "q" is required')
  }
  const rawLimit = Number(c.req.query('limit') ?? '20')
  const limit =
    Number.isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 50)
  const results = await searchContent(query, limit)
  return c.json({ success: true, data: results })
}

// ─── GET /admin/content/:contentId ───────────────────────────

export async function handleGetContentForModeration(c: Context): Promise<Response> {
  const contentId = routeParam(c, 'contentId')
  const detail = await getContentForModeration(contentId)

  return c.json({ success: true, data: detail })
}

// ─── GET /admin/kyc ───────────────────────────────────────────

export async function handleListPendingKyc(c: Context): Promise<Response> {
  const cursor = c.req.query('cursor')
  const rawLimit = Number(c.req.query('limit') ?? '20')
  const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100)

  const kycOpts: { cursor?: string; limit?: number } = { limit }
  if (cursor) kycOpts.cursor = cursor
  const { items, nextCursor } = await listPendingKyc(kycOpts)

  return c.json({
    success: true,
    data: items,
    meta: {
      next_cursor: nextCursor,
      has_more: nextCursor != null,
      per_page: limit,
    },
  })
}

// ─── GET /admin/kyc/:userId ───────────────────────────────────

export async function handleGetKycSubmission(c: Context): Promise<Response> {
  const userId = routeParam(c, 'userId')
  const submission = await getKycSubmission(userId)

  return c.json({ success: true, data: submission })
}

// ─── POST /admin/kyc/:userId/approve ─────────────────────────

export async function handleApproveKycSession(c: Context): Promise<Response> {
  const userId = routeParam(c, 'userId')
  const body = await parseOptionalJsonBody(c)
  const adminId = resolveActingAdminId(c, body)

  await approveKyc(userId, adminId)

  return c.json({ success: true })
}

// ─── POST /admin/kyc/:userId/reject ──────────────────────────

export async function handleRejectKycSession(c: Context): Promise<Response> {
  const userId = routeParam(c, 'userId')
  const body = await parseJsonBody(c)
  const adminId = resolveActingAdminId(c, body)
  const reason = requireString(body, 'reason')
  if (reason.trim().length < 10) {
    throw new AppError(
      'validation-failed',
      400,
      'reason must be at least 10 characters',
    )
  }

  await rejectKyc(userId, adminId, reason)

  return c.json({ success: true })
}

// ─── GET /admin/bookings/:bookingId ───────────────────────────

export async function handleGetAdminBookingDetail(
  c: Context,
): Promise<Response> {
  const bookingId = routeParam(c, 'bookingId')
  const detail = await getAdminBookingDetail(bookingId)
  return c.json({ success: true, data: detail })
}

// ─── POST /admin/bookings/:bookingId/refund ───────────────────

export async function handleProcessRefund(c: Context): Promise<Response> {
  const bookingId = routeParam(c, 'bookingId')
  const body = await parseJsonBody(c)
  const adminId = resolveActingAdminId(c, body)
  const reason = requireString(body, 'reason')

  await processRefund(bookingId, adminId, reason)

  return c.json({ success: true })
}

// ─── GET /admin/audit-log ─────────────────────────────────────

export async function handleGetAuditLog(c: Context): Promise<Response> {
  const cursor = c.req.query('cursor')
  const queryAdminId = c.req.query('admin_id')
  const rawLimit = Number(c.req.query('limit') ?? '20')
  const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100)

  // Non-super_admin sessions only see their own rows (plan §7, §12).
  // Legacy secret callers are treated as super_admin (no scoping) —
  // accepted risk during T5 window, removed with T23.
  const ctxRole = c.get('adminRole') as string | undefined
  const ctxAdminId = c.get('adminId') as string | undefined

  const scopedAdminId =
    ctxRole && ctxRole !== 'super_admin' && ctxAdminId
      ? ctxAdminId
      : queryAdminId

  const auditOpts: { cursor?: string; limit?: number; adminId?: string } = { limit }
  if (cursor) auditOpts.cursor = cursor
  if (scopedAdminId) auditOpts.adminId = scopedAdminId
  const { items, nextCursor } = await getAuditLog(auditOpts)

  return c.json({
    success: true,
    data: items,
    meta: {
      next_cursor: nextCursor,
      has_more: nextCursor != null,
      per_page: limit,
    },
  })
}
