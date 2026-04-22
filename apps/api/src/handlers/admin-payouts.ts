// Admin payout handlers (E4.1, T8 · ADM-FR-004).
//
// Endpoint:
//   POST /api/v1/admin/payouts/release  → force-release a pending payout
//
// Gated at the route layer by `dualAdminAuth([finance, super_admin])`.

import type { Context } from 'hono'
import { AppError } from '../errors/AppError.js'
import { forceReleasePayout } from '../services/admin-payouts.service.js'
import {
  recordAdminAudit,
  extractRequestMeta,
} from '../services/admin-audit.service.js'
import type { ForceReleasePayoutInput } from '@creatorhub/shared'

/**
 * Resolve acting admin. Session path is the standard case; legacy
 * secret callers do not have adminId/email on context — we read
 * `admin_id` from the body and use a sentinel email so the audit row
 * still attributes correctly.
 */
function resolveActor(c: Context, bodyAdminId?: string): {
  id: string
  email: string
} {
  const ctxId = c.get('adminId') as string | undefined
  const ctxEmail = c.get('adminEmail') as string | undefined
  if (ctxId && ctxEmail) return { id: ctxId, email: ctxEmail }

  if (bodyAdminId && bodyAdminId.trim().length > 0) {
    return { id: bodyAdminId, email: 'legacy-secret' }
  }
  throw new AppError(
    'validation-failed',
    400,
    'admin_id is required (legacy callers) or a valid admin session cookie must be present',
  )
}

/**
 * Read the raw JSON body to retrieve `admin_id` for legacy secret
 * callers. Zod strips unknown keys from the validated body, so we
 * fetch it from the cached parse.
 */
async function readRawAdminId(c: Context): Promise<string | undefined> {
  try {
    const raw = (await c.req.json()) as unknown
    if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
      const v = (raw as Record<string, unknown>)['admin_id']
      if (typeof v === 'string' && v.trim().length > 0) return v
    }
  } catch {
    // Fall through.
  }
  return undefined
}

// ─── POST /api/v1/admin/payouts/release ───────────────────────

export async function handleForceReleasePayout(c: Context): Promise<Response> {
  const body = c.get('validatedBody') as ForceReleasePayoutInput
  const legacyAdminId = await readRawAdminId(c)
  const acting = resolveActor(c, legacyAdminId)
  const { ipAddress, userAgent } = extractRequestMeta(c)

  const result = await forceReleasePayout(body.payout_id)

  void recordAdminAudit({
    adminId: acting.id,
    adminEmail: acting.email,
    action: 'force_release_payout',
    targetType: 'payout',
    targetId: body.payout_id,
    details: { reason: body.reason, status: result.status },
    ipAddress,
    userAgent,
  })

  return c.json({ success: true, data: result })
}
