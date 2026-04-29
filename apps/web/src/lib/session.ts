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
  displayName: string
  avatarUrl: string | null
  isCreator: boolean
  vertical: string | null
}

const COOKIE_BASE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

export async function createSession(
  payload: SessionPayload,
  tokens: { access_token: string; refresh_token: string },
): Promise<void> {
  const jar = await cookies()

  const sessionJwt = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${String(SESSION_MAX_AGE)}s`)
    .sign(secretKey)

  jar.set(SESSION_COOKIE, sessionJwt, { ...COOKIE_BASE, maxAge: SESSION_MAX_AGE })
  jar.set(ACCESS_COOKIE, tokens.access_token, { ...COOKIE_BASE, maxAge: ACCESS_MAX_AGE })
  jar.set(REFRESH_COOKIE, tokens.refresh_token, { ...COOKIE_BASE, maxAge: REFRESH_MAX_AGE })

  logger.info({ userId: payload.userId }, 'session:created')
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
