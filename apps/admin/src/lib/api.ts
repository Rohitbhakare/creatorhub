// Browser-side fetch helper for client components.
//
// All calls go through the Next.js proxy (`/api/proxy/*`) so the admin
// session cookie stays first-party. The proxy relays the request to
// the Hono API and echoes the Set-Cookie headers on the way back.

import type { ApiError, ApiSuccess } from './types'

export class ClientApiError extends Error {
  public readonly status: number
  public readonly code: string | undefined
  public readonly fieldErrors: Array<{ field: string; message: string }> | undefined

  constructor(
    status: number,
    message: string,
    code?: string,
    fieldErrors?: Array<{ field: string; message: string }>,
  ) {
    super(message)
    this.status = status
    if (code !== undefined) this.code = code
    if (fieldErrors !== undefined) this.fieldErrors = fieldErrors
  }
}

export interface ClientFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

/**
 * Call the admin API through the same-origin proxy. `path` is the
 * Hono path minus the `/api/v1` prefix (so `/admin/auth/login`).
 */
export async function apiFetch<T>(
  path: string,
  options: ClientFetchOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  const { body: rawBody, ...rest } = options
  const init: RequestInit = { ...rest, headers, credentials: 'same-origin' }
  if (rawBody !== undefined) {
    init.body = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody)
  }

  const res = await fetch(`/api/proxy${path}`, init)

  let parsed: unknown = null
  try {
    parsed = await res.json()
  } catch {
    // no body / not JSON
  }

  if (!res.ok) {
    const errBody = parsed as ApiError | null
    const detail = errBody?.error.detail ?? res.statusText
    const code = errBody?.error.type
    const fieldErrors = (parsed as { error?: { errors?: unknown } } | null)
      ?.error?.errors as
      | Array<{ field: string; message: string }>
      | undefined
    throw new ClientApiError(res.status, detail, code, fieldErrors)
  }

  return (parsed as ApiSuccess<T>).data
}
