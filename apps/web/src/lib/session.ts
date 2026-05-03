import 'server-only'
import { cookies } from 'next/headers'
import { jwtVerify, SignJWT } from 'jose'
import { logger } from './logger'

const SESSION_SECRET = process.env.SESSION_SECRET ?? 'dev-only-secret-change-me-min-32-chars-required-here'
const SESSION_COOKIE = 'ch_session'
const ACCESS_COOKIE = 'ch_access'
const REFRESH_COOKIE = 'ch_refresh'

const ACCESS_MAX_AGE = 60 * 60 // 1h
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30 // 30d
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30d

const secretKey = new TextEncoder().encode(SESSION_SECRET)

export interface SessionPayload {
  userId: string
  username: string
  // Round-5 audit caught a /studio + /you crash chain: the JWT carries
  // null when a user signed up via OAuth without setting a display name,
  // but this was typed `string`. Honest type now; callers must guard.
  displayName: string | null
  avatarUrl: string | null
  isCreator: boolean
  vertical: string | null
}

const COOKIE_BASE = {
  httpOnly: true as const,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/' as const,
}

/**
 * Build the three session cookies (`ch_session`, `ch_access`, `ch_refresh`).
 * Returns each cookie as a discrete `{ name, value, options }` so the
 * caller can attach them to its NextResponse via `res.cookies.set(...)`.
 *
 * Why not call `cookies().set()` here directly? In Next.js 15 route
 * handlers, `next/headers` cookies() mutations don't reliably propagate
 * to a response built with NextResponse.json(...) — the response is
 * finalised before the runtime flushes the mutation, so the browser
 * never sees Set-Cookie. Setting on the response object itself is the
 * documented stable path.
 */
export interface SessionCookie {
  name: string
  value: string
  options: {
    httpOnly: true
    secure: boolean
    sameSite: 'lax'
    path: '/'
    maxAge: number
  }
}

export async function buildSessionCookies(
  payload: SessionPayload,
  tokens: { access_token: string; refresh_token: string },
): Promise<SessionCookie[]> {
  const sessionJwt = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${String(SESSION_MAX_AGE)}s`)
    .sign(secretKey)

  logger.info({ userId: payload.userId }, 'session:created')
  return [
    { name: SESSION_COOKIE, value: sessionJwt, options: { ...COOKIE_BASE, maxAge: SESSION_MAX_AGE } },
    { name: ACCESS_COOKIE, value: tokens.access_token, options: { ...COOKIE_BASE, maxAge: ACCESS_MAX_AGE } },
    { name: REFRESH_COOKIE, value: tokens.refresh_token, options: { ...COOKIE_BASE, maxAge: REFRESH_MAX_AGE } },
  ]
}

/**
 * Server-action / RSC helper. In route handlers prefer buildSessionCookies
 * and attach to your NextResponse directly.
 */
export async function createSession(
  payload: SessionPayload,
  tokens: { access_token: string; refresh_token: string },
): Promise<void> {
  const jar = await cookies()
  const cookieList = await buildSessionCookies(payload, tokens)
  for (const c of cookieList) {
    jar.set(c.name, c.value, c.options)
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secretKey)
    return {
      userId: payload.userId as string,
      username: payload.username as string,
      displayName: payload.displayName as string,
      avatarUrl: (payload.avatarUrl as string | null) ?? null,
      isCreator: Boolean(payload.isCreator),
      vertical: (payload.vertical as string | null) ?? null,
    }
  } catch (err) {
    logger.warn({ err: String(err) }, 'session:verify-failed')
    return null
  }
}

export async function destroySession(): Promise<void> {
  const jar = await cookies()
  jar.delete(SESSION_COOKIE)
  jar.delete(ACCESS_COOKIE)
  jar.delete(REFRESH_COOKIE)
  logger.info('session:destroyed')
}

export async function getRefreshToken(): Promise<string | null> {
  const jar = await cookies()
  return jar.get(REFRESH_COOKIE)?.value ?? null
}

export async function setAccessToken(token: string): Promise<void> {
  const jar = await cookies()
  jar.set(ACCESS_COOKIE, token, { ...COOKIE_BASE, maxAge: ACCESS_MAX_AGE })
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE
