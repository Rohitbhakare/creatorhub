// Integration tests for the admin-wide payout queue + detail + booking
// lookup endpoints added in E4.1 T18. Exercises auth gating, status
// filtering, cursor pagination meta shape, and 404 cases.

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

vi.mock('../lib/razorpay.js', () => ({
  editTransfer: vi.fn(),
  reverseTransfer: vi.fn(),
}))

import adminRoutes from '../routes/admin.routes.js'
import { errorHandler } from '../middleware/errorHandler.js'
import { supabase } from '../lib/supabase.js'
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

const FINANCE: AdminRow = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'finance@creatorhub.in',
  firebase_uid: 'fb-fin',
  full_name: 'Finance',
  role: 'finance',
  is_active: true,
  must_change_password: false,
  failed_login_count: 0,
  locked_until: null,
  created_at: '2026-01-01T00:00:00Z',
  last_login_at: null,
  password_changed_at: null,
}

const SUPPORT: AdminRow = {
  ...FINANCE,
  id: '22222222-2222-2222-2222-222222222222',
  role: 'support',
}

const PAYOUT_ID = '55555555-5555-5555-5555-555555555555'
const BOOKING_ID = '66666666-6666-6666-6666-666666666666'
const CREATOR_ID = '77777777-7777-7777-7777-777777777777'
const BUYER_ID = '88888888-8888-8888-8888-888888888888'

function buildApp(): Hono {
  const app = new Hono()
  app.route('/api/v1/admin', adminRoutes)
  app.onError(errorHandler)
  return app
}

function chain(res: { data: unknown; error?: unknown }) {
  const resolved = { data: res.data, error: res.error ?? null }
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolved),
    maybeSingle: vi.fn().mockResolvedValue(resolved),
    then: (ok: (v: unknown) => unknown, fail?: (r: unknown) => unknown) =>
      Promise.resolve(resolved).then(ok, fail),
  }
}

async function cookieFor(row: AdminRow): Promise<string> {
  const token = await signAdminSession({
    adminId: row.id,
    role: row.role,
    email: row.email,
    mustChangePassword: row.must_change_password,
  })
  return `${ADMIN_SESSION_COOKIE}=${token}`
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/v1/admin/payouts', () => {
  it('returns 401 without a session cookie', async () => {
    const app = buildApp()
    const res = await app.request('/api/v1/admin/payouts?status=pending')
    expect(res.status).toBe(401)
  })

  it('returns 403 when caller lacks finance role', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: SUPPORT }) as never)
    const app = buildApp()
    const res = await app.request('/api/v1/admin/payouts?status=pending', {
      headers: { Cookie: await cookieFor(SUPPORT) },
    })
    expect(res.status).toBe(403)
  })

  it('returns 400 for an invalid status', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: FINANCE }) as never)
    const app = buildApp()
    const res = await app.request('/api/v1/admin/payouts?status=oops', {
      headers: { Cookie: await cookieFor(FINANCE) },
    })
    expect(res.status).toBe(400)
  })

  it('lists payouts + hydrates booking title and creator username', async () => {
    const rows = [
      {
        id: PAYOUT_ID,
        creator_id: CREATOR_ID,
        booking_id: BOOKING_ID,
        amount_paisa: 100000,
        tds_paisa: 1000,
        status: 'scheduled',
        scheduled_at: '2026-05-01T00:00:00Z',
        processed_at: null,
        failure_reason: null,
        created_at: '2026-04-22T00:00:00Z',
      },
    ]
    const chains = [
      chain({ data: FINANCE }),
      chain({ data: rows }),
      chain({ data: [{ id: BOOKING_ID, content: { title: 'Sunset walk' } }] }),
      chain({ data: [{ id: CREATOR_ID, username: 'arjun' }] }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/payouts?status=scheduled&limit=25', {
      headers: { Cookie: await cookieFor(FINANCE) },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      data: Array<{
        id: string
        creator_username: string | null
        booking_title: string | null
      }>
      meta: { next_cursor: string | null; has_more: boolean; per_page: number }
    }
    expect(body.data).toHaveLength(1)
    expect(body.data[0]?.creator_username).toBe('arjun')
    expect(body.data[0]?.booking_title).toBe('Sunset walk')
    expect(body.meta.has_more).toBe(false)
    expect(body.meta.per_page).toBe(25)
  })
})

