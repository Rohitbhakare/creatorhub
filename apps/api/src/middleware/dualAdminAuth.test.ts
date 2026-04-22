// Dual-auth middleware tests (E4.1, T5).
//
// Covers the two auth paths:
//   1. Legacy: `x-admin-secret` header matches env.ADMIN_SECRET → pass
//   2. Session: no/invalid secret → delegate to requireAdminRole
//
// External boundaries mocked: supabase (for the session-path admin
// row lookup). Session token signing + verification is real.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn() }
  return { supabase: mockSupabase }
})

vi.mock('../lib/firebase.js', () => ({
  firebaseAuth: {
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
  },
}))

import { dualAdminAuth } from './dualAdminAuth.js'
import { errorHandler } from './errorHandler.js'
import { supabase } from '../lib/supabase.js'
import { signAdminSession, ADMIN_SESSION_COOKIE } from '../utils/admin-session.js'

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

function mockSupabaseSelect(data: unknown, error: unknown = null): void {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  }
  vi.mocked(supabase.from).mockReturnValue(chain as never)
}

function buildApp(allowedRoles: string[] = ['super_admin']): Hono {
  const app = new Hono()
  // Match the production route pattern: middleware → handler.
  app.get(
    '/protected',
    dualAdminAuth(allowedRoles as never),
    (c) => {
      const mode = (c.get('adminAuthMode' as never) as string | undefined) ?? 'session'
      return c.json({ success: true, authMode: mode })
    },
  )
  app.onError(errorHandler)
  return app
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('dualAdminAuth', () => {
  it('passes legacy x-admin-secret header without DB lookup', async () => {
    const app = buildApp()

    const res = await app.request('/protected', {
      headers: { 'x-admin-secret': 'test-admin-legacy-secret-16chars' },
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as { success: boolean; authMode: string }
    expect(body.authMode).toBe('legacy-secret')
    // Legacy path MUST NOT hit the DB.
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('falls through to session middleware when secret is wrong', async () => {
    mockSupabaseSelect(null)
    const app = buildApp()

    // Wrong secret + no cookie → should get a 401 from session path,
    // not a 403 from secret rejection. That's the important behavioral
    // contract: secret mismatch must not short-circuit with 403.
    const res = await app.request('/protected', {
      headers: { 'x-admin-secret': 'wrong-secret' },
    })

    expect(res.status).toBe(401)
  })

  it('falls through to session middleware when secret is absent', async () => {
    mockSupabaseSelect(null)
    const app = buildApp()

    const res = await app.request('/protected')
    expect(res.status).toBe(401)
  })

  it('accepts a valid session cookie for a role in the allow list', async () => {
    mockSupabaseSelect(ACTIVE_ADMIN)
    const token = await signAdminSession({
      adminId: ACTIVE_ADMIN.id,
      role: 'super_admin',
      email: ACTIVE_ADMIN.email,
      mustChangePassword: false,
    })

    const app = buildApp(['super_admin'])
    const res = await app.request('/protected', {
      headers: { Cookie: `${ADMIN_SESSION_COOKIE}=${token}` },
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as { success: boolean; authMode: string }
    expect(body.authMode).toBe('session')
  })

  it('rejects 403 when session role is outside the allow list', async () => {
    mockSupabaseSelect({ ...ACTIVE_ADMIN, role: 'support' })
    const token = await signAdminSession({
      adminId: ACTIVE_ADMIN.id,
      role: 'support',
      email: ACTIVE_ADMIN.email,
      mustChangePassword: false,
    })

    // Allow list does NOT include 'support'.
    const app = buildApp(['super_admin', 'finance'])
    const res = await app.request('/protected', {
      headers: { Cookie: `${ADMIN_SESSION_COOKIE}=${token}` },
    })

    expect(res.status).toBe(403)
  })

  it('rejects 403 when admin row is deactivated mid-session', async () => {
    mockSupabaseSelect({ ...ACTIVE_ADMIN, is_active: false })
    const token = await signAdminSession({
      adminId: ACTIVE_ADMIN.id,
      role: 'super_admin',
      email: ACTIVE_ADMIN.email,
      mustChangePassword: false,
    })

    const app = buildApp(['super_admin'])
    const res = await app.request('/protected', {
      headers: { Cookie: `${ADMIN_SESSION_COOKIE}=${token}` },
    })

    expect(res.status).toBe(403)
  })
})
