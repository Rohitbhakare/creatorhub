import 'server-only'
import { cookies } from 'next/headers'
import { logger } from './logger'
import { AppError, toAppError } from './errors'

// Tests set E2E_API_BASE_URL to point Next at the mock-api-server. We check
// it first because Next.js loads .env.local with higher precedence than
// inline `API_BASE_URL=…` on the command line, so a developer with a real
// API_BASE_URL in .env.local would otherwise see tests hit production.
const API_BASE =
  process.env.E2E_API_BASE_URL ??
  process.env.API_BASE_URL ??
  'http://localhost:3001'

// Debug print on module load — visible in dev stdout. Helps diagnose
// "tests are hitting the wrong API" issues quickly.
if (
  process.env.NODE_ENV !== 'production' &&
  typeof window === 'undefined'
) {
  // eslint-disable-next-line no-console
  console.log(`[api-client] API_BASE = ${API_BASE}`)
}
const DEFAULT_TIMEOUT_MS = 5_000
const MAX_RETRIES = 2
const RETRY_BACKOFF_BASE_MS = 150

interface ApiSuccess<T> {
  success: true
  data: T
}

interface ApiErrorBody {
  type: string
  status: number
  detail: string
  instance?: string
}

/**
 * Hono API wraps errors as `{ success: false, error: { type, status, detail, instance } }`
 * (see apps/api/src/middleware/errorHandler.ts). It also tolerates the bare
 * `{ type, ... }` shape some legacy handlers emit. Normalise both.
 */
function unwrapError(raw: unknown): ApiErrorBody | null {
  if (!raw || typeof raw !== 'object') return null
  const obj = raw as Record<string, unknown>
  // Wrapped: { success: false, error: {...} }
  if (obj.success === false && obj.error && typeof obj.error === 'object') {
    return obj.error as ApiErrorBody
  }
  // Bare: { type, status, detail, ... }
  if (typeof obj.type === 'string') {
    return obj as unknown as ApiErrorBody
  }
  return null
}

export interface FetchOptions extends Omit<RequestInit, 'body'> {
  /** Request body — will be JSON-serialized when not a string/FormData. */
  body?: unknown
  /** Per-request timeout in ms. Default 5s. */
  timeoutMs?: number
  /** Number of retry attempts on 5xx / network errors. Default 2. */
  retries?: number
  /** Override the auth cookie behavior. By default reads from request cookies. */
  authToken?: string | null
  /** Idempotency key for mutations — required for booking + payment paths. */
  idempotencyKey?: string
  /** Next.js fetch cache options. */
  next?: { revalidate?: number | false; tags?: string[] }
  /** Skip auth cookie reading (for public endpoints in RSC). */
  skipAuth?: boolean
}

async function readAccessToken(): Promise<string | null> {
  try {
    const jar = await cookies()
    return jar.get('ch_access')?.value ?? null
  } catch {
    return null
  }
}

/**
 * Auto-refresh helper. When `apiFetch` gets a 401 from the upstream API,
 * we try to swap the (likely-expired) `ch_access` cookie for a fresh one
 * using the longer-lived `ch_refresh` token, then retry the original
 * request once. Round-5 redeploy QA caught this as the publish-flow
 * blocker: ch_access is 1h TTL while ch_session is 30d, so any user
 * testing for >1 hour saw every API call 401 with "Missing Authorization
 * header" until they signed out and back in.
 *
 * Returns the new access token on success, null otherwise. Sets new
 * ch_access + ch_refresh cookies via `cookies().set()` — which DOES
 * round-trip in route handler contexts where apiFetch runs (the
 * documented unreliability in session.ts is for service-layer calls,
 * not in-handler synchronous mutations).
 *
 * Marked with a Symbol on the cookie jar so a single request only ever
 * tries one refresh — defends against an infinite refresh loop if the
 * refresh token itself is bad.
 */
const REFRESH_ATTEMPTED = Symbol('refresh-attempted')

