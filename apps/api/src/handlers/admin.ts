import type { Context } from 'hono'
import { AppError } from '../errors/AppError.js'
import { env } from '../env.js'
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
  getAuditLog,
} from '../services/admin.service.js'

// ─── Admin secret check ───────────────────────────────────────

function checkAdminSecret(c: Context): void {
  const secret = c.req.header('x-admin-secret')
  if (!secret || !env.ADMIN_SECRET || secret !== env.ADMIN_SECRET) {
    throw new AppError('forbidden', 403, 'Invalid or missing admin secret')
  }
}

function requireString(b: Record<string, unknown>, field: string): string {
  const val = b[field]
  if (typeof val !== 'string' || !val.trim()) {
    throw new AppError('validation-failed', 400, `${field} is required`)
  }
  return val as string
}

// ─── GET /admin/users/search ──────────────────────────────────

export async function handleSearchUsers(c: Context): Promise<Response> {
  checkAdminSecret(c)

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
  checkAdminSecret(c)

  const userId = c.req.param('userId')!
  const detail = await getUserDetail(userId)

  return c.json({ success: true, data: detail })
}

// ─── POST /admin/users/:userId/suspend ───────────────────────

export async function handleSuspendUser(c: Context): Promise<Response> {
  checkAdminSecret(c)

  const userId = c.req.param('userId')!
  const body = await c.req.json().catch(() => {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  })

  const b = body as Record<string, unknown>
  const adminId = requireString(b, 'admin_id')
  const reason = requireString(b, 'reason')

  await suspendUser(userId, adminId, reason)

  return c.json({ success: true })
}

// ─── POST /admin/users/:userId/unsuspend ─────────────────────

export async function handleUnsuspendUser(c: Context): Promise<Response> {
  checkAdminSecret(c)

  const userId = c.req.param('userId')!
  const body = await c.req.json().catch(() => {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  })

  const b = body as Record<string, unknown>
  const adminId = requireString(b, 'admin_id')

  await unsuspendUser(userId, adminId)

  return c.json({ success: true })
}

// ─── POST /admin/content/:contentId/takedown ──────────────────

export async function handleTakedownContent(c: Context): Promise<Response> {
  checkAdminSecret(c)

  const contentId = c.req.param('contentId')!
  const body = await c.req.json().catch(() => {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  })

  const b = body as Record<string, unknown>
  const adminId = requireString(b, 'admin_id')
  const reason = requireString(b, 'reason')

  await takedownContent(contentId, adminId, reason)

  return c.json({ success: true })
}

// ─── GET /admin/content/:contentId ───────────────────────────

export async function handleGetContentForModeration(c: Context): Promise<Response> {
  checkAdminSecret(c)

  const contentId = c.req.param('contentId')!
  const detail = await getContentForModeration(contentId)

  return c.json({ success: true, data: detail })
}

// ─── GET /admin/kyc ───────────────────────────────────────────

export async function handleListPendingKyc(c: Context): Promise<Response> {
  checkAdminSecret(c)

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
  checkAdminSecret(c)

  const userId = c.req.param('userId')!
  const submission = await getKycSubmission(userId)

  return c.json({ success: true, data: submission })
}

// ─── POST /admin/bookings/:bookingId/refund ───────────────────

export async function handleProcessRefund(c: Context): Promise<Response> {
  checkAdminSecret(c)

  const bookingId = c.req.param('bookingId')!
  const body = await c.req.json().catch(() => {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  })

  const b = body as Record<string, unknown>
  const adminId = requireString(b, 'admin_id')
  const reason = requireString(b, 'reason')

  await processRefund(bookingId, adminId, reason)

  return c.json({ success: true })
}

// ─── GET /admin/audit-log ─────────────────────────────────────

export async function handleGetAuditLog(c: Context): Promise<Response> {
  checkAdminSecret(c)

  const cursor = c.req.query('cursor')
  const adminId = c.req.query('admin_id')
  const rawLimit = Number(c.req.query('limit') ?? '20')
  const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100)

  const auditOpts: { cursor?: string; limit?: number; adminId?: string } = { limit }
  if (cursor) auditOpts.cursor = cursor
  if (adminId) auditOpts.adminId = adminId
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
