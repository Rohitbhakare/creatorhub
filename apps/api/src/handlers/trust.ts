import type { Context } from 'hono'
import { AppError } from '../errors/AppError.js'
import { env } from '../env.js'
import {
  submitReport,
  checkToxicity,
  getPendingReports,
  getReportDetail,
  actionReport,
  giveStrike,
  getUserStrikes,
  type ReportReason,
  type ReportedType,
} from '../services/trust.service.js'

// ─── Admin id resolution ──────────────────────────────────────────────────────
//
// Session-authed callers have `adminId` set on the context by
// `requireAdminRole`; legacy `x-admin-secret` callers don't. For the
// latter we look at the `x-admin-id` header first (Retool convention
// kept for continuity) then body `admin_id`, then fall back to the
// sentinel `'admin'` so audit rows stay non-null. T23 drops the
// sentinel and makes adminId mandatory.

function resolveActingAdminId(
  c: Context,
  body: Record<string, unknown> | null,
): string {
  const ctxAdminId = c.get('adminId') as string | undefined
  if (ctxAdminId) return ctxAdminId
  const headerAdminId = c.req.header('x-admin-id')
  if (headerAdminId && headerAdminId.trim().length > 0) return headerAdminId
  if (body !== null) {
    const bodyAdminId = body['admin_id']
    if (typeof bodyAdminId === 'string' && bodyAdminId.trim().length > 0) {
      return bodyAdminId
    }
  }
  return 'admin'
}

// Legacy secret path still uses this (check-text is `x-admin-secret`
// only). Kept for the one remaining pre-E4.1 surface.
function requireAdminSecret(c: Context): void {
  const adminSecret = env.ADMIN_SECRET
  if (!adminSecret) {
    throw new AppError('forbidden', 403, 'Admin access is not configured')
  }
  const provided = c.req.header('x-admin-secret')
  if (provided !== adminSecret) {
    throw new AppError('forbidden', 403, 'Invalid admin secret')
  }
}

// ─── POST /reports — submit report (authenticated) ───────────────────────────

/**
 * POST /api/v1/reports
 * Submit a report for a piece of content, user, comment, or review.
 * Authenticated. Rate-limited to 10 per hour per user (service-level).
 */
export async function handleSubmitReport(c: Context): Promise<Response> {
  const reporterId = c.get('userId') as string

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  }

  const b = body as Record<string, unknown>

  // Validate required fields
  const validReportedTypes: ReportedType[] = ['content', 'user', 'comment', 'review']
  const validReasons: ReportReason[] = [
    'spam',
    'nudity',
    'violence',
    'harassment',
    'misinformation',
    'other',
  ]

  const reportedType = b['reported_type'] as ReportedType
  const reportedId = b['reported_id'] as string
  const reason = b['reason'] as ReportReason
  const details = typeof b['details'] === 'string' ? b['details'] : undefined

  if (!validReportedTypes.includes(reportedType)) {
    throw new AppError('validation-failed', 400, 'Invalid reported_type', [
      {
        field: 'reported_type',
        message: `Must be one of: ${validReportedTypes.join(', ')}`,
        code: 'invalid_enum',
      },
    ])
  }

  if (typeof reportedId !== 'string' || reportedId.trim().length === 0) {
    throw new AppError('validation-failed', 400, 'reported_id is required', [
      { field: 'reported_id', message: 'reported_id is required', code: 'required' },
    ])
  }

  if (!validReasons.includes(reason)) {
    throw new AppError('validation-failed', 400, 'Invalid reason', [
      {
        field: 'reason',
        message: `Must be one of: ${validReasons.join(', ')}`,
        code: 'invalid_enum',
      },
    ])
  }

  if (details !== undefined && details.length > 500) {
    throw new AppError('validation-failed', 400, 'Details too long', [
      { field: 'details', message: 'Details must be at most 500 characters', code: 'too_long' },
    ])
  }

  const result = await submitReport(reporterId, reportedType, reportedId, reason, details)

  c.header('Location', `/api/v1/reports/${result.id}`)
  return c.json({ success: true, data: result }, 201)
}

// ─── POST /moderation/check-text — check toxicity (admin secret) ─────────────

/**
 * POST /api/v1/moderation/check-text
 * Check text toxicity via Perspective API.
 * Protected by x-admin-secret header (internal use / Retool).
 */
export async function handleCheckText(c: Context): Promise<Response> {
  requireAdminSecret(c)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  }

  const b = body as Record<string, unknown>
  const text = b['text']

  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new AppError('validation-failed', 400, 'text is required', [
      { field: 'text', message: 'text is required', code: 'required' },
    ])
  }

  const score = await checkToxicity(text)
  const isToxic = score >= 0.8

  return c.json({ success: true, data: { score, is_toxic: isToxic } })
}

