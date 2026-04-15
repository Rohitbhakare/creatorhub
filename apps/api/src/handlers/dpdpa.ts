import type { Context } from 'hono'
import { AppError } from '../errors/AppError.js'
import {
  requestDeletion,
  cancelDeletion,
  getDeletionStatus,
  exportUserData,
  recordConsent,
  getConsentStatus,
  type ConsentType,
} from '../services/dpdpa.service.js'

// ─── Valid consent types ─────────────────────────────────────

const VALID_CONSENT_TYPES: ConsentType[] = [
  'terms_of_service',
  'privacy_policy',
  'content_tnc',
]

// ─── POST /dpdpa/deletion/request ────────────────────────────

export async function handleRequestDeletion(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const result = await requestDeletion(userId)
  return c.json({ success: true, data: result }, 201)
}

// ─── POST /dpdpa/deletion/cancel ────────────────────────────

export async function handleCancelDeletion(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  await cancelDeletion(userId)
  return c.json({ success: true })
}

// ─── GET /dpdpa/deletion/status ──────────────────────────────

export async function handleGetDeletionStatus(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const status = await getDeletionStatus(userId)
  return c.json({ success: true, data: status })
}

// ─── GET /dpdpa/export ────────────────────────────────────────

export async function handleExportUserData(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const exportData = await exportUserData(userId)

  const filename = `creatorhub-data-export-${new Date().toISOString().slice(0, 10)}.json`

  c.header('Content-Disposition', `attachment; filename="${filename}"`)
  c.header('Content-Type', 'application/json; charset=utf-8')

  return c.json({ success: true, data: exportData })
}

// ─── POST /dpdpa/consent ──────────────────────────────────────

export async function handleRecordConsent(c: Context): Promise<Response> {
  const userId = c.get('userId') as string

  const body = await c.req.json().catch(() => {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  })

  const { type, version } = body as { type?: unknown; version?: unknown }

  if (!type || !VALID_CONSENT_TYPES.includes(type as ConsentType)) {
    throw new AppError(
      'validation-failed',
      400,
      `type must be one of: ${VALID_CONSENT_TYPES.join(', ')}`,
    )
  }

  if (typeof version !== 'string' || !version.trim()) {
    throw new AppError('validation-failed', 400, 'version is required and must be a string')
  }

  const ip = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? null
  const userAgent = c.req.header('user-agent') ?? null

  await recordConsent(userId, type as ConsentType, version.trim(), ip, userAgent)

  return c.json({ success: true }, 201)
}

// ─── GET /dpdpa/consent ───────────────────────────────────────

export async function handleGetConsentStatus(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const status = await getConsentStatus(userId)
  return c.json({ success: true, data: status })
}
