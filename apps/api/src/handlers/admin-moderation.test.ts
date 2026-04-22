// Integration tests for the T17 moderation admin surface — reports
// list + detail + action, now gated by `dualAdminAuth`.

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

vi.mock('../services/trust.service.js', () => ({
  getPendingReports: vi.fn(),
  getReportDetail: vi.fn(),
  actionReport: vi.fn(),
  giveStrike: vi.fn(),
  getUserStrikes: vi.fn(),
  submitReport: vi.fn(),
  checkToxicity: vi.fn(),
}))

import trustRoutes from '../routes/trust.routes.js'
import { errorHandler } from '../middleware/errorHandler.js'
import { supabase } from '../lib/supabase.js'
import {
  getPendingReports,
  getReportDetail,
  actionReport,
  giveStrike,
  getUserStrikes,
} from '../services/trust.service.js'
import {
  signAdminSession,
  ADMIN_SESSION_COOKIE,
} from '../utils/admin-session.js'

type AdminRow = {
  id: string
  email: string
  firebase_uid: string
  full_name: string
  role:
    | 'support'
    | 'operations'
    | 'super_admin'
    | 'content_moderator'
    | 'finance'
  is_active: boolean
  must_change_password: boolean
  failed_login_count: number
  locked_until: null
  created_at: string
  last_login_at: null
  password_changed_at: null
}

const MODERATOR: AdminRow = {
  id: '33333333-3333-3333-3333-333333333333',
  email: 'mod@creatorhub.in',
  firebase_uid: 'fb-mod',
  full_name: 'Content Moderator',
  role: 'content_moderator',
  is_active: true,
  must_change_password: false,
  failed_login_count: 0,
  locked_until: null,
  created_at: '2026-01-01T00:00:00Z',
  last_login_at: null,
  password_changed_at: null,
}
const SUPPORT: AdminRow = {
  ...MODERATOR,
  id: '11111111-1111-1111-1111-111111111111',
  email: 'support@creatorhub.in',
  role: 'support',
}
const REPORT_ID = '55555555-5555-5555-5555-555555555555'
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
  app.route('/api/v1', trustRoutes)
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

describe('GET /admin/reports', () => {
  it('401 without a session', async () => {
    const app = buildApp()
    const res = await app.request('/api/v1/admin/reports')
    expect(res.status).toBe(401)
  })

  it('403 when role is not in moderation allowlist', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(adminChain(SUPPORT) as never)
    const app = buildApp()
    const res = await app.request('/api/v1/admin/reports', {
      headers: { Cookie: await cookieFor(SUPPORT) },
    })
    expect(res.status).toBe(403)
    expect(vi.mocked(getPendingReports)).not.toHaveBeenCalled()
  })

  it('lists reports for a moderator', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(adminChain(MODERATOR) as never)
    vi.mocked(getPendingReports).mockResolvedValueOnce({
      items: [],
      nextCursor: null,
    })
    const app = buildApp()
    const res = await app.request('/api/v1/admin/reports?limit=10', {
      headers: { Cookie: await cookieFor(MODERATOR) },
    })
    expect(res.status).toBe(200)
    expect(vi.mocked(getPendingReports)).toHaveBeenCalledWith({ limit: 10 })
  })
})

describe('GET /admin/reports/:id', () => {
  it('401 without a session', async () => {
    const app = buildApp()
    const res = await app.request(`/api/v1/admin/reports/${REPORT_ID}`)
    expect(res.status).toBe(401)
  })

  it('returns report detail', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(adminChain(MODERATOR) as never)
    vi.mocked(getReportDetail).mockResolvedValueOnce({
      id: REPORT_ID,
      reporter_id: 'rep-1',
      reported_type: 'content',
      reported_id: 'content-1',
      reason: 'spam',
      details: null,
      status: 'pending',
      actioned_by: null,
      actioned_at: null,
      action_taken: null,
      created_at: '2026-04-22T00:00:00Z',
    })
    const app = buildApp()
    const res = await app.request(`/api/v1/admin/reports/${REPORT_ID}`, {
      headers: { Cookie: await cookieFor(MODERATOR) },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { id: string } }
    expect(body.data.id).toBe(REPORT_ID)
  })
})

describe('POST /admin/reports/:id/action', () => {
  it('401 without a session', async () => {
    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/reports/${REPORT_ID}/action`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'dismissed' }),
      },
    )
    expect(res.status).toBe(401)
  })

  it('rejects unknown action values', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(adminChain(MODERATOR) as never)
    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/reports/${REPORT_ID}/action`,
      {
        method: 'POST',
        headers: {
          Cookie: await cookieFor(MODERATOR),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'burninate' }),
      },
    )
    expect(res.status).toBe(400)
    expect(vi.mocked(actionReport)).not.toHaveBeenCalled()
  })

  it('forwards the acting admin id from the session cookie', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(adminChain(MODERATOR) as never)
    vi.mocked(actionReport).mockResolvedValueOnce()

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/reports/${REPORT_ID}/action`,
      {
        method: 'POST',
        headers: {
          Cookie: await cookieFor(MODERATOR),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'content_removed' }),
      },
    )

    expect(res.status).toBe(200)
    expect(vi.mocked(actionReport)).toHaveBeenCalledWith(
      REPORT_ID,
      MODERATOR.id,
      'content_removed',
    )
  })
})

describe('POST /admin/users/:id/strike', () => {
  it('requires reason', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(adminChain(MODERATOR) as never)
    const app = buildApp()
    const res = await app.request(`/api/v1/admin/users/${USER_ID}/strike`, {
      method: 'POST',
      headers: {
        Cookie: await cookieFor(MODERATOR),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    expect(vi.mocked(giveStrike)).not.toHaveBeenCalled()
  })

  it('records strike with session admin id', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(adminChain(MODERATOR) as never)
    vi.mocked(giveStrike).mockResolvedValueOnce()
    const app = buildApp()
    const res = await app.request(`/api/v1/admin/users/${USER_ID}/strike`, {
      method: 'POST',
      headers: {
        Cookie: await cookieFor(MODERATOR),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'repeated spam' }),
    })
    expect(res.status).toBe(201)
    expect(vi.mocked(giveStrike)).toHaveBeenCalledWith(
      USER_ID,
      MODERATOR.id,
      'repeated spam',
    )
  })
})

describe('GET /admin/users/:id/strikes', () => {
  it('401 without a session', async () => {
    const app = buildApp()
    const res = await app.request(`/api/v1/admin/users/${USER_ID}/strikes`)
    expect(res.status).toBe(401)
  })

  it('returns strike history for a moderator', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(adminChain(MODERATOR) as never)
    vi.mocked(getUserStrikes).mockResolvedValueOnce({ count: 0, strikes: [] })
    const app = buildApp()
    const res = await app.request(`/api/v1/admin/users/${USER_ID}/strikes`, {
      headers: { Cookie: await cookieFor(MODERATOR) },
    })
    expect(res.status).toBe(200)
    expect(vi.mocked(getUserStrikes)).toHaveBeenCalledWith(USER_ID)
  })
})
