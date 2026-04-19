import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Hono } from 'hono'

import {
  rateLimit,
  authRateLimit,
  otpRateLimit,
  rsvpRateLimit,
  generalRateLimit,
  resetRateLimitStore,
} from './rateLimit.js'
import { errorHandler } from './errorHandler.js'

type Vars = { userId: string | null }

function buildApp(middleware: Parameters<Hono<{ Variables: Vars }>['use']>[1]) {
  const app = new Hono<{ Variables: Vars }>()
  app.use('*', middleware)
  app.get('/', (c) => c.json({ ok: true }))
  app.onError(errorHandler)
  return app
}

function buildAppAsUser(userId: string, middleware: Parameters<Hono<{ Variables: Vars }>['use']>[1]) {
  const app = new Hono<{ Variables: Vars }>()
  app.use('*', async (c, next) => {
    c.set('userId', userId)
    await next()
  })
  app.use('*', middleware)
  app.get('/', (c) => c.json({ ok: true }))
  app.onError(errorHandler)
  return app
}

beforeEach(() => resetRateLimitStore())

describe('rateLimit factory', () => {
  it('allows requests up to the max and 429s the next one', async () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 3 }, 'test1')
    const app = buildApp(limiter)

    for (let i = 0; i < 3; i++) {
      const res = await app.request('/', { headers: { 'x-forwarded-for': '1.1.1.1' } })
      expect(res.status).toBe(200)
    }

    const res = await app.request('/', { headers: { 'x-forwarded-for': '1.1.1.1' } })
    expect(res.status).toBe(429)
    const body = await res.json() as { error: { type: string } }
    expect(body.error.type).toContain('rate-limited')
  })

  it('sets X-RateLimit-Limit and X-RateLimit-Remaining on every response', async () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 5 }, 'test2')
    const app = buildApp(limiter)

    const first = await app.request('/', { headers: { 'x-forwarded-for': '2.2.2.2' } })
    expect(first.headers.get('X-RateLimit-Limit')).toBe('5')
    expect(first.headers.get('X-RateLimit-Remaining')).toBe('4')

    const second = await app.request('/', { headers: { 'x-forwarded-for': '2.2.2.2' } })
    expect(second.headers.get('X-RateLimit-Remaining')).toBe('3')
  })

  it('sets Retry-After header when rate limited', async () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 1 }, 'test3')
    const app = buildApp(limiter)

    await app.request('/', { headers: { 'x-forwarded-for': '3.3.3.3' } })
    const res = await app.request('/', { headers: { 'x-forwarded-for': '3.3.3.3' } })

    expect(res.status).toBe(429)
    const retryAfter = res.headers.get('Retry-After')
    expect(retryAfter).not.toBeNull()
    expect(Number(retryAfter)).toBeGreaterThan(0)
    expect(Number(retryAfter)).toBeLessThanOrEqual(60)
  })

  it('separates counters by IP address', async () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 2 }, 'test4')
    const app = buildApp(limiter)

    await app.request('/', { headers: { 'x-forwarded-for': '4.4.4.4' } })
    await app.request('/', { headers: { 'x-forwarded-for': '4.4.4.4' } })
    const blocked = await app.request('/', { headers: { 'x-forwarded-for': '4.4.4.4' } })
    expect(blocked.status).toBe(429)

    // Different IP — fresh counter.
    const otherIp = await app.request('/', { headers: { 'x-forwarded-for': '5.5.5.5' } })
    expect(otherIp.status).toBe(200)
  })

  it('separates counters by userId when authenticated', async () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 2 }, 'test5')

    const appA = buildAppAsUser('user-A', limiter)
    const appB = buildAppAsUser('user-B', limiter)

    // Burn user-A's allowance.
    await appA.request('/', { headers: { 'x-forwarded-for': '9.9.9.9' } })
    await appA.request('/', { headers: { 'x-forwarded-for': '9.9.9.9' } })
    const aBlocked = await appA.request('/', { headers: { 'x-forwarded-for': '9.9.9.9' } })
    expect(aBlocked.status).toBe(429)

    // user-B (same IP) still has their own bucket.
    const bOk = await appB.request('/', { headers: { 'x-forwarded-for': '9.9.9.9' } })
    expect(bOk.status).toBe(200)
  })

  it('isolates counters across different prefixes', async () => {
    const limiterA = rateLimit({ windowMs: 60_000, maxRequests: 1 }, 'prefix-A')
    const limiterB = rateLimit({ windowMs: 60_000, maxRequests: 1 }, 'prefix-B')

    const appA = buildApp(limiterA)
    const appB = buildApp(limiterB)

    await appA.request('/', { headers: { 'x-forwarded-for': '7.7.7.7' } })
    const aBlocked = await appA.request('/', { headers: { 'x-forwarded-for': '7.7.7.7' } })
    expect(aBlocked.status).toBe(429)

    // Same IP, different prefix — not blocked.
    const bOk = await appB.request('/', { headers: { 'x-forwarded-for': '7.7.7.7' } })
    expect(bOk.status).toBe(200)
  })

  it('falls back to "unknown" IP when no forwarding header is present', async () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 1 }, 'test6')
    const app = buildApp(limiter)

    await app.request('/')
    const res = await app.request('/')
    // The second call shares the "unknown" bucket → 429.
    expect(res.status).toBe(429)
  })

  it('resets the window once it has expired', async () => {
    vi.useFakeTimers()
    const now = Date.now()
    vi.setSystemTime(now)

    const limiter = rateLimit({ windowMs: 1000, maxRequests: 1 }, 'test7')
    const app = buildApp(limiter)

    const first = await app.request('/', { headers: { 'x-forwarded-for': '8.8.8.8' } })
    expect(first.status).toBe(200)

    const second = await app.request('/', { headers: { 'x-forwarded-for': '8.8.8.8' } })
    expect(second.status).toBe(429)

    // Advance past the window — counter resets on next access.
    vi.setSystemTime(now + 2000)

    const third = await app.request('/', { headers: { 'x-forwarded-for': '8.8.8.8' } })
    expect(third.status).toBe(200)

    vi.useRealTimers()
  })
})

