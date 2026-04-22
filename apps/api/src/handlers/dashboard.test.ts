// Integration tests for /api/v1/admin/dashboard/summary (E4.1, T14).
//
// Covers auth gating, the happy path (five parallel sub-queries),
// partial failure behavior (count null if a sub-query errors), and the
// recent-activity failure surfacing as 500.

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

import dashboardRoutes from '../routes/dashboard.routes.js'
import { errorHandler } from '../middleware/errorHandler.js'
import { supabase } from '../lib/supabase.js'
import {
  signAdminSession,
  ADMIN_SESSION_COOKIE,
} from '../utils/admin-session.js'

const ADMIN_ROW = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'ops@creatorhub.in',
  firebase_uid: 'fb-ops',
  full_name: 'Ops Admin',
  role: 'operations' as const,
  is_active: true,
  must_change_password: false,
  failed_login_count: 0,
  locked_until: null,
  created_at: '2026-01-01T00:00:00Z',
  last_login_at: null,
  password_changed_at: null,
}

// Chain for the admin lookup in requireAdminRole.
function adminChain() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: ADMIN_ROW, error: null }),
  }
}

// Terminal chain for a `.select(..., { count: 'exact', head: true })`
// style count query. Every filter returns the awaited count payload.
function countChain(count: number | null, error: unknown = null) {
  const resolved = { count, error }
  const chain: Record<string, unknown> = {}
  const step = (): typeof chain => chain
  chain['select'] = vi.fn().mockImplementation(step)
  chain['eq'] = vi.fn().mockImplementation(step)
  chain['in'] = vi.fn().mockImplementation(step)
  chain['gte'] = vi.fn().mockImplementation(step)
  chain['then'] = (
    ok: (v: unknown) => unknown,
    fail?: (r: unknown) => unknown,
  ): Promise<unknown> => Promise.resolve(resolved).then(ok, fail)
  return chain
}

// Terminal chain for the recent-activity query (returns rows).
function rowsChain(rows: unknown[], error: unknown = null) {
  const resolved = { data: rows, error }
  const chain: Record<string, unknown> = {}
  const step = (): typeof chain => chain
  chain['select'] = vi.fn().mockImplementation(step)
  chain['order'] = vi.fn().mockImplementation(step)
  chain['limit'] = vi.fn().mockImplementation(step)
  chain['then'] = (
    ok: (v: unknown) => unknown,
    fail?: (r: unknown) => unknown,
  ): Promise<unknown> => Promise.resolve(resolved).then(ok, fail)
  return chain
}

function buildApp(): Hono {
  const app = new Hono()
  app.route('/api/v1/admin/dashboard', dashboardRoutes)
  app.onError(errorHandler)
  return app
}

