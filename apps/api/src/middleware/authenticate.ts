import type { Context, Next } from 'hono'
import { verifyAccessToken } from '../utils/tokens.js'
import { AppError } from '../errors/AppError.js'
import { supabase } from '../lib/supabase.js'

/**
 * Extract Bearer token from Authorization header.
 */
function extractBearerToken(c: Context): string | null {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice(7)
}

/**
 * Required authentication middleware.
 * Verifies the app-issued JWT (not Firebase token).
 * Sets `userId` on Hono context variables.
 *
 * Returns 401 if:
 * - No Authorization header
 * - Invalid/malformed token
 * - Expired token
 */
export async function authenticate(c: Context, next: Next): Promise<void | Response> {
  const token = extractBearerToken(c)

  if (!token) {
    throw new AppError('unauthorized', 401, 'Missing Authorization header')
  }

  try {
    const payload = await verifyAccessToken(token)
    c.set('userId', payload.sub)
    await next()
  } catch (err) {
    if (err instanceof AppError) throw err

    // Distinguish expired vs malformed
    const message = err instanceof Error ? err.message : ''
    if (message.includes('exp') || message.includes('expired')) {
      throw new AppError('token-expired', 401, 'Access token has expired')
    }
    throw new AppError('invalid-token', 401, 'Invalid access token')
  }
}

/**
 * Optional authentication middleware.
 * If a valid token is present, sets `userId` on context.
 * If no token or invalid token, sets `userId` to null and continues.
 * Never returns 401.
 */
export async function optionalAuthenticate(c: Context, next: Next): Promise<void | Response> {
  const token = extractBearerToken(c)

  if (!token) {
    c.set('userId', null)
    await next()
    return
  }

  try {
    const payload = await verifyAccessToken(token)
    c.set('userId', payload.sub)
  } catch {
    c.set('userId', null)
  }

  await next()
}

/**
 * Requires authenticated user to be a creator (is_creator = true).
 * Must be placed AFTER `authenticate` middleware.
 */
export async function requireCreator(c: Context, next: Next): Promise<void | Response> {
  const userId = c.get('userId') as string | null

  if (!userId) {
    throw new AppError('unauthorized', 401, 'Authentication required')
  }

  const { data: user } = await supabase
    .from('users')
    .select('is_creator')
    .eq('id', userId)
    .single()

  if (!user?.is_creator) {
    throw new AppError('forbidden', 403, 'Creator account required')
  }

  await next()
}

/**
 * Requires authenticated user to have completed KYC (kyc_status = 'verified').
 * Must be placed AFTER `authenticate` middleware.
 */
export async function requireKYC(c: Context, next: Next): Promise<void | Response> {
  const userId = c.get('userId') as string | null

  if (!userId) {
    throw new AppError('unauthorized', 401, 'Authentication required')
  }

  const { data: user } = await supabase
    .from('users')
    .select('kyc_status')
    .eq('id', userId)
    .single()

  if (user?.kyc_status !== 'verified') {
    throw new AppError('forbidden', 403, 'KYC verification required')
  }

  await next()
}
