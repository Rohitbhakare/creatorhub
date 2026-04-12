import type { Context, Next } from 'hono'
import { AppError } from '../errors/AppError.js'
import { extractIp } from '../services/audit.service.js'

type RateLimitConfig = {
  windowMs: number
  maxRequests: number
}

type WindowEntry = {
  count: number
  resetAt: number
}

// In-memory sliding window store (MVP — replace with Redis in V1)
const store = new Map<string, WindowEntry>()

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

function getRateLimitKey(c: Context, prefix: string): string {
  const userId = c.get('userId') as string | null
  if (userId) return `${prefix}:user:${userId}`
  const ip = extractIp(c.req.raw.headers) ?? 'unknown'
  return `${prefix}:ip:${ip}`
}

function checkLimit(key: string, config: RateLimitConfig): WindowEntry {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || existing.resetAt < now) {
    const entry: WindowEntry = { count: 1, resetAt: now + config.windowMs }
    store.set(key, entry)
    return entry
  }

  existing.count++
  store.set(key, existing)
  return existing
}

/**
 * Rate limiting middleware factory.
 * Uses in-memory sliding window (MVP). Replace with Redis for distributed rate limiting.
 *
 * Sets response headers:
 * - X-RateLimit-Limit: max requests in window
 * - X-RateLimit-Remaining: requests remaining
 * - X-RateLimit-Reset: window reset time (Unix seconds)
 */
export function rateLimit(config: RateLimitConfig, prefix = 'general') {
  return async (c: Context, next: Next) => {
    const key = getRateLimitKey(c, prefix)
    const entry = checkLimit(key, config)

    const remaining = Math.max(0, config.maxRequests - entry.count)
    const resetSeconds = Math.ceil(entry.resetAt / 1000)

    c.header('X-RateLimit-Limit', config.maxRequests.toString())
    c.header('X-RateLimit-Remaining', remaining.toString())
    c.header('X-RateLimit-Reset', resetSeconds.toString())

    if (entry.count > config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - Date.now()) / 1000)
      c.header('Retry-After', retryAfter.toString())
      throw new AppError(
        'rate-limited',
        429,
        `Too many requests. Try again in ${retryAfter.toString()} seconds.`,
      )
    }

    await next()
  }
}

// Pre-configured limiters
export const authRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 10 }, 'auth')
export const generalRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 100 }, 'general')
export const otpRateLimit = rateLimit({ windowMs: 3600_000, maxRequests: 5 }, 'otp')
