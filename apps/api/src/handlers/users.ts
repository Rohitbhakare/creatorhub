import type { Context } from 'hono'
import { getUserProfile } from '../services/auth.service.js'
import {
  getPublicProfile,
  updateProfile,
  updateUsername,
  getProfileCompletion,
} from '../services/profile.service.js'
import { getDndStatus, setDndStatus } from '../services/notification.service.js'
import { AppError } from '../errors/AppError.js'

// ─── GET /users/me ──────────────────────────────────────────────
export async function handleGetMe(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const profile = await getUserProfile(userId)
  return c.json({ success: true, data: profile })
}

// ─── PUT /users/me ──────────────────────────────────────────────
export async function handleUpdateProfile(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const body = c.get('validatedBody') as Record<string, unknown>
  const updated = await updateProfile(userId, body)
  return c.json({ success: true, data: updated })
}

// ─── PUT /users/me/username ─────────────────────────────────────
export async function handleUpdateUsername(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const { username } = c.get('validatedBody') as { username: string }
  const updated = await updateUsername(userId, username)
  return c.json({ success: true, data: updated })
}

// ─── GET /users/me/completion ───────────────────────────────────
export async function handleGetCompletion(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const completion = await getProfileCompletion(userId)
  return c.json({ success: true, data: completion })
}

// ─── PUT /users/me/dnd ──────────────────────────────────────────
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

// ─── GET /users/:id ─────────────────────────────────────────────
export async function handleGetPublicProfile(c: Context): Promise<Response> {
  const targetId = c.req.param('id')

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(targetId)) {
    throw new AppError('validation-failed', 400, 'Invalid user ID format')
  }

  const viewerId = (c.get('userId') as string | undefined) ?? null
  const profile = await getPublicProfile(targetId, viewerId)
  return c.json({ success: true, data: profile })
}
