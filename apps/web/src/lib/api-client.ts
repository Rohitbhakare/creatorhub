import 'server-only'
import { cookies } from 'next/headers'
import { logger } from './logger'
import { AppError, toAppError } from './errors'

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3001'
const DEFAULT_TIMEOUT_MS = 5_000
const MAX_RETRIES = 2
const RETRY_BACKOFF_BASE_MS = 150

interface ApiSuccess<T> {
  success: true
  data: T
}

interface ApiError {
  type: string
  status: number
  detail: string
  instance?: string
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

function isRetryable(status: number): boolean {
  return status === 408 || status === 429 || status >= 500
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
      let errBody: ApiError | null = null
      try {
        errBody = (await res.json()) as ApiError
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

      const logLevel = res.status >= 500 ? 'error' : 'warn'
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
 * is expected. Returns null on 404 instead of throwing.
 */
export async function apiFetchPublic<T>(
  path: string,
  opts: FetchOptions = {},
): Promise<T | null> {
  try {
    return await apiFetch<T>(path, { ...opts, skipAuth: true })
  } catch (err) {
    if (err instanceof AppError && err.status === 404) return null
    throw err
  }
}

/** Generate idempotency key (UUIDv4-ish) for booking mutations. */
export function newIdempotencyKey(): string {
  return crypto.randomUUID()
}
