import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// Mock the token utilities before importing middleware
vi.mock('../utils/tokens.js', () => ({
  verifyAccessToken: vi.fn(),
}))

// Mock supabase (used by requireCreator / requireKYC)
vi.mock('../lib/supabase.js', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { authenticate, optionalAuthenticate, requireCreator, requireKYC } from './authenticate.js'
import { verifyAccessToken } from '../utils/tokens.js'
import { supabase } from '../lib/supabase.js'
import { errorHandler } from './errorHandler.js'

// Hono Variables type — mirrors what authenticate.ts sets on context
type Vars = { userId: string | null }

// Helpers — every test app needs errorHandler so AppError→correct HTTP status
function buildApp(middleware: Parameters<Hono<{ Variables: Vars }>['use']>[1]) {
  const app = new Hono<{ Variables: Vars }>()
  app.use('*', middleware)
  app.get('/', (c) => c.json({ userId: c.get('userId') }))
  app.onError(errorHandler)
  return app
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` }
}

// ─── authenticate ─────────────────────────────────────────────

describe('authenticate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sets userId on context when token is valid', async () => {
    vi.mocked(verifyAccessToken).mockResolvedValueOnce({
      sub: 'user-123',
      type: 'access',
      iss: 'creatorhub',
      iat: 0,
      exp: 9999999999,
    })

    const app = buildApp(authenticate)
    const res = await app.request('/', { headers: authHeader('valid.token.here') })

    expect(res.status).toBe(200)
    const body = await res.json() as { userId: string }
    expect(body.userId).toBe('user-123')
  })

  it('returns 401 when Authorization header is missing', async () => {
    const app = buildApp(authenticate)
    const res = await app.request('/')

    expect(res.status).toBe(401)
    const body = await res.json() as { error: { type: string } }
    expect(body.error.type).toContain('unauthorized')
  })

  it('returns 401 when Authorization header has wrong format (no Bearer prefix)', async () => {
    const app = buildApp(authenticate)
    const res = await app.request('/', { headers: { Authorization: 'Token abc123' } })

    expect(res.status).toBe(401)
  })

  it('returns 401 when token is expired', async () => {
    vi.mocked(verifyAccessToken).mockRejectedValueOnce(new Error('token has expired (exp)'))

    const app = buildApp(authenticate)
    const res = await app.request('/', { headers: authHeader('expired.token') })

    expect(res.status).toBe(401)
    const body = await res.json() as { error: { type: string } }
    expect(body.error.type).toContain('token-expired')
  })

  it('returns 401 when token is malformed', async () => {
    vi.mocked(verifyAccessToken).mockRejectedValueOnce(new Error('invalid signature'))

    const app = buildApp(authenticate)
    const res = await app.request('/', { headers: authHeader('malformed.token') })

    expect(res.status).toBe(401)
    const body = await res.json() as { error: { type: string } }
    expect(body.error.type).toContain('invalid-token')
  })
})

// ─── optionalAuthenticate ─────────────────────────────────────

describe('optionalAuthenticate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sets userId when valid token is provided', async () => {
    vi.mocked(verifyAccessToken).mockResolvedValueOnce({
      sub: 'user-123',
      type: 'access',
      iss: 'creatorhub',
      iat: 0,
      exp: 9999999999,
    })

    const app = buildApp(optionalAuthenticate)
    const res = await app.request('/', { headers: authHeader('valid.token') })

    expect(res.status).toBe(200)
    const body = await res.json() as { userId: string }
    expect(body.userId).toBe('user-123')
  })

  it('sets userId to null when no token provided (guest access)', async () => {
    const app = buildApp(optionalAuthenticate)
    const res = await app.request('/')

    expect(res.status).toBe(200)
    const body = await res.json() as { userId: null }
    expect(body.userId).toBeNull()
  })

  it('sets userId to null and continues when token is invalid (no 401)', async () => {
    vi.mocked(verifyAccessToken).mockRejectedValueOnce(new Error('invalid token'))

    const app = buildApp(optionalAuthenticate)
    const res = await app.request('/', { headers: authHeader('bad.token') })

    // Must NOT return 401 — guest access always continues
    expect(res.status).toBe(200)
    const body = await res.json() as { userId: null }
    expect(body.userId).toBeNull()
  })
})

// ─── requireCreator ───────────────────────────────────────────

describe('requireCreator', () => {
  function buildCreatorApp() {
    const app = new Hono<{ Variables: Vars }>()
    // Simulate authenticate already ran by setting userId manually
    app.use('*', async (c, next) => {
      c.set('userId', 'user-123')
      await next()
    })
    app.use('*', requireCreator)
    app.get('/', (c) => c.json({ ok: true }))
    app.onError(errorHandler)
    return app
  }

  function mockUserQuery(isCreator: boolean | null) {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: isCreator !== null ? { is_creator: isCreator } : null,
        error: null,
      }),
    }
    vi.mocked(supabase.from).mockReturnValue(chain as never)
  }

  beforeEach(() => vi.clearAllMocks())

  it('passes when user is a creator', async () => {
    mockUserQuery(true)
    const app = buildCreatorApp()
    const res = await app.request('/')
    expect(res.status).toBe(200)
  })

  it('returns 403 when user is not a creator', async () => {
    mockUserQuery(false)
    const app = buildCreatorApp()
    const res = await app.request('/')
    expect(res.status).toBe(403)
    const body = await res.json() as { error: { type: string } }
    expect(body.error.type).toContain('forbidden')
  })

  it('returns 403 when user record has no is_creator field', async () => {
    mockUserQuery(null)
    const app = buildCreatorApp()
    const res = await app.request('/')
    expect(res.status).toBe(403)
  })
})

// ─── requireKYC ───────────────────────────────────────────────

describe('requireKYC', () => {
  function buildKYCApp() {
    const app = new Hono<{ Variables: Vars }>()
    app.use('*', async (c, next) => {
      c.set('userId', 'user-123')
      await next()
    })
    app.use('*', requireKYC)
    app.get('/', (c) => c.json({ ok: true }))
    app.onError(errorHandler)
    return app
  }

  function mockKYCQuery(kycStatus: string | null) {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: kycStatus !== null ? { kyc_status: kycStatus } : null,
        error: null,
      }),
    }
    vi.mocked(supabase.from).mockReturnValue(chain as never)
  }

  beforeEach(() => vi.clearAllMocks())

  it('passes when user kyc_status is verified', async () => {
    mockKYCQuery('verified')
    const app = buildKYCApp()
    const res = await app.request('/')
    expect(res.status).toBe(200)
  })

  it('returns 403 when kyc_status is pending', async () => {
    mockKYCQuery('pending')
    const app = buildKYCApp()
    const res = await app.request('/')
    expect(res.status).toBe(403)
    const body = await res.json() as { error: { type: string } }
    expect(body.error.type).toContain('forbidden')
  })

  it('returns 403 when kyc_status is null (never submitted)', async () => {
    mockKYCQuery(null)
    const app = buildKYCApp()
    const res = await app.request('/')
    expect(res.status).toBe(403)
  })

  it('returns 403 when kyc_status is rejected', async () => {
    mockKYCQuery('rejected')
    const app = buildKYCApp()
    const res = await app.request('/')
    expect(res.status).toBe(403)
  })
})
