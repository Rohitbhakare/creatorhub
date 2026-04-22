// Admin session token + cookie helpers (E4.1).
//
// Pure JWT, HS256, 4h absolute TTL, no refresh. Signing secret is
// separate from the app-wide JWT_SECRET so that leaking user tokens
// cannot impersonate admins (and vice versa).

import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import type { Context } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import { env } from '../env.js'
import { AppError } from '../errors/AppError.js'
import type { AdminRole } from '@creatorhub/shared'

export const ADMIN_SESSION_COOKIE = 'ch_admin_session'
export const ADMIN_SESSION_TTL_SECONDS = 4 * 60 * 60 // 4 hours
const ADMIN_JWT_ISSUER = 'creatorhub-admin'
const ADMIN_JWT_AUDIENCE = 'admin-panel'

export interface AdminSessionPayload extends JWTPayload {
  sub: string // admin_users.id
  role: AdminRole
  email: string
  mcp: boolean // must_change_password snapshot at sign time
}

function signingSecret(): Uint8Array {
  const secret = env.ADMIN_SESSION_SECRET
  if (!secret) {
    // Deliberate: refuse to mint or verify without a dedicated secret.
    // The ADMIN_SECRET fallback is only for legacy Retool header auth.
    console.error('[admin-session] ADMIN_SESSION_SECRET not configured')
    throw new AppError('internal', 500, 'Admin sessions not configured on this server')
  }
  return new TextEncoder().encode(secret)
}

export async function signAdminSession(payload: {
  adminId: string
  role: AdminRole
  email: string
  mustChangePassword: boolean
}): Promise<string> {
  return new SignJWT({
    role: payload.role,
    email: payload.email,
    mcp: payload.mustChangePassword,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(payload.adminId)
    .setIssuer(ADMIN_JWT_ISSUER)
    .setAudience(ADMIN_JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_TTL_SECONDS.toString()}s`)
    .sign(signingSecret())
}

export async function verifyAdminSession(token: string): Promise<AdminSessionPayload> {
  try {
    const { payload } = await jwtVerify(token, signingSecret(), {
      issuer: ADMIN_JWT_ISSUER,
      audience: ADMIN_JWT_AUDIENCE,
    })
    return payload as AdminSessionPayload
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('exp') || msg.includes('expired')) {
      throw new AppError('token-expired', 401, 'Session expired, please sign in again')
    }
    throw new AppError('invalid-token', 401, 'Invalid admin session')
  }
}

export function setAdminSessionCookie(c: Context, token: string): void {
  const isProd = env.NODE_ENV === 'production'
  setCookie(c, ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'Strict',
    path: '/',
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  })
}

export function clearAdminSessionCookie(c: Context): void {
  // deleteCookie must match the path/domain used when setting.
  deleteCookie(c, ADMIN_SESSION_COOKIE, { path: '/' })
}
