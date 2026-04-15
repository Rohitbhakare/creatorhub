import type { MiddlewareHandler } from 'hono'
import { env } from '../env.js'

const isDev = env.NODE_ENV === 'development'

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
        const redacted = truncated
          .replace(/"firebase_token"\s*:\s*"[^"]{20}[^"]*"/g, '"firebase_token":"[REDACTED]"')
          .replace(/"refresh_token"\s*:\s*"[^"]{20}[^"]*"/g, '"refresh_token":"[REDACTED]"')
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
