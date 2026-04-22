// Admin dashboard handler (E4.1, T14).
//
// Read-only; no audit log entry (dashboard loads are not interesting
// and would flood the audit table). Open to all five admin roles —
// the summary is informational, not destructive.

import type { Context } from 'hono'
import { getDashboardSummary } from '../services/dashboard.service.js'

export async function handleDashboardSummary(c: Context): Promise<Response> {
  const data = await getDashboardSummary()
  return c.json({ success: true, data })
}
