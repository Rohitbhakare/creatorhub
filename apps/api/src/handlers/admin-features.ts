// Feature/unfeature handlers (E4.1, T7 · ADM-FR-011).
//
// Editorial curation — `content.featured` / `users.featured` booleans
// flipped by content_moderator or super_admin. Every flip is audited
// with the optional `reason` from the body.
//
// Auth path:
//   - Session cookie (preferred) → `c.get('adminId')` + `adminEmail`
//   - Legacy `x-admin-secret` (Retool) → falls back to body `admin_id`,
//     audit rows attributed with placeholder email "legacy-secret".

import type { Context } from 'hono'
import { AppError } from '../errors/AppError.js'
import {
  setContentFeatured,
  setUserFeatured,
} from '../services/admin-features.service.js'
import {
  recordAdminAudit,
  extractRequestMeta,
} from '../services/admin-audit.service.js'
import type { FeatureToggleInput } from '@creatorhub/shared'

// ─── Helpers ──────────────────────────────────────────────────

function routeParam(c: Context, name: string): string {
  const val = c.req.param(name)
  if (val === undefined || val.length === 0) {
    throw new AppError('validation-failed', 400, `${name} is required`)
  }
  return val
}

/**
 * Resolve acting admin. Session path is the common case; legacy secret
 * path has no adminId/email on context — we use the body `admin_id`
 * (already validated to exist on secret writes) and a sentinel email
 * so the audit row is still attributable to the caller.
 */
function resolveActor(
  c: Context,
  bodyAdminId?: string,
): { id: string; email: string } {
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
 * The body is validated by `validateBody(featureToggleSchema)` — only
 * `reason` is part of the schema. `admin_id` is a legacy-secret escape
 * hatch that we read off the raw body if the schema dropped it.
 */
async function readRawAdminId(c: Context): Promise<string | undefined> {
  try {
    const raw = (await c.req.json()) as unknown
    if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) {
      const v = (raw as Record<string, unknown>)['admin_id']
      if (typeof v === 'string' && v.trim().length > 0) return v
    }
  } catch {
    // Fall through — no body / already consumed.
  }
  return undefined
}

// ─── Content ───────────────────────────────────────────────────

export async function handleFeatureContent(c: Context): Promise<Response> {
  return toggleContent(c, true)
}

export async function handleUnfeatureContent(c: Context): Promise<Response> {
  return toggleContent(c, false)
}

async function toggleContent(c: Context, featured: boolean): Promise<Response> {
  const contentId = routeParam(c, 'contentId')
  const body = c.get('validatedBody') as FeatureToggleInput
  const legacyAdminId = await readRawAdminId(c)
  const acting = resolveActor(c, legacyAdminId)
  const { ipAddress, userAgent } = extractRequestMeta(c)

  await setContentFeatured(contentId, featured)

  void recordAdminAudit({
    adminId: acting.id,
    adminEmail: acting.email,
    action: featured ? 'feature_content' : 'unfeature_content',
    targetType: 'content',
    targetId: contentId,
    details: body.reason ? { reason: body.reason } : {},
    ipAddress,
    userAgent,
  })

  return c.json({ success: true })
}

// ─── Users ─────────────────────────────────────────────────────

export async function handleFeatureUser(c: Context): Promise<Response> {
  return toggleUser(c, true)
}

export async function handleUnfeatureUser(c: Context): Promise<Response> {
  return toggleUser(c, false)
}

async function toggleUser(c: Context, featured: boolean): Promise<Response> {
  const userId = routeParam(c, 'userId')
  const body = c.get('validatedBody') as FeatureToggleInput
  const legacyAdminId = await readRawAdminId(c)
  const acting = resolveActor(c, legacyAdminId)
  const { ipAddress, userAgent } = extractRequestMeta(c)

  await setUserFeatured(userId, featured)

  void recordAdminAudit({
    adminId: acting.id,
    adminEmail: acting.email,
    action: featured ? 'feature_user' : 'unfeature_user',
    targetType: 'user',
    targetId: userId,
    details: body.reason ? { reason: body.reason } : {},
    ipAddress,
    userAgent,
  })

  return c.json({ success: true })
}