async function tryRefreshAccessToken(): Promise<string | null> {
  let jar
  try {
    jar = await cookies()
  } catch {
    return null
  }
  const jarAny = jar as unknown as Record<symbol, boolean>
  if (jarAny[REFRESH_ATTEMPTED]) return null
  jarAny[REFRESH_ATTEMPTED] = true

  const refreshToken = jar.get('ch_refresh')?.value
  if (!refreshToken) return null

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
      // Refresh has its own short timeout so a slow upstream doesn't
      // pile latency onto the original failed request.
      signal: AbortSignal.timeout(3_000),
    })
    if (!res.ok) return null
    const json = (await res.json()) as { data?: { access_token?: string; refresh_token?: string } }
    const newAccess = json.data?.access_token
    const newRefresh = json.data?.refresh_token
    if (!newAccess) return null

    const cookieBase = {
      httpOnly: true as const,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/' as const,
    }
    jar.set('ch_access', newAccess, { ...cookieBase, maxAge: 60 * 60 })
    if (newRefresh) {
      jar.set('ch_refresh', newRefresh, { ...cookieBase, maxAge: 60 * 60 * 24 * 30 })
    }
    return newAccess
  } catch {
    return null
  }
}

function genRequestId(): string {
  // Cryptographically random 16-byte hex — visible in logs + traceable to API.
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * Retry only on transient server-side failures.
 * Explicitly NOT retrying 429 — retrying a rate-limit response just
 * compounds the pressure on the upstream and gets the client banned faster.
 * Callers that need a backoff strategy on 429 should handle it explicitly.
 */
function isRetryable(status: number): boolean {
  return status === 408 || status === 502 || status === 503 || status === 504
}

/**
 * Server-side API fetch.
 * - Auto-attaches access cookie unless skipAuth=true
 * - Attaches request-id for distributed tracing
 * - Times out at 5s by default
 * - Retries 5xx/429 with exponential backoff
 * - Maps API errors to AppError without leaking internals
 * - Logs every request (level=info on 2xx, warn on 4xx, error on 5xx)
 */
export async function apiFetch<T>(path: string, opts: FetchOptions = {}): Promise<T> {
  const {
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = MAX_RETRIES,
    authToken,
    idempotencyKey,
    skipAuth = false,
    next,
    method = 'GET',
    headers: extraHeaders,
    ...rest
  } = opts

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const requestId = genRequestId()

  const headers: Record<string, string> = {
    'X-Request-Id': requestId,
    Accept: 'application/json',
    ...(extraHeaders as Record<string, string> | undefined),
  }

  if (!skipAuth) {
    const token = authToken ?? (await readAccessToken())
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let serializedBody: BodyInit | undefined
  if (body !== undefined && body !== null) {
    if (body instanceof FormData || typeof body === 'string') {
      serializedBody = body as BodyInit
    } else {
      serializedBody = JSON.stringify(body)
      headers['Content-Type'] = 'application/json'
    }
  }

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }

  const log = logger.child({ requestId, method, url })

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => {
      controller.abort()
    }, timeoutMs)
    const start = performance.now()

    try {
      const fetchInit: RequestInit & { next?: FetchOptions['next'] } = {
        ...rest,
        method,
        headers,
        signal: controller.signal,
      }
      if (serializedBody !== undefined) fetchInit.body = serializedBody
      if (next !== undefined) fetchInit.next = next

      const res = await fetch(url, fetchInit)
      clearTimeout(timer)
      const duration = Math.round(performance.now() - start)

      if (res.ok) {
        const json = (await res.json()) as ApiSuccess<T>
        log.info({ status: res.status, durationMs: duration, attempt }, 'api:ok')
        return json.data
      }

      // Non-2xx
      let errBody: ApiErrorBody | null = null
      try {
        errBody = unwrapError(await res.json())
      } catch {
        /* body wasn't JSON */
      }

      const appErr = new AppError({
        type: errBody?.type ?? 'upstream-failure',
        status: errBody?.status ?? res.status,
        detail: errBody?.detail ?? `HTTP ${String(res.status)}`,
        ...(errBody?.instance !== undefined ? { instance: errBody.instance } : {}),
      })

      if (isRetryable(res.status) && attempt < retries) {
        const backoff = RETRY_BACKOFF_BASE_MS * Math.pow(2, attempt)
        log.warn(
          { status: res.status, durationMs: duration, attempt, retryAfterMs: backoff },
          'api:retry',
        )
        await delay(backoff)
        continue
      }

      // 401 with an Authorization-header issue → access token expired.
      // Try a one-shot refresh + retry independent of the caller's
      // retry budget (callers like /booking-intents pass retries=0 to
      // avoid double-holds, but a refresh-retry isn't a duplicate
      // mutation — it's the same in-flight intent with a freshly-rotated
      // token). Only fires for authed callers (skipAuth=false) and only
      // once per request (the symbol on the cookie jar guards against
      // loops). Round-5 fix for the publish flow's "Missing
      // Authorization header" cascade.
      if (res.status === 401 && !skipAuth && attempt === 0) {
        const newAccess = await tryRefreshAccessToken()
        if (!newAccess) {
          log.warn(
            { status: 401, durationMs: duration },
            'api:refresh-unavailable',
          )
        }
        if (newAccess) {
          headers.Authorization = `Bearer ${newAccess}`
          log.info({ attempt }, 'api:refreshed-and-retrying')
          const retryStart = performance.now()
          const retryInit: RequestInit & { next?: FetchOptions['next'] } = {
            ...fetchInit,
            headers,
            signal: AbortSignal.timeout(timeoutMs),
          }
          if (serializedBody !== undefined) retryInit.body = serializedBody
          const retryRes = await fetch(url, retryInit)
          const retryDuration = Math.round(performance.now() - retryStart)
          if (retryRes.ok) {
            const json = (await retryRes.json()) as ApiSuccess<T>
            log.info(
              { status: retryRes.status, durationMs: retryDuration, refreshed: true },
              'api:ok',
            )
            return json.data
          }
          // Refresh-retry came back non-2xx — fall through to normal
          // error handling using the retry's status, since it reflects
          // the post-refresh state.
          let retryErrBody: ApiErrorBody | null = null
          try {
            retryErrBody = unwrapError(await retryRes.json())
          } catch {
            /* body wasn't JSON */
          }
          throw new AppError({
            type: retryErrBody?.type ?? 'upstream-failure',
            status: retryErrBody?.status ?? retryRes.status,
            detail: retryErrBody?.detail ?? `HTTP ${String(retryRes.status)}`,
            ...(retryErrBody?.instance !== undefined ? { instance: retryErrBody.instance } : {}),
          })
        }
      }

      // 404 is "expected missing" — many resources are looked up speculatively
      // (creator-by-username, content-by-id from a stale link, etc.). Logging
      // every 404 at warn level pollutes the signal we actually care about
      // (5xx, 429, 4xx with bad inputs from us).
      const logLevel: 'info' | 'warn' | 'error' =
        res.status === 404 ? 'info' : res.status >= 500 ? 'error' : 'warn'
      log[logLevel]({ status: res.status, durationMs: duration, attempt }, 'api:error')
      throw appErr
    } catch (err) {
      clearTimeout(timer)
      const duration = Math.round(performance.now() - start)

      if (err instanceof AppError) throw err

      // Network / timeout / abort
      const isTimeout = err instanceof DOMException && err.name === 'AbortError'
      if (attempt < retries && (isTimeout || err instanceof TypeError)) {
        const backoff = RETRY_BACKOFF_BASE_MS * Math.pow(2, attempt)
        log.warn({ durationMs: duration, attempt, retryAfterMs: backoff }, 'api:network-retry')
        await delay(backoff)
        continue
      }

      log.error({ durationMs: duration, attempt, err: String(err) }, 'api:network-error')
      throw isTimeout
        ? AppError.upstream('Request timed out')
        : toAppError(err)
    }
  }

  throw AppError.upstream('Request failed after retries')
}

/**
 * Public variant — for landing/mini-site/content pages where guest browsing
 * is expected. Returns null on 404, 429, and 5xx so the calling RSC can
 * render a graceful empty/skeleton state instead of crashing the whole
 * page render with a "Server Components render" error.
 *
 * Why 429 here specifically? A traffic burst (social share spike, scraper)
 * causes our upstream rate-limiter to start refusing requests. If those
 * 429s propagate as exceptions through transformContentDetail → page →
 * Suspense, the user sees the error.tsx fallback. Returning null means the
 * page renders with empty content rails — degraded but never broken.
 */
export async function apiFetchPublic<T>(
  path: string,
  opts: FetchOptions = {},
): Promise<T | null> {
  try {
    return await apiFetch<T>(path, { ...opts, skipAuth: true })
  } catch (err) {
    if (
      err instanceof AppError &&
      (err.status === 404 ||
        err.status === 429 ||
        (err.status >= 500 && err.status < 600))
    ) {
      return null
    }
    throw err
  }
}

/** Generate idempotency key (UUIDv4-ish) for booking mutations. */
export function newIdempotencyKey(): string {
  return crypto.randomUUID()
}
