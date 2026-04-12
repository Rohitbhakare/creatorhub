import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { createHash, randomBytes } from 'node:crypto'
import { env } from '../env.js'
import { SESSION_MOBILE_DAYS, SESSION_WEB_DAYS } from '@creatorhub/shared'

const secret = new TextEncoder().encode(env.JWT_SECRET)

export type Platform = 'ios' | 'android' | 'web'

export type AccessTokenPayload = JWTPayload & {
  sub: string // userId
  type: 'access'
}

export type RefreshTokenPayload = JWTPayload & {
  sub: string // userId
  type: 'refresh'
  device_id: string
}

const ACCESS_TOKEN_EXPIRY = '1h'

function refreshTokenExpiry(platform: Platform): string {
  const days = platform === 'web' ? SESSION_WEB_DAYS : SESSION_MOBILE_DAYS
  return `${days.toString()}d`
}

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({ type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setIssuer('creatorhub')
    .sign(secret)
}

export async function signRefreshToken(
  userId: string,
  deviceId: string,
  platform: Platform,
): Promise<string> {
  return new SignJWT({ type: 'refresh', device_id: deviceId } satisfies Omit<RefreshTokenPayload, 'sub' | 'iat' | 'exp' | 'iss'>)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(refreshTokenExpiry(platform))
    .setIssuer('creatorhub')
    .sign(secret)
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, secret, { issuer: 'creatorhub' })
  if (payload.type !== 'access') throw new Error('Not an access token')
  return payload as AccessTokenPayload
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
  const { payload } = await jwtVerify(token, secret, { issuer: 'creatorhub' })
  if (payload.type !== 'refresh') throw new Error('Not a refresh token')
  return payload as RefreshTokenPayload
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function generateDeviceId(): string {
  return randomBytes(16).toString('hex')
}