describe('GET /api/v1/admin/payouts/:payoutId', () => {
  it('returns 404 when the payout does not exist', async () => {
    const chains = [chain({ data: FINANCE }), chain({ data: null })]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)
    const app = buildApp()
    const res = await app.request(`/api/v1/admin/payouts/${PAYOUT_ID}`, {
      headers: { Cookie: await cookieFor(FINANCE) },
    })
    expect(res.status).toBe(404)
  })

  it('returns detail with refund_in_flight + booking_status', async () => {
    const row = {
      id: PAYOUT_ID,
      creator_id: CREATOR_ID,
      booking_id: BOOKING_ID,
      amount_paisa: 100000,
      tds_paisa: 1000,
      status: 'scheduled',
      scheduled_at: '2026-05-01T00:00:00Z',
      processed_at: null,
      failure_reason: null,
      created_at: '2026-04-22T00:00:00Z',
      razorpay_transfer_id: 'trf_1',
      razorpay_payout_id: null,
    }
    const chains = [
      chain({ data: FINANCE }),
      chain({ data: row }),
      chain({ data: { status: 'completed', content: { title: 'T1' } } }),
      chain({ data: { username: 'arjun' } }),
      chain({ data: [{ id: 'r1' }] }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request(`/api/v1/admin/payouts/${PAYOUT_ID}`, {
      headers: { Cookie: await cookieFor(FINANCE) },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      data: {
        booking_status: string
        refund_in_flight: boolean
        creator_username: string | null
      }
    }
    expect(body.data.booking_status).toBe('completed')
    expect(body.data.refund_in_flight).toBe(true)
    expect(body.data.creator_username).toBe('arjun')
  })
})

describe('GET /api/v1/admin/bookings/:bookingId', () => {
  it('returns 401 without a session cookie', async () => {
    const app = buildApp()
    const res = await app.request(`/api/v1/admin/bookings/${BOOKING_ID}`)
    expect(res.status).toBe(401)
  })

  it('returns 403 when caller lacks finance role', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: SUPPORT }) as never)
    const app = buildApp()
    const res = await app.request(`/api/v1/admin/bookings/${BOOKING_ID}`, {
      headers: { Cookie: await cookieFor(SUPPORT) },
    })
    expect(res.status).toBe(403)
  })

  it('returns 404 when the booking does not exist', async () => {
    const chains = [chain({ data: FINANCE }), chain({ data: null })]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)
    const app = buildApp()
    const res = await app.request(`/api/v1/admin/bookings/${BOOKING_ID}`, {
      headers: { Cookie: await cookieFor(FINANCE) },
    })
    expect(res.status).toBe(404)
  })

  it('returns booking detail with buyer + creator usernames + refund_in_flight', async () => {
    const row = {
      id: BOOKING_ID,
      status: 'confirmed',
      total_paisa: 500000,
      creator_payout_paisa: 400000,
      buyer_id: BUYER_ID,
      creator_id: CREATOR_ID,
      content_id: 'c1',
      razorpay_payment_id: 'pay_1',
      razorpay_refund_id: null,
      created_at: '2026-04-20T00:00:00Z',
      updated_at: '2026-04-20T00:00:00Z',
      content: { title: 'Sunset walk' },
    }
    const chains = [
      chain({ data: FINANCE }),
      chain({ data: row }),
      chain({
        data: [
          { id: BUYER_ID, username: 'neha' },
          { id: CREATOR_ID, username: 'arjun' },
        ],
      }),
      chain({ data: [] }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request(`/api/v1/admin/bookings/${BOOKING_ID}`, {
      headers: { Cookie: await cookieFor(FINANCE) },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      data: {
        buyer_username: string | null
        creator_username: string | null
        content_title: string | null
        refund_in_flight: boolean
      }
    }
    expect(body.data.buyer_username).toBe('neha')
    expect(body.data.creator_username).toBe('arjun')
    expect(body.data.content_title).toBe('Sunset walk')
    expect(body.data.refund_in_flight).toBe(false)
  })
})
