import { describe, it, expect, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from './middleware'
import { CSRF_COOKIE } from './lib/csrf'

/**
 * Edge-runtime middleware integration tests. Covers:
 *   - CSRF Origin check rejecting cross-origin POST
 *   - CSRF allowing same-origin POST
 *   - CSRF cookie minted on first response when missing
 *   - Safe verbs short-circuited (no Origin check)
 *   - Auth gate redirects to /signin for protected routes
 *   - Theme cookie default minted on first visit
 *
 * `NextRequest` is a real Next.js edge primitive — no mocking required;
 * pass headers + cookies as part of the constructor's RequestInit.
 */

const ORIGIN = 'http://localhost:3004'

function makeRequest(
  url: string,
  init: { method?: string; origin?: string | null; cookies?: Record<string, string> } = {},
): NextRequest {
  const headers = new Headers()
  if (init.origin) headers.set('origin', init.origin)
  const cookieHeader = init.cookies
    ? Object.entries(init.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ')
    : null
  if (cookieHeader) headers.set('cookie', cookieHeader)

  return new NextRequest(`${ORIGIN}${url}`, {
    method: init.method ?? 'GET',
    headers,
  })
}

describe('middleware / CSRF', () => {
  it('rejects a POST from a foreign origin with 403', () => {
    const req = makeRequest('/discover', { method: 'POST', origin: 'https://attacker.com' })
    const res = middleware(req)
    expect(res.status).toBe(403)
  })

  it('allows a POST when Origin matches the deployment', () => {
    const req = makeRequest('/discover', { method: 'POST', origin: ORIGIN })
    const res = middleware(req)
    // Same-origin: middleware lets it pass through (NextResponse.next, status 200).
    // The auth gate may still redirect /discover protected routes, but /discover
    // is a public route so it should proceed.
    expect(res.status).not.toBe(403)
  })

  it('allows a POST with no Origin header (non-browser tool)', () => {
    const req = makeRequest('/discover', { method: 'POST' })
    const res = middleware(req)
    expect(res.status).not.toBe(403)
  })

  it('does not run the CSRF check on safe verbs', () => {
    // GET with attacker origin should still be allowed
    const req = makeRequest('/discover', { method: 'GET', origin: 'https://attacker.com' })
    const res = middleware(req)
    expect(res.status).not.toBe(403)
  })

  it('mints a ch_csrf cookie on first response when missing', () => {
    const req = makeRequest('/', { method: 'GET' })
    const res = middleware(req)
    const setCookie = res.cookies.get(CSRF_COOKIE)
    expect(setCookie).toBeDefined()
    expect(setCookie?.value).toMatch(/^[0-9a-f]{64}$/)
  })

  it('does not re-mint the ch_csrf cookie when one already exists', () => {
    const req = makeRequest('/', {
      method: 'GET',
      cookies: { [CSRF_COOKIE]: 'a'.repeat(64) },
    })
    const res = middleware(req)
    const setCookie = res.cookies.get(CSRF_COOKIE)
    // No Set-Cookie for ch_csrf when the request already carried one.
    expect(setCookie).toBeUndefined()
  })
})

describe('middleware / auth gate', () => {
  it('redirects unauthed users away from protected routes', () => {
    const req = makeRequest('/saved', { method: 'GET' })
    const res = middleware(req)
    expect(res.status).toBe(307) // Next.js default redirect status
    expect(res.headers.get('location')).toContain('/signin')
    expect(res.headers.get('location')).toContain('next=%2Fsaved')
  })

  it('lets authed users through to protected routes', () => {
    const req = makeRequest('/saved', {
      method: 'GET',
      cookies: { ch_session: 'fake-but-truthy' },
    })
    const res = middleware(req)
    expect(res.status).not.toBe(307)
  })

  it('redirects authed users away from /signin to /feed', () => {
    const req = makeRequest('/signin', {
      method: 'GET',
      cookies: { ch_session: 'fake-but-truthy' },
    })
    const res = middleware(req)
    expect(res.headers.get('location')).toContain('/feed')
  })

  it('CSRF check runs before auth-gate redirect', () => {
    // POST to a protected route with a foreign Origin — must 403, not 307.
    const req = makeRequest('/saved', { method: 'POST', origin: 'https://attacker.com' })
    const res = middleware(req)
    expect(res.status).toBe(403)
  })
})

describe('middleware / theme cookie', () => {
  beforeEach(() => {
    // No setup needed — each request constructs a fresh NextRequest.
  })

  it('mints ch_theme=paper on first visit', () => {
    const req = makeRequest('/', { method: 'GET' })
    const res = middleware(req)
    const theme = res.cookies.get('ch_theme')
    expect(theme?.value).toBe('paper')
  })

  it('does not re-mint when already set', () => {
    const req = makeRequest('/', { method: 'GET', cookies: { ch_theme: 'snow' } })
    const res = middleware(req)
    expect(res.cookies.get('ch_theme')).toBeUndefined()
  })
})

describe('middleware / legacy creator URLs', () => {
  it('301-redirects /travel/<u> to /u/<u>', () => {
    const req = makeRequest('/travel/saanvi')
    const res = middleware(req)
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toContain('/u/saanvi')
  })

  it('301-redirects /stories/<u> to /u/<u>', () => {
    const req = makeRequest('/stories/saanvi')
    const res = middleware(req)
    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toContain('/u/saanvi')
  })
})
