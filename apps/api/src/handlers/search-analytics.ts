// Search analytics handlers (E4.1, T10 · ADM-FR-010).
//
// Routes mounted under `/api/v1/admin/analytics/search`. Read-only —
// no audit log entries (the dashboards are read by any admin). Writes
// to search suggestion bias (if ever added) would need their own
// audit coverage.

import type { Context } from 'hono'
import {
  getTopQueries,
  getZeroResultQueries,
  getClickThroughRate,
  type AnalyticsWindow,
} from '../services/search-analytics.service.js'
import type { AnalyticsWindowInput } from '@creatorhub/shared'

function query(c: Context): { window: AnalyticsWindow; limit: number } {
  const parsed = c.get('validatedQuery') as AnalyticsWindowInput
  return { window: parsed.window, limit: parsed.limit }
}

// ─── GET /top ──────────────────────────────────────────────────

export async function handleTopQueries(c: Context): Promise<Response> {
  const { window, limit } = query(c)
  const data = await getTopQueries(window, limit)
  return c.json({ success: true, data: { window, rows: data } })
}

// ─── GET /zero-results ─────────────────────────────────────────

export async function handleZeroResultQueries(c: Context): Promise<Response> {
  const { window, limit } = query(c)
  const data = await getZeroResultQueries(window, limit)
  return c.json({ success: true, data: { window, rows: data } })
}

// ─── GET /ctr ──────────────────────────────────────────────────

export async function handleClickThroughRate(c: Context): Promise<Response> {
  const { window, limit } = query(c)
  const data = await getClickThroughRate(window, limit)
  return c.json({ success: true, data: { window, rows: data } })
}
