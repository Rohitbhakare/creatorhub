// Integration tests for /api/v1/admin/auth/* (E4.1).
//
// These tests drive the full request pipeline: route, validate,
// middleware, handler, service. External boundaries (Firebase
// Identity Toolkit, Supabase, Firebase Admin SDK) are mocked; session
// signing + verification is real so we cover the JWT flow end-to-end.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn() }
  return { supabase: mockSupabase }
})

vi.mock('../lib/firebase-identity-toolkit.js', () => ({
  verifyAdminPassword: vi.fn(),
}))

vi.mock('../lib/firebase.js', () => {
  const mockAuth = {
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
  }
  return { firebaseAuth: mockAuth }
})

import adminAuthRoutes from '../routes/admin-auth.routes.js'
import { errorHandler } from '../middleware/errorHandler.js'
import { resetRateLimitStore } from '../middleware/rateLimit.js'
import { supabase } from '../lib/supabase.js'
import { verifyAdminPassword } from '../lib/firebase-identity-toolkit.js'
import { firebaseAuth } from '../lib/firebase.js'
import { AppError } from '../errors/AppError.js'

const ACTIVE_ADMIN = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'admin@creatorhub.in',
  firebase_uid: 'fb-uid-1',
  full_name: 'Test Admin',
  role: 'super_admin',
  is_active: true,
  must_change_password: false,
  failed_login_count: 0,
  locked_until: null,
  created_at: '2026-01-01T00:00:00Z',
  last_login_at: null,
  password_changed_at: null,
}

/**
 * Flexible Supabase chain mock. Handles both read chains
 * (select → eq/ilike → maybeSingle) and write chains (update → eq).
 */
function mockSupabaseSelect(data: unknown, error: unknown = null): void {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    update: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
  vi.mocked(supabase.from).mockReturnValue(chain as never)
}

function buildApp(): Hono {
  const app = new Hono()
  app.route('/api/v1/admin/auth', adminAuthRoutes)
  app.onError(errorHandler)
  return app
}

function firstCookie(res: Response): string {
  const raw = res.headers.get('set-cookie')
  if (raw === null) throw new Error('expected set-cookie header on response')
  const pair = raw.split(';')[0]
  if (pair === undefined) throw new Error('malformed set-cookie header')
  return pair
}

beforeEach(() => {
  vi.clearAllMocks()
  resetRateLimitStore()
})

describe('POST /api/v1/admin/auth/login', () => {
  it('returns 400 when body is missing email', async () => {
    mockSupabaseSelect(null)
    const app = buildApp()
    const res = await app.request('/api/v1/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'x' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 401 generic invalid-credentials for unknown email', async () => {
    mockSupabaseSelect(null)
    vi.mocked(verifyAdminPassword).mockRejectedValueOnce(
      new AppError('invalid-credentials', 401, 'Invalid email or password'),
    )

    const app = buildApp()
    const res = await app.request('/api/v1/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ghost@creatorhub.in', password: 'whatever' }),
    })

    expect(res.status).toBe(401)
    const body = (await res.json()) as { error: { type: string } }
    expect(body.error.type).toContain('invalid-credentials')
  })

  it('returns 423 when account is locked, before contacting Firebase', async () => {
    const lockedRow = {
      ...ACTIVE_ADMIN,
      locked_until: new Date(Date.now() + 60_000).toISOString(),
    }
    mockSupabaseSelect(lockedRow)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ACTIVE_ADMIN.email, password: 'secret' }),
    })

    expect(res.status).toBe(423)
    expect(verifyAdminPassword).not.toHaveBeenCalled()
  })

  it('returns 200 + sets ch_admin_session cookie on success', async () => {
    mockSupabaseSelect(ACTIVE_ADMIN)
    vi.mocked(verifyAdminPassword).mockResolvedValueOnce({
      uid: ACTIVE_ADMIN.firebase_uid,
      email: ACTIVE_ADMIN.email,
    })

    const app = buildApp()
    const res = await app.request('/api/v1/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ACTIVE_ADMIN.email, password: 'correct' }),
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      success: boolean
      data: { admin: { role: string }; must_change_password: boolean }
    }
    expect(body.success).toBe(true)
    expect(body.data.admin.role).toBe('super_admin')
    expect(body.data.must_change_password).toBe(false)

    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('ch_admin_session=')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('SameSite=Strict')
  })

  it('returns 403 when password is correct but account is inactive', async () => {
    const inactive = { ...ACTIVE_ADMIN, is_active: false }
    mockSupabaseSelect(inactive)
    vi.mocked(verifyAdminPassword).mockResolvedValueOnce({
      uid: inactive.firebase_uid,
      email: inactive.email,
    })

    const app = buildApp()
    const res = await app.request('/api/v1/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inactive.email, password: 'correct' }),
    })

    expect(res.status).toBe(403)
    const body = (await res.json()) as { error: { type: string } }
    expect(body.error.type).toContain('admin-forbidden')
  })
})

