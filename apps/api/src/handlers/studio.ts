import type { Context } from 'hono'
import {
  getTopAlert,
  dismissAlert,
  getCreatorStats,
  listCreatorContent,
} from '../services/studio.service.js'
import { AppError } from '../errors/AppError.js'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function validateUUID(id: string, label: string) {
  if (!UUID_REGEX.test(id)) {
    throw new AppError('validation-failed', 400, `Invalid ${label} format`)
  }
}

// ─── GET /studio/alerts ──────────────────────────────────────────

export async function handleGetAlert(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const alert = await getTopAlert(userId)
  return c.json({
    success: true,
    data: {
      id: alert.id,
      alert_type: alert.alertType,
      priority: alert.priority,
      title: alert.title,
      body: alert.body,
      cta_target: alert.ctaTarget,
    },
  })
}

// ─── PUT /studio/alerts/:alertId/dismiss ─────────────────────────

export async function handleDismissAlert(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const alertId = c.req.param('alertId')!

  // Skip UUID validation for the synthetic quiet_state alert
  if (alertId !== 'quiet') {
    validateUUID(alertId, 'alert ID')
  }

  await dismissAlert(userId, alertId)
  return c.body(null, 204)
}

// ─── GET /studio/stats ───────────────────────────────────────────

export async function handleGetStats(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const stats = await getCreatorStats(userId)
  return c.json({
    success: true,
    data: {
      followers: stats.followers,
      content_count: stats.contentCount,
      views: stats.views,
      saves: stats.saves,
      bookings: stats.bookings,
    },
  })
}

// ─── GET /studio/content ─────────────────────────────────────────

export async function handleListContent(c: Context): Promise<Response> {
  const userId = c.get('userId') as string

  const status = c.req.query('status') || undefined
  const type = c.req.query('type') || undefined
  const cursor = c.req.query('cursor') || undefined
  const limitRaw = c.req.query('limit')
  const limit = limitRaw ? Math.min(parseInt(limitRaw, 10), 50) : 20

  const VALID_STATUSES = ['draft', 'published', 'archived']
  if (status && !VALID_STATUSES.includes(status)) {
    throw new AppError(
      'validation-failed',
      400,
      `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    )
  }

  const opts: { status?: string; type?: string; cursor?: string; limit?: number } = { limit }
  if (status) opts.status = status
  if (type) opts.type = type
  if (cursor) opts.cursor = cursor
  const result = await listCreatorContent(userId, opts)
  return c.json({ success: true, data: result })
}
