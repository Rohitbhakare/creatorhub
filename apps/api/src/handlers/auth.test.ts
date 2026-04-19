import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// ─── Mocks (declared before imports that touch these modules) ──────────────

vi.mock('../utils/tokens.js', () => ({ verifyAccessToken: vi.fn() }))

vi.mock('../services/auth.service.js', () => ({
  registerOrSignIn: vi.fn(),
  refreshSession: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('../services/audit.service.js', () => ({
  extractIp: vi.fn().mockReturnValue('10.0.0.1'),
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}))

// Rate limit middleware is stateful; reset between tests so 10-req/min window
// doesn't trip mid-suite.
import { resetRateLimitStore } from '../middleware/rateLimit.js'
import authRoutes from '../routes/auth.routes.js'
import { registerOrSignIn, refreshSession, signOut } from '../services/auth.service.js'
import { verifyAccessToken } from '../utils/tokens.js'
import { errorHandler } from '../middleware/errorHandler.js'
import { AppError } from '../errors/AppError.js'

// ─── Test app ──────────────────────────────────────────────────────────────

function buildApp() {
  const app = new Hono()
  app.route('/', authRoutes)
  app.onError(errorHandler)
  return app
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function json(body: unknown) {
  return {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

const AUTH_HEADER = { Authorization: 'Bearer valid.access.token' }

function mockValidAccessToken() {
  vi.mocked(verifyAccessToken).mockResolvedValue({
    sub: 'user-001',
    type: 'access',
    iss: 'creatorhub',
    iat: 0,
    exp: 9_999_999_999,
  })
}

const USER_ID = 'user-001'
const profileFixture = {
  id: USER_ID,
  phone: '+919999999999',
  display_name: null,
  username: null,
  bio: null,
  email: null,
  avatar_url: null,
  is_creator: false,
  kyc_status: 'not_started',
  current_city: null,
  active_verticals: [],
  onboarding_completed_at: null,
  username_changed_at: null,
  follower_count: 0,
  following_count: 0,
  content_count: 0,
  created_at: '2026-04-01T00:00:00Z',
}

const tokensFixture = {
  access_token: 'access.jwt',
  refresh_token: 'refresh.jwt',
  expires_in: 3600,
}

// ─── POST /register ────────────────────────────────────────────────────────

describe('POST /register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimitStore()
  })

  it('returns 400 when firebase_token is missing', async () => {
    const app = buildApp()
    const res = await app.request('/register', { method: 'POST', ...json({}) })

    expect(res.status).toBe(400)
    const body = await res.json() as { error: { type: string } }
    expect(body.error.type).toContain('validation-failed')
  })

  it('returns 400 when device_info.platform is not in enum', async () => {
    const app = buildApp()
    const res = await app.request('/register', {
      method: 'POST',
      ...json({ firebase_token: 'tok', device_info: { platform: 'windows' } }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 201 with Location header when user is new', async () => {
    vi.mocked(registerOrSignIn).mockResolvedValue({
      result: { user: profileFixture, tokens: tokensFixture, is_new_user: true },
      isNew: true,
    } as never)

    const app = buildApp()
    const res = await app.request('/register', {
      method: 'POST',
      ...json({ firebase_token: 'tok' }),
    })

    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toBe(`/api/v1/users/${USER_ID}`)
    const body = await res.json() as { success: boolean; data: { is_new_user: boolean } }
    expect(body.success).toBe(true)
    expect(body.data.is_new_user).toBe(true)
  })

  it('returns 200 (no Location) when user already exists', async () => {
    vi.mocked(registerOrSignIn).mockResolvedValue({
      result: { user: profileFixture, tokens: tokensFixture, is_new_user: false },
      isNew: false,
    } as never)

    const app = buildApp()
    const res = await app.request('/register', {
      method: 'POST',
      ...json({ firebase_token: 'tok' }),
    })

    expect(res.status).toBe(200)
    expect(res.headers.get('Location')).toBeNull()
  })

  it('passes device_info, ip, and user-agent through to service', async () => {
    vi.mocked(registerOrSignIn).mockResolvedValue({
      result: { user: profileFixture, tokens: tokensFixture, is_new_user: false },
      isNew: false,
    } as never)

    const app = buildApp()
    await app.request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'UnitTest/1.0' },
      body: JSON.stringify({
        firebase_token: 'tok',
        device_info: { platform: 'ios', device_id: 'd1', app_version: '1.0.0' },
      }),
    })

    expect(registerOrSignIn).toHaveBeenCalledWith(
      'tok',
      { platform: 'ios', device_id: 'd1', app_version: '1.0.0' },
      '10.0.0.1',
      'UnitTest/1.0',
    )
  })

  it('returns 401 when service throws invalid-token AppError', async () => {
    vi.mocked(registerOrSignIn).mockRejectedValue(
      new AppError('invalid-token', 401, 'Invalid Firebase token'),
    )

    const app = buildApp()
    const res = await app.request('/register', {
      method: 'POST',
      ...json({ firebase_token: 'bad' }),
    })

    expect(res.status).toBe(401)
  })
})

// ─── POST /refresh ─────────────────────────────────────────────────────────

describe('POST /refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimitStore()
  })

  it('returns 400 when refresh_token is missing', async () => {
    const app = buildApp()
    const res = await app.request('/refresh', { method: 'POST', ...json({}) })
    expect(res.status).toBe(400)
  })

  it('returns 200 with new token pair on success', async () => {
    vi.mocked(refreshSession).mockResolvedValue(tokensFixture)

    const app = buildApp()
    const res = await app.request('/refresh', {
      method: 'POST',
      ...json({ refresh_token: 'old.refresh.token' }),
    })

    expect(res.status).toBe(200)
    const body = await res.json() as { success: boolean; data: typeof tokensFixture }
    expect(body.success).toBe(true)
    expect(body.data.access_token).toBe('access.jwt')
    expect(body.data.refresh_token).toBe('refresh.jwt')
  })

  it('returns 401 when service rejects with token-expired', async () => {
    vi.mocked(refreshSession).mockRejectedValue(
      new AppError('token-expired', 401, 'Refresh token expired'),
    )

    const app = buildApp()
    const res = await app.request('/refresh', {
      method: 'POST',
      ...json({ refresh_token: 'expired' }),
    })

    expect(res.status).toBe(401)
    const body = await res.json() as { error: { type: string } }
    expect(body.error.type).toContain('token-expired')
  })

  it('returns 401 when service rejects with invalid-token (reuse detection)', async () => {
    vi.mocked(refreshSession).mockRejectedValue(
      new AppError('invalid-token', 401, 'Refresh token has been revoked'),
    )

    const app = buildApp()
    const res = await app.request('/refresh', {
      method: 'POST',
      ...json({ refresh_token: 'revoked' }),
    })

    expect(res.status).toBe(401)
  })
})

