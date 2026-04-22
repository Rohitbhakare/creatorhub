// Admin audit log writer (E4.1, ADM-FR-008).
//
// Every admin write MUST call `recordAdminAudit`. Fire-and-forget on
// the DB insert — failure to audit must never break the primary
// action — but we log at error level so ops can catch persistent
// failures. The denormalized `admin_email` column means rows remain
// interpretable even after an admin is deactivated or renamed.

import type { Context } from 'hono'
import { supabase } from '../lib/supabase.js'

export interface AdminAuditInput {
  adminId: string
  adminEmail: string
  action: string
  targetType?: string
  targetId?: string
  details?: Record<string, unknown>
  ipAddress?: string | null
  userAgent?: string | null
}

export async function recordAdminAudit(input: AdminAuditInput): Promise<void> {
  try {
    const { error } = await supabase.from('admin_audit_log').insert({
      admin_id: input.adminId,
      admin_email: input.adminEmail,
      action: input.action,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      details: input.details ?? {},
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
    })
    if (error) {
      console.error(
        `[admin-audit] insert failed action=${input.action} target=${input.targetType ?? 'none'}:${input.targetId ?? 'none'}:`,
        error.message,
      )
    }
  } catch (err) {
    console.error(
      `[admin-audit] threw action=${input.action}:`,
      (err as Error).message,
    )
  }
}

/**
 * Extract request metadata (ip + user-agent) safely. Returns nulls
 * when unavailable. Trusted proxies (Fly) set x-forwarded-for.
 */
export function extractRequestMeta(c: Context): {
  ipAddress: string | null
  userAgent: string | null
} {
  const xff = c.req.header('x-forwarded-for')
  const firstIp = xff?.split(',')[0]?.trim()
  const ipAddress = firstIp ?? c.req.header('x-real-ip') ?? null
  const userAgent = c.req.header('user-agent') ?? null
  return { ipAddress, userAgent }
}
