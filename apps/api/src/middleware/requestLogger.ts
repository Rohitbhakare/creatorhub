import type { MiddlewareHandler } from 'hono'
import { env } from '../env.js'

const isDev = env.NODE_ENV === 'development'

// Fields whose values must never hit the dev console — even in development,
// these can land in screenshots, terminal scrollback, or shared session logs.
// Pattern matches `"key": "value"` (with optional whitespace) and replaces
// the value with [REDACTED] regardless of length.
const SENSITIVE_KEYS = [
  'firebase_token',
  'refresh_token',
  'access_token',
  'id_token',
  'password',
  'otp',
  'code',
  'pan',
  'pan_number',
  'aadhaar',
  'aadhaar_number',
  'bank_account',
  'bank_account_number',
  'ifsc',
  'cvv',
  'card_number',
]

function redactSensitive(body: string): string {
  let out = body
  for (const key of SENSITIVE_KEYS) {
    const re = new RegExp(`"${key}"\\s*:\\s*"[^"]*"`, 'g')
    out = out.replace(re, `"${key}":"[REDACTED]"`)
  }
  return out
}

/**
 * Request/response logger middleware.
 *
 * Dev mode: logs method, path, status, duration, and request body for mutations.
 * Production: logs method, path, status, duration only (no body — PII safety).
 */
export const requestLogger: MiddlewareHandler = async (c, next) => {
  const start = Date.now()
  const method = c.req.method
  const path = c.req.path

  // Log request body for mutations in dev (helps debug 500s)
  if (isDev && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    try {
      const cloned = c.req.raw.clone()
      const body = await cloned.text()
      if (body) {
        // Truncate large bodies, redact sensitive fields
        const truncated = body.length > 500 ? body.slice(0, 500) + '...' : body
        const redacted = redactSensitive(truncated)
        console.log(`→ ${method} ${path} body: ${redacted}`)
      }
    } catch {
      // Body already consumed or not readable — skip
    }
  }

  await next()

  const duration = Date.now() - start
  const status = c.res.status
  const icon = status >= 500 ? '❌' : status >= 400 ? '⚠️' : '✅'

  console.log(`${icon} ${method} ${path} ${status} ${duration}ms`)
}
