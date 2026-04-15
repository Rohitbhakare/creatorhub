import type { Context } from 'hono'
import { AppError } from '../errors/AppError.js'
import {
  getPreferences,
  updatePreferences,
  getDndStatus,
  setDndStatus,
} from '../services/notification.service.js'
import { registerDevice, unregisterDevice } from '../services/device.service.js'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function validateUUID(id: string, label: string) {
  if (!UUID_REGEX.test(id)) {
    throw new AppError('validation-failed', 400, `Invalid ${label} format`)
  }
}

// ─── GET /notifications/preferences ─────────────────────────

export async function handleGetPreferences(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const prefs = await getPreferences(userId)
  return c.json({ success: true, data: prefs })
}

// ─── PUT /notifications/preferences ─────────────────────────

export async function handleUpdatePreferences(c: Context): Promise<Response> {
  const userId = c.get('userId') as string

  const body = await c.req.json().catch(() => {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  })

  if (!Array.isArray(body.updates)) {
    throw new AppError('validation-failed', 400, 'updates must be an array')
  }

  const updates = body.updates as { category: string; channel: string; enabled: boolean }[]

  for (const u of updates) {
    if (typeof u.category !== 'string' || typeof u.channel !== 'string' || typeof u.enabled !== 'boolean') {
      throw new AppError('validation-failed', 400, 'Each update must have category (string), channel (string), and enabled (boolean)')
    }
  }

  await updatePreferences(userId, updates)
  return c.json({ success: true })
}

// ─── POST /notifications/devices ─────────────────────────────

export async function handleRegisterDevice(c: Context): Promise<Response> {
  const userId = c.get('userId') as string

  const body = await c.req.json().catch(() => {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  })

  if (typeof body.fcm_token !== 'string' || !body.fcm_token) {
    throw new AppError('validation-failed', 400, 'fcm_token is required')
  }

  if (!['ios', 'android', 'web'].includes(body.platform)) {
    throw new AppError('validation-failed', 400, 'platform must be one of: ios, android, web')
  }

  const deviceInfo =
    body.device_info !== undefined && typeof body.device_info === 'object' && body.device_info !== null
      ? (body.device_info as Record<string, unknown>)
      : undefined

  await registerDevice(userId, body.fcm_token as string, body.platform as 'ios' | 'android' | 'web', deviceInfo)
  return c.json({ success: true }, 201)
}

// ─── DELETE /notifications/devices/:tokenId ───────────────────

export async function handleUnregisterDevice(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const tokenId = c.req.param('tokenId')!
  validateUUID(tokenId, 'token ID')

  await unregisterDevice(userId, tokenId)
  return c.body(null, 204)
}

// ─── PUT /users/me/dnd ────────────────────────────────────────

export async function handleSetDnd(c: Context): Promise<Response> {
  const userId = c.get('userId') as string

  const body = await c.req.json().catch(() => {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  })

  if (typeof body.enabled !== 'boolean') {
    throw new AppError('validation-failed', 400, 'enabled must be a boolean')
  }

  await setDndStatus(userId, body.enabled as boolean)

  const dnd = await getDndStatus(userId)
  return c.json({ success: true, data: { dnd_enabled: dnd } })
}
