// Integration tests for /api/v1/admin/analytics/search/* (E4.1, T10).
//
// Covers auth gating (401 no-session), role gating (any admin role
// accepted), query validation (defaults + bad window), and the three
// aggregate endpoints against mocked RPC payloads.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

vi.mock('../lib/supabase.js', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}))

vi.mock('../lib/firebase.js', () => ({
  firebaseAuth: {
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
  },
}))

import searchAnalyticsRoutes from '../routes/search-analytics.routes.js'
import { errorHandler } from '../middleware/errorHandler.js'
import { supabase } from '../lib/supabase.js'
import {
  signAdminSession,
  ADMIN_SESSION_COOKIE,
} from '../utils/admin-session.js'

const OPERATIONS = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'ops@creatorhub.in',
  firebase_uid: 'fb-ops',
  full_name: 'Ops Admin',
  role: 'operations',
  is_active: true,
  must_change_password: false,
  failed_login_count: 0,
  locked_until: null,
  created_at: '2026-01-01T00:00:00Z',
  last_login_at: null,
  password_changed_at: null,
}

const SUPPORT = { ...OPERATIONS, id: '22222222-2222-2222-2222-222222222222', role: 'support' }

function chain(res: { data: unknown; error?: unknown }) {
  const resolved = { data: res.data, error: res.error ?? null }
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(resolved),
    single: vi.fn().mockResolvedValue(resolved),
    then: (ok: (v: unknown) => unknown, fail?: (r: unknown) => unknown) =>
      Promise.resolve(resolved).then(ok, fail),
  }
}

function buildApp(): Hono {
  const app = new Hono()
  app.route('/api/v1/admin/analytics/search', searchAnalyticsRoutes)
  app.onError(errorHandler)
  return app
}

async function cookieFor(row: typeof OPERATIONS): Promise<string> {
  const token = await signAdminSession({
    adminId: row.id,
    role: row.role as 'operations' | 'support',
    email: row.email,
    mustChangePassword: row.must_change_password,
  })
  return `${ADMIN_SESSION_COOKIE}=${token}`
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('auth gating', () => {
  it('top: 401 without a session', async () => {
    const app = buildApp()
    const res = await app.request('/api/v1/admin/analytics/search/top')
    expect(res.status).toBe(401)
  })

  it('zero-results: 401 without a session', async () => {
    const app = buildApp()
    const res = await app.request('/api/v1/admin/analytics/search/zero-results')
    expect(res.status).toBe(401)
  })

  it('ctr: 401 without a session', async () => {
    const app = buildApp()
    const res = await app.request('/api/v1/admin/analytics/search/ctr')
    expect(res.status).toBe(401)
  })
})

describe('GET /top', () => {
  it('returns rows for operations role with default window', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: OPERATIONS }) as never)
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [
        { query: 'goa', search_count: 42, unique_users: 30, zero_result_count: 0 },
        { query: 'bali', search_count: 18, unique_users: 12, zero_result_count: 2 },
      ],
      error: null,
    } as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/analytics/search/top', {
      headers: { Cookie: await cookieFor(OPERATIONS) },
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { window: string; rows: unknown[] } }
    expect(body.data.window).toBe('7d')
    expect(body.data.rows).toHaveLength(2)
    expect(vi.mocked(supabase.rpc)).toHaveBeenCalledWith('search_top_queries', {
      p_days: 7,
      p_limit: 50,
    })
  })

  it('honors window=30d and custom limit', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: OPERATIONS }) as never)
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [], error: null } as never)

    const app = buildApp()
    const res = await app.request(
      '/api/v1/admin/analytics/search/top?window=30d&limit=10',
      { headers: { Cookie: await cookieFor(OPERATIONS) } },
    )

    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { window: string } }
    expect(body.data.window).toBe('30d')
    expect(vi.mocked(supabase.rpc)).toHaveBeenCalledWith('search_top_queries', {
      p_days: 30,
      p_limit: 10,
    })
  })

  it('rejects invalid window value', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: OPERATIONS }) as never)

    const app = buildApp()
    const res = await app.request(
      '/api/v1/admin/analytics/search/top?window=90d',
      { headers: { Cookie: await cookieFor(OPERATIONS) } },
    )

    expect(res.status).toBe(400)
  })

  it('rejects limit above 100', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: OPERATIONS }) as never)

    const app = buildApp()
    const res = await app.request(
      '/api/v1/admin/analytics/search/top?limit=500',
      { headers: { Cookie: await cookieFor(OPERATIONS) } },
    )

    expect(res.status).toBe(400)
  })

  it('returns 500 when RPC fails', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: OPERATIONS }) as never)
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'function missing' },
    } as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/analytics/search/top', {
      headers: { Cookie: await cookieFor(OPERATIONS) },
    })

    expect(res.status).toBe(500)
  })

  it('accepts support role (analytics is read-for-all)', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: SUPPORT }) as never)
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [], error: null } as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/analytics/search/top', {
      headers: { Cookie: await cookieFor(SUPPORT) },
    })
    expect(res.status).toBe(200)
  })
})

describe('GET /zero-results', () => {
  it('returns zero-result aggregate rows', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: OPERATIONS }) as never)
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [
        { query: 'xyzzy', hits: 5, last_seen: '2026-04-22T10:00:00Z' },
      ],
      error: null,
    } as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/analytics/search/zero-results', {
      headers: { Cookie: await cookieFor(OPERATIONS) },
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      data: { rows: { query: string; hits: number }[] }
    }
    expect(body.data.rows[0]?.query).toBe('xyzzy')
    expect(vi.mocked(supabase.rpc)).toHaveBeenCalledWith('search_zero_results', {
      p_days: 7,
      p_limit: 50,
    })
  })

  it('passes 30d window through', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: OPERATIONS }) as never)
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [], error: null } as never)

    const app = buildApp()
    const res = await app.request(
      '/api/v1/admin/analytics/search/zero-results?window=30d',
      { headers: { Cookie: await cookieFor(OPERATIONS) } },
    )

    expect(res.status).toBe(200)
    expect(vi.mocked(supabase.rpc)).toHaveBeenCalledWith('search_zero_results', {
      p_days: 30,
      p_limit: 50,
    })
  })
})

describe('GET /ctr', () => {
  it('returns CTR rows with integer pct', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: OPERATIONS }) as never)
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [
        { query: 'goa', searches: 100, clicks: 35, ctr_pct: 35 },
      ],
      error: null,
    } as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/analytics/search/ctr', {
      headers: { Cookie: await cookieFor(OPERATIONS) },
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      data: { rows: { query: string; ctr_pct: number }[] }
    }
    expect(body.data.rows[0]?.ctr_pct).toBe(35)
    expect(vi.mocked(supabase.rpc)).toHaveBeenCalledWith('search_click_through', {
      p_days: 7,
      p_limit: 50,
    })
  })

  it('returns empty rows when no data', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: OPERATIONS }) as never)
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: null } as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/analytics/search/ctr', {
      headers: { Cookie: await cookieFor(OPERATIONS) },
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { rows: unknown[] } }
    expect(body.data.rows).toEqual([])
  })
})