// ─── GET /admin/reports — get pending reports (admin) ────────────────────────

/**
 * GET /api/v1/admin/reports
 * List pending reports, optionally filtered by reported_type.
 * Cursor-paginated. Route is gated by `dualAdminAuth` at the router
 * layer (content_moderator + super_admin).
 */
export async function handleGetReports(c: Context): Promise<Response> {
  const query = c.req.query()
  const cursor = typeof query['cursor'] === 'string' ? query['cursor'] : undefined
  const limitRaw = query['limit']
  const limit = limitRaw !== undefined ? Math.min(parseInt(limitRaw, 10) || 20, 100) : 20
  const reportedType = query['reported_type'] as ReportedType | undefined

  const validTypes: ReportedType[] = ['content', 'user', 'comment', 'review']
  if (reportedType !== undefined && !validTypes.includes(reportedType)) {
    throw new AppError('validation-failed', 400, 'Invalid reported_type filter', [
      {
        field: 'reported_type',
        message: `Must be one of: ${validTypes.join(', ')}`,
        code: 'invalid_enum',
      },
    ])
  }

  const options: Parameters<typeof getPendingReports>[0] = { limit }
  if (cursor !== undefined) options.cursor = cursor
  if (reportedType !== undefined) options.reportedType = reportedType

  const { items, nextCursor } = await getPendingReports(options)

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

// ─── GET /admin/reports/:id — fetch a single report ──────────────────────────

/**
 * GET /api/v1/admin/reports/:id
 * Fetch a single report by id. Route is gated by `dualAdminAuth`.
 */
export async function handleGetReport(c: Context): Promise<Response> {
  const reportId = c.req.param('id')
  if (reportId === undefined || reportId.length === 0) {
    throw new AppError('validation-failed', 400, 'report id is required')
  }
  const report = await getReportDetail(reportId)
  return c.json({ success: true, data: report })
}

// ─── POST /admin/reports/:id/action — admin action a report ──────────────────

/**
 * POST /api/v1/admin/reports/:id/action
 * Take action on a report: content_removed | user_suspended | dismissed.
 * Route is gated by `dualAdminAuth`.
 */
export async function handleActionReport(c: Context): Promise<Response> {
  const reportId = c.req.param('id')
  if (reportId === undefined || reportId.length === 0) {
    throw new AppError('validation-failed', 400, 'report id is required')
  }

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  }

  const b = body as Record<string, unknown>
  const adminId = resolveActingAdminId(c, b)
  const validActions = ['content_removed', 'user_suspended', 'dismissed'] as const
  type ValidAction = (typeof validActions)[number]

  const action = b['action'] as ValidAction

  if (!validActions.includes(action)) {
    throw new AppError('validation-failed', 400, 'Invalid action', [
      {
        field: 'action',
        message: `Must be one of: ${validActions.join(', ')}`,
        code: 'invalid_enum',
      },
    ])
  }

  await actionReport(reportId, adminId, action)

  return c.json({ success: true, data: { report_id: reportId, action } })
}

// ─── POST /admin/users/:id/strike — give user a strike ───────────────────────

/**
 * POST /api/v1/admin/users/:id/strike
 * Give a user a strike. Records reason + admin identifier.
 * Route is gated by `dualAdminAuth`.
 */
export async function handleGiveStrike(c: Context): Promise<Response> {
  const userId = c.req.param('id')
  if (userId === undefined || userId.length === 0) {
    throw new AppError('validation-failed', 400, 'user id is required')
  }

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  }

  const b = body as Record<string, unknown>
  const adminId = resolveActingAdminId(c, b)
  const reason = b['reason']

  if (typeof reason !== 'string' || reason.trim().length === 0) {
    throw new AppError('validation-failed', 400, 'reason is required', [
      { field: 'reason', message: 'reason is required', code: 'required' },
    ])
  }

  await giveStrike(userId, adminId, reason)

  return c.json({ success: true, data: { user_id: userId, message: 'Strike recorded' } }, 201)
}

// ─── GET /admin/users/:id/strikes — get user strikes ─────────────────────────

/**
 * GET /api/v1/admin/users/:id/strikes
 * Get a user's strike history and total count.
 * Route is gated by `dualAdminAuth`.
 */
export async function handleGetStrikes(c: Context): Promise<Response> {
  const userId = c.req.param('id')
  if (userId === undefined || userId.length === 0) {
    throw new AppError('validation-failed', 400, 'user id is required')
  }

  const result = await getUserStrikes(userId)

  return c.json({ success: true, data: result })
}
