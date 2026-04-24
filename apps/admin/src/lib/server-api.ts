// Server-side fetch helper for admin server components + route
// handlers. Forwards the incoming admin session cookie to the Hono
// API so the request is authenticated on the backend.
//
// Usage:
//   const me = await serverFetch<{ admin: AdminProfile }>('/api/v1/admin/auth/me')
//
// Always use this from server components / route handlers — never
// from client components. The browser talks to the Next.js proxy
// route (`/api/proxy/*`) instead.

import { cookies } from 'next/headers'
import { API_INTERNAL_URL, ADMIN_SESSION_COOKIE } from './env'
import type { ApiError, ApiSuccess } from './types'

export class ApiRequestError extends Error {
  public readonly status: number
  public readonly body: ApiError | undefined

  constructor(status: number, message: string, body?: ApiError) {
    super(message)
    this.status = status
    if (body !== undefined) this.body = body
  }
}

export interface ServerFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

export interface ListMeta {
  next_cursor: string | null
  has_more: boolean
  per_page: number
}

export interface ListResult<T> {
  items: T[]
  nextCursor: string | null
}

/**
 * Fetch a Hono API endpoint from the admin Next.js server, forwarding
 * the caller's session cookie. Throws `ApiRequestError` on non-2xx.
 */
export async function serverFetch<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<T> {
  const jar = await cookies()
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value

  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Cookie', `${ADMIN_SESSION_COOKIE}=${token}`)
  }

  const { body: rawBody, ...rest } = options
  const init: RequestInit = {
    ...rest,
    headers,
    cache: 'no-store',
  }
  if (rawBody !== undefined) {
    init.body = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody)
  }

  const res = await fetch(`${API_INTERNAL_URL}${path}`, init)

  if (!res.ok) {
    const body = (await res.json().catch(() => undefined)) as
      | ApiError
      | undefined
    throw new ApiRequestError(
      res.status,
      body?.error.detail ?? res.statusText,
      body,
    )
  }

  const json = (await res.json()) as ApiSuccess<T>
  return json.data
}

/**
 * Fetch a cursor-paginated list endpoint. Returns `{ items, nextCursor }`
 * directly so pages don't have to dig through the `{ data, meta }` envelope.
 */
export async function serverFetchList<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<ListResult<T>> {
  const jar = await cookies()
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value

  const headers = new Headers(options.headers)
  if (token) headers.set('Cookie', `${ADMIN_SESSION_COOKIE}=${token}`)

  const { body: rawBody, ...rest } = options
  const init: RequestInit = {
    ...rest,
    headers,
    cache: 'no-store',
  }
  if (rawBody !== undefined) {
    init.body = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody)
  }

  const res = await fetch(`${API_INTERNAL_URL}${path}`, init)
  if (!res.ok) {
    const body = (await res.json().catch(() => undefined)) as
      | ApiError
      | undefined
    throw new ApiRequestError(
      res.status,
      body?.error.detail ?? res.statusText,
      body,
    )
  }

  const json = (await res.json()) as {
    success: true
    data: T[]
    meta: ListMeta
  }
  return { items: json.data, nextCursor: json.meta.next_cursor }
}