async function sessionCookie(): Promise<string> {
  const token = await signAdminSession({
    adminId: ADMIN_ROW.id,
    role: ADMIN_ROW.role,
    email: ADMIN_ROW.email,
    mustChangePassword: false,
  })
  return `${ADMIN_SESSION_COOKIE}=${token}`
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('auth gating', () => {
  it('401 without a session', async () => {
    const app = buildApp()
    const res = await app.request('/api/v1/admin/dashboard/summary')
    expect(res.status).toBe(401)
  })
})

describe('GET /summary', () => {
  it('aggregates all five sub-queries into one payload', async () => {
    const activity = [
      {
        id: 'a1',
        admin_email: 'ops@creatorhub.in',
        action: 'approve_kyc',
        target_type: 'kyc',
        target_id: 'kyc-1',
        created_at: '2026-04-22T09:00:00Z',
      },
    ]

    vi.mocked(supabase.from)
      .mockReturnValueOnce(adminChain() as never) // requireAdminRole
      .mockReturnValueOnce(countChain(12) as never) // kyc_submissions
      .mockReturnValueOnce(countChain(7) as never) // reports
      .mockReturnValueOnce(countChain(3) as never) // takedowns today
      .mockReturnValueOnce(countChain(23) as never) // payouts_queued
      .mockReturnValueOnce(rowsChain(activity) as never) // recent activity

    const app = buildApp()
    const res = await app.request('/api/v1/admin/dashboard/summary', {
      headers: { Cookie: await sessionCookie() },
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      data: {
        pending_kyc: number
        open_reports: number
        takedowns_today: number
        payouts_queued: number
        recent_activity: typeof activity
        generated_at: string
      }
    }
    expect(body.data.pending_kyc).toBe(12)
    expect(body.data.open_reports).toBe(7)
    expect(body.data.takedowns_today).toBe(3)
    expect(body.data.payouts_queued).toBe(23)
    expect(body.data.recent_activity).toHaveLength(1)
    expect(body.data.recent_activity[0]?.action).toBe('approve_kyc')
    expect(typeof body.data.generated_at).toBe('string')
  })

  it('returns null for a counter when its sub-query errors (resilient)', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(adminChain() as never)
      .mockReturnValueOnce(
        countChain(null, { message: 'table missing' }) as never,
      ) // kyc fails
      .mockReturnValueOnce(countChain(2) as never)
      .mockReturnValueOnce(countChain(0) as never)
      .mockReturnValueOnce(countChain(5) as never)
      .mockReturnValueOnce(rowsChain([]) as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/dashboard/summary', {
      headers: { Cookie: await sessionCookie() },
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      data: { pending_kyc: number | null; open_reports: number | null }
    }
    expect(body.data.pending_kyc).toBeNull()
    expect(body.data.open_reports).toBe(2)
  })

  it('bubbles a 500 when recent-activity fails', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(adminChain() as never)
      .mockReturnValueOnce(countChain(0) as never)
      .mockReturnValueOnce(countChain(0) as never)
      .mockReturnValueOnce(countChain(0) as never)
      .mockReturnValueOnce(countChain(0) as never)
      .mockReturnValueOnce(
        rowsChain([], { message: 'pg went away' }) as never,
      )

    const app = buildApp()
    const res = await app.request('/api/v1/admin/dashboard/summary', {
      headers: { Cookie: await sessionCookie() },
    })

    expect(res.status).toBe(500)
  })

  it('filters takedowns to UTC start-of-today', async () => {
    const kyc = countChain(0)
    const reports = countChain(0)
    const takedowns = countChain(0)
    const payouts = countChain(0)
    const activity = rowsChain([])

    vi.mocked(supabase.from)
      .mockReturnValueOnce(adminChain() as never)
      .mockReturnValueOnce(kyc as never)
      .mockReturnValueOnce(reports as never)
      .mockReturnValueOnce(takedowns as never)
      .mockReturnValueOnce(payouts as never)
      .mockReturnValueOnce(activity as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/dashboard/summary', {
      headers: { Cookie: await sessionCookie() },
    })

    expect(res.status).toBe(200)
    const gteCall = (takedowns['gte'] as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(gteCall?.[0]).toBe('created_at')
    expect(gteCall?.[1]).toMatch(/T00:00:00\.000Z$/)
    const eqCall = (takedowns['eq'] as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(eqCall).toEqual(['action', 'takedown_content'])
  })

  it('accepts every admin role (informational endpoint)', async () => {
    const adminRow = { ...ADMIN_ROW, role: 'finance' as const }
    vi.mocked(supabase.from)
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: adminRow, error: null }),
      } as never)
      .mockReturnValueOnce(countChain(0) as never)
      .mockReturnValueOnce(countChain(0) as never)
      .mockReturnValueOnce(countChain(0) as never)
      .mockReturnValueOnce(countChain(0) as never)
      .mockReturnValueOnce(rowsChain([]) as never)

    const token = await signAdminSession({
      adminId: adminRow.id,
      role: 'finance',
      email: adminRow.email,
      mustChangePassword: false,
    })

    const app = buildApp()
    const res = await app.request('/api/v1/admin/dashboard/summary', {
      headers: { Cookie: `${ADMIN_SESSION_COOKIE}=${token}` },
    })
    expect(res.status).toBe(200)
  })
})