describe('GET /api/v1/admin/auth/me', () => {
  it('returns 401 without session cookie', async () => {
    mockSupabaseSelect(null)
    const app = buildApp()
    const res = await app.request('/api/v1/admin/auth/me')
    expect(res.status).toBe(401)
  })

  it('returns profile when cookie is valid', async () => {
    mockSupabaseSelect(ACTIVE_ADMIN)
    vi.mocked(verifyAdminPassword).mockResolvedValueOnce({
      uid: ACTIVE_ADMIN.firebase_uid,
      email: ACTIVE_ADMIN.email,
    })

    const app = buildApp()
    const loginRes = await app.request('/api/v1/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ACTIVE_ADMIN.email, password: 'correct' }),
    })
    const cookieHeader = firstCookie(loginRes)

    const res = await app.request('/api/v1/admin/auth/me', {
      headers: { Cookie: cookieHeader },
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      success: boolean
      data: { id: string; role: string }
    }
    expect(body.data.id).toBe(ACTIVE_ADMIN.id)
    expect(body.data.role).toBe('super_admin')
  })

  it('returns 403 when the admin was deactivated mid-session', async () => {
    mockSupabaseSelect(ACTIVE_ADMIN)
    vi.mocked(verifyAdminPassword).mockResolvedValueOnce({
      uid: ACTIVE_ADMIN.firebase_uid,
      email: ACTIVE_ADMIN.email,
    })

    const app = buildApp()
    const loginRes = await app.request('/api/v1/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ACTIVE_ADMIN.email, password: 'correct' }),
    })
    const cookieHeader = firstCookie(loginRes)

    mockSupabaseSelect({ ...ACTIVE_ADMIN, is_active: false })

    const res = await app.request('/api/v1/admin/auth/me', {
      headers: { Cookie: cookieHeader },
    })
    expect(res.status).toBe(403)
  })
})

describe('POST /api/v1/admin/auth/logout', () => {
  it('returns 204 with no cookie', async () => {
    mockSupabaseSelect(null)
    const app = buildApp()
    const res = await app.request('/api/v1/admin/auth/logout', { method: 'POST' })
    expect(res.status).toBe(204)
  })

  it('returns 204 even with garbage cookie', async () => {
    mockSupabaseSelect(null)
    const app = buildApp()
    const res = await app.request('/api/v1/admin/auth/logout', {
      method: 'POST',
      headers: { Cookie: 'ch_admin_session=not-a-real-jwt' },
    })
    expect(res.status).toBe(204)
  })
})

describe('POST /api/v1/admin/auth/change-password', () => {
  async function loginAs(
    app: Hono,
    adminRow: typeof ACTIVE_ADMIN,
  ): Promise<string> {
    mockSupabaseSelect(adminRow)
    vi.mocked(verifyAdminPassword).mockResolvedValueOnce({
      uid: adminRow.firebase_uid,
      email: adminRow.email,
    })
    const loginRes = await app.request('/api/v1/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminRow.email, password: 'correct' }),
    })
    return firstCookie(loginRes)
  }

  it('rejects weak passwords at validation', async () => {
    const app = buildApp()
    const cookieHeader = await loginAs(app, ACTIVE_ADMIN)

    const res = await app.request('/api/v1/admin/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({
        current_password: 'correct',
        new_password: 'short',
      }),
    })
    expect(res.status).toBe(400)
  })

  it('rotates password and re-signs cookie on success', async () => {
    const adminRow = { ...ACTIVE_ADMIN, must_change_password: true }
    const app = buildApp()
    const cookieHeader = await loginAs(app, adminRow)

    vi.mocked(verifyAdminPassword).mockResolvedValueOnce({
      uid: adminRow.firebase_uid,
      email: adminRow.email,
    })
    vi.mocked(firebaseAuth.updateUser).mockResolvedValueOnce({} as never)
    mockSupabaseSelect(adminRow)

    const res = await app.request('/api/v1/admin/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({
        current_password: 'correct',
        new_password: 'NewPassw0rd!',
      }),
    })

    expect(res.status).toBe(204)
    expect(vi.mocked(firebaseAuth.updateUser)).toHaveBeenCalledWith(
      adminRow.firebase_uid,
      expect.objectContaining({ password: 'NewPassw0rd!' }),
    )
    expect(res.headers.get('set-cookie')).toContain('ch_admin_session=')
  })
})
