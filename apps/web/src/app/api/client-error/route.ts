import { type NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

/**
 * Client-error pipe. Browser-only failures (Firebase auth, hydration, fetch
 * blocked by extensions, etc.) never hit our SSR logs by default. Pages can
 * POST to this route to surface them in the same pino stream — which means
 * the existing /tmp/web.log monitor catches them too.
 *
 * Anyone can call this; we just log + 204. Don't trust the body — we
 * intentionally accept any shape and clamp size.
 */
export async function POST(req: NextRequest): Promise<Response> {
  let raw: unknown = null
  try {
    raw = await req.json()
  } catch {
    /* ignore — empty/invalid body still logs as a "client-error:unparseable" */
  }
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>

  // Clamp string fields so a runaway log line can't fill disk.
  const clamp = (v: unknown, max = 500): string | undefined => {
    if (typeof v !== 'string') return undefined
    return v.length > max ? `${v.slice(0, max)}…` : v
  }

  logger.warn(
    {
      where: clamp(body.where) ?? 'unknown',
      msg: clamp(body.msg),
      code: clamp(body.code),
      url: clamp(body.url),
      stack: clamp(body.stack, 1500),
      userAgent: clamp(req.headers.get('user-agent'), 200),
    },
    'client-error',
  )

  return new NextResponse(null, { status: 204 })
}