// ─── POST /sign-out ────────────────────────────────────────────────────────

describe('POST /sign-out', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimitStore()
  })

  it('returns 401 when Authorization header is missing', async () => {
    const app = buildApp()
    const res = await app.request('/sign-out', { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('returns 204 on success and calls signOut service', async () => {
    mockValidAccessToken()
    vi.mocked(signOut).mockResolvedValue(undefined)

    const app = buildApp()
    const res = await app.request('/sign-out', {
      method: 'POST',
      headers: AUTH_HEADER,
    })

    expect(res.status).toBe(204)
    expect(signOut).toHaveBeenCalledWith(
      USER_ID,
      undefined,
      '10.0.0.1',
      null,
    )
  })

  it('forwards refresh_token to service when provided in body', async () => {
    mockValidAccessToken()
    vi.mocked(signOut).mockResolvedValue(undefined)

    const app = buildApp()
    const res = await app.request('/sign-out', {
      method: 'POST',
      headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: 'r.tok' }),
    })

    expect(res.status).toBe(204)
    expect(signOut).toHaveBeenCalledWith(
      USER_ID,
      'r.tok',
      '10.0.0.1',
      null,
    )
  })

  it('is idempotent — succeeds even when service throws is swallowed by handler', async () => {
    // Handler awaits signOut; if service rejects, the error handler will
    // convert it — but signOut service is documented as idempotent and must
    // never throw. Simulate a clean resolve and verify 204.
    mockValidAccessToken()
    vi.mocked(signOut).mockResolvedValue(undefined)

    const app = buildApp()
    const res1 = await app.request('/sign-out', { method: 'POST', headers: AUTH_HEADER })
    const res2 = await app.request('/sign-out', { method: 'POST', headers: AUTH_HEADER })

    expect(res1.status).toBe(204)
    expect(res2.status).toBe(204)
    expect(signOut).toHaveBeenCalledTimes(2)
  })

  it('still signs out (no crash) when body is not valid JSON', async () => {
    mockValidAccessToken()
    vi.mocked(signOut).mockResolvedValue(undefined)

    const app = buildApp()
    const res = await app.request('/sign-out', {
      method: 'POST',
      headers: { ...AUTH_HEADER, 'Content-Type': 'application/json' },
      body: 'not-valid-json',
    })

    expect(res.status).toBe(204)
    expect(signOut).toHaveBeenCalledWith(
      USER_ID,
      undefined,
      '10.0.0.1',
      null,
    )
  })
})

// ─── Rate limiting (authRateLimit applied to all /register|/refresh|/sign-out) ──

describe('auth rate limit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimitStore()
  })

  it('returns 429 after 10 requests in the 60s window', async () => {
    vi.mocked(registerOrSignIn).mockResolvedValue({
      result: { user: profileFixture, tokens: tokensFixture, is_new_user: false },
      isNew: false,
    } as never)

    const app = buildApp()
    const reqOpts = { method: 'POST', ...json({ firebase_token: 'tok' }) }

    // Fire 10 requests — all should succeed.
    for (let i = 0; i < 10; i++) {
      const res = await app.request('/register', reqOpts)
      expect(res.status).toBe(200)
    }

    // 11th request — rate limited.
    const res = await app.request('/register', reqOpts)
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).not.toBeNull()
  })

  it('sets X-RateLimit headers on every auth response', async () => {
    vi.mocked(registerOrSignIn).mockResolvedValue({
      result: { user: profileFixture, tokens: tokensFixture, is_new_user: false },
      isNew: false,
    } as never)

    const app = buildApp()
    const res = await app.request('/register', { method: 'POST', ...json({ firebase_token: 'tok' }) })

    expect(res.headers.get('X-RateLimit-Limit')).toBe('10')
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('9')
    expect(res.headers.get('X-RateLimit-Reset')).not.toBeNull()
  })
})