// ─── Pre-configured limiters ───────────────────────────────────────────────

describe('authRateLimit (10 req / 60s)', () => {
  it('429s the 11th request within the window', async () => {
    const app = buildApp(authRateLimit)
    for (let i = 0; i < 10; i++) {
      const res = await app.request('/', { headers: { 'x-forwarded-for': '11.11.11.11' } })
      expect(res.status).toBe(200)
    }
    const res = await app.request('/', { headers: { 'x-forwarded-for': '11.11.11.11' } })
    expect(res.status).toBe(429)
  })
})

describe('otpRateLimit (5 req / 1h)', () => {
  it('429s the 6th request within the hour window', async () => {
    const app = buildApp(otpRateLimit)
    for (let i = 0; i < 5; i++) {
      const res = await app.request('/', { headers: { 'x-forwarded-for': '12.12.12.12' } })
      expect(res.status).toBe(200)
    }
    const res = await app.request('/', { headers: { 'x-forwarded-for': '12.12.12.12' } })
    expect(res.status).toBe(429)
  })
})

describe('rsvpRateLimit (5 req / 60s)', () => {
  it('429s the 6th request within the minute window', async () => {
    const app = buildApp(rsvpRateLimit)
    for (let i = 0; i < 5; i++) {
      const res = await app.request('/', { headers: { 'x-forwarded-for': '13.13.13.13' } })
      expect(res.status).toBe(200)
    }
    const res = await app.request('/', { headers: { 'x-forwarded-for': '13.13.13.13' } })
    expect(res.status).toBe(429)
  })
})

describe('generalRateLimit (100 req / 60s)', () => {
  it('allows 100 requests and blocks the 101st', async () => {
    const app = buildApp(generalRateLimit)
    for (let i = 0; i < 100; i++) {
      const res = await app.request('/', { headers: { 'x-forwarded-for': '14.14.14.14' } })
      expect(res.status).toBe(200)
    }
    const res = await app.request('/', { headers: { 'x-forwarded-for': '14.14.14.14' } })
    expect(res.status).toBe(429)
  })
})
