// Integration tests for session-authed KYC approve/reject
// (E4.1, T16). Covers auth gating, role gating, validation, and the
// audit-admin-id resolution that lets legacy secret callers keep
// working until T23.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('../lib/supabase.js', () => ({
  supabase: { from: vi.fn() },
}))

vi.mock('../lib/firebase.js', () => ({
  firebaseAuth: {
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
  },
}))

vi.mock('../services/kyc.service.js', () => ({
  approveKyc: vi.fn(),
  rejectKyc: vi.fn(),
}))

import adminRoutes from '../routes/admin.routes.js'
import { errorHandler } from '../middleware/errorHandler.js'
import { supabase } from '../lib/supabase.js'
import { approveKyc, rejectKyc } from '../services/kyc.service.js'
import {
  signAdminSession,
  ADMIN_SESSION_COOKIE,
} from '../utils/admin-session.js'

type AdminRow = {
  id: string
  email: string
  firebase_uid: string
  full_name: string
  role: 'support' | 'operations' | 'super_admin' | 'content_moderator' | 'finance'
  is_active: boolean
  must_change_password: boolean
  failed_login_count: number
  locked_until: null
  created_at: string
  last_login_at: null
  password_changed_at: null
}

const SUPPORT: AdminRow = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'support@creatorhub.in',
  firebase_uid: 'fb-support',
  full_name: 'Support Admin',
  role: 'support',
  is_active: true,
  must_change_password: false,
  failed_login_count: 0,
  locked_until: null,
  created_at: '2026-01-01T00:00:00Z',
  last_login_at: null,
  password_changed_at: null,
}
const OPERATIONS: AdminRow = {
  ...SUPPORT,
  id: '22222222-2222-2222-2222-222222222222',
  role: 'operations',
  email: 'ops@creatorhub.in',
}
const USER_ID = '99999999-9999-9999-9999-999999999999'

function adminChain(row: AdminRow) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
  }
}

function buildApp(): Hono {
  const app = new Hono()
  app.route('/api/v1/admin', adminRoutes)
  app.onError(errorHandler)
  return app
}

async function cookieFor(row: AdminRow): Promise<string> {
  const token = await signAdminSession({
    adminId: row.id,
    role: row.role,
    email: row.email,
    mustChangePassword: false,
  })
  return `${ADMIN_SESSION_COOKIE}=${token}`
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /admin/kyc/:userId/approve', () => {
  it('401 without a session', async () => {
    const app = buildApp()
    const res = await app.request(`/api/v1/admin/kyc/${USER_ID}/approve`, {
      method: 'POST',
    })
    expect(res.status).toBe(401)
  })

  it('403 when role is not in KYC allowlist', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(adminChain(OPERATIONS) as never)
    const app = buildApp()
    const res = await app.request(`/api/v1/admin/kyc/${USER_ID}/approve`, {
      method: 'POST',
      headers: { Cookie: await cookieFor(OPERATIONS) },
    })
    expect(res.status).toBe(403)
    expect(vi.mocked(approveKyc)).not.toHaveBeenCalled()
  })

  it('approves with acting admin id from session cookie', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(adminChain(SUPPORT) as never)
    vi.mocked(approveKyc).mockResolvedValueOnce()

    const app = buildApp()
    const res = await app.request(`/api/v1/admin/kyc/${USER_ID}/approve`, {
      method: 'POST',
      headers: { Cookie: await cookieFor(SUPPORT) },
    })

    expect(res.status).toBe(200)
    expect(vi.mocked(approveKyc)).toHaveBeenCalledWith(USER_ID, SUPPORT.id)
  })

  it('tolerates empty body (no admin_id needed when session is present)', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(adminChain(SUPPORT) as never)
    vi.mocked(approveKyc).mockResolvedValueOnce()

    const app = buildApp()
    const res = await app.request(`/api/v1/admin/kyc/${USER_ID}/approve`, {
      method: 'POST',
      headers: {
        Cookie: await cookieFor(SUPPORT),
        'Content-Type': 'application/json',
      },
      body: '',
    })

    expect(res.status).toBe(200)
  })
})

describe('POST /admin/kyc/:userId/reject', () => {
  it('rejects without a session', async () => {
    const app = buildApp()
    const res = await app.request(`/api/v1/admin/kyc/${USER_ID}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'a bad one is needed long enough' }),
    })
    expect(res.status).toBe(401)
  })

  it('requires reason', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(adminChain(SUPPORT) as never)
    const app = buildApp()
    const res = await app.request(`/api/v1/admin/kyc/${USER_ID}/reject`, {
      method: 'POST',
      headers: {
        Cookie: await cookieFor(SUPPORT),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    expect(vi.mocked(rejectKyc)).not.toHaveBeenCalled()
  })

  it('rejects when reason is shorter than 10 chars', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(adminChain(SUPPORT) as never)
    const app = buildApp()
    const res = await app.request(`/api/v1/admin/kyc/${USER_ID}/reject`, {
      method: 'POST',
      headers: {
        Cookie: await cookieFor(SUPPORT),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'too short' }),
    })
    expect(res.status).toBe(400)
    expect(vi.mocked(rejectKyc)).not.toHaveBeenCalled()
  })

  it('rejects valid payload and forwards acting admin id', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(adminChain(SUPPORT) as never)
    vi.mocked(rejectKyc).mockResolvedValueOnce()

    const app = buildApp()
    const res = await app.request(`/api/v1/admin/kyc/${USER_ID}/reject`, {
      method: 'POST',
      headers: {
        Cookie: await cookieFor(SUPPORT),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: 'blurry selfie, cannot verify match to PAN',
      }),
    })

    expect(res.status).toBe(200)
    expect(vi.mocked(rejectKyc)).toHaveBeenCalledWith(
      USER_ID,
      SUPPORT.id,
      'blurry selfie, cannot verify match to PAN',
    )
  })
})
