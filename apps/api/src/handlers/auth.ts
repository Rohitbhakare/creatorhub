import type { Context } from 'hono'
import { registerOrSignIn, refreshSession, signOut } from '../services/auth.service.js'
import { extractIp } from '../services/audit.service.js'
import type { RegisterInput } from '@creatorhub/shared'

/**
 * POST /api/v1/auth/register
 * Verifies Firebase token, upserts user, returns app session tokens.
 */
export async function handleRegister(c: Context): Promise<Response> {
  const body = c.get('validatedBody') as RegisterInput
  const ip = extractIp(c.req.raw.headers)
  const userAgent = c.req.header('User-Agent') ?? null

  const { result, isNew } = await registerOrSignIn(
    body.firebase_token,
    body.device_info,
    ip,
    userAgent,
  )

  const status = isNew ? 201 : 200

  if (isNew) {
    c.header('Location', `/api/v1/users/${result.user.id}`)
  }

  return c.json({ success: true, data: result }, status)
}

/**
 * POST /api/v1/auth/refresh
 * Exchanges a valid refresh token for new access + refresh tokens.
 */
export async function handleRefresh(c: Context): Promise<Response> {
  const body = c.get('validatedBody') as { refresh_token: string }
  const ip = extractIp(c.req.raw.headers)
  const userAgent = c.req.header('User-Agent') ?? null

  const tokens = await refreshSession(body.refresh_token, ip, userAgent)

  return c.json({ success: true, data: tokens })
}

/**
 * POST /api/v1/auth/sign-out
 * Revokes refresh token for the current device.
 */
export async function handleSignOut(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const ip = extractIp(c.req.raw.headers)
  const userAgent = c.req.header('User-Agent') ?? null

  // Try to extract refresh token from body for targeted revocation
  let refreshToken: string | undefined
  try {
    const body = await c.req.json()
    refreshToken = body?.refresh_token
  } catch {
    // Body is optional for sign-out
  }

  await signOut(userId, refreshToken, ip, userAgent)

  return c.body(null, 204)
}
