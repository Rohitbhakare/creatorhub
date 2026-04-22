// Integration tests for /api/v1/admin/payouts/release (E4.1, T8).
//
// Covers auth gating, the three 409 refusal paths (booking incomplete,
// refund in flight, no transfer id), Razorpay failure → 502, and the
// happy release path. Supabase + Razorpay are mocked; session signing
// is real.

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

vi.mock('../services/payout-notifications.service.js', () => ({
  notifyPayoutsEnabled: vi.fn().mockResolvedValue(undefined),
  notifyPayoutProcessed: vi.fn().mockResolvedValue(undefined),
  notifyPayoutFailed: vi.fn().mockResolvedValue(undefined),
  notifyLinkedAccountActionRequired: vi.fn().mockResolvedValue(undefined),
}))

import adminRoutes from '../routes/admin.routes.js'
import { errorHandler } from '../middleware/errorHandler.js'
import { supabase } from '../lib/supabase.js'
import * as razorpay from '../lib/razorpay.js'
import {
  signAdminSession,
  ADMIN_SESSION_COOKIE,
} from '../utils/admin-session.js'

const FINANCE = {
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

const SUPPORT = { ...FINANCE, id: '22222222-2222-2222-2222-222222222222', role: 'support' }

const PAYOUT_ID = '55555555-5555-5555-5555-555555555555'
const BOOKING_ID = '66666666-6666-6666-6666-666666666666'
const TRANSFER_ID = 'trf_admin'

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

async function cookieFor(row: typeof FINANCE): Promise<string> {
  const token = await signAdminSession({
    adminId: row.id,
    role: row.role as 'finance' | 'support',
    email: row.email,
    mustChangePassword: row.must_change_password,
  })
  return `${ADMIN_SESSION_COOKIE}=${token}`
}

const payoutRow = {
  id: PAYOUT_ID,
  booking_id: BOOKING_ID,
  status: 'scheduled',
  razorpay_transfer_id: TRANSFER_ID,
  // Scheduled 10h in the future — verifies force bypass of not_due.
  scheduled_at: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/v1/admin/payouts/release', () => {
  it('returns 401 without a session cookie', async () => {
    const app = buildApp()
    const res = await app.request('/api/v1/admin/payouts/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payout_id: PAYOUT_ID, reason: 'early release approved' }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 403 when caller lacks finance role', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: SUPPORT }) as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/payouts/release', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await cookieFor(SUPPORT),
      },
      body: JSON.stringify({ payout_id: PAYOUT_ID, reason: 'early release approved' }),
    })
    expect(res.status).toBe(403)
  })

  it('returns 400 for invalid body (missing reason)', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: FINANCE }) as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/payouts/release', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await cookieFor(FINANCE),
      },
      body: JSON.stringify({ payout_id: PAYOUT_ID }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when payout_id is not a UUID', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: FINANCE }) as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/payouts/release', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await cookieFor(FINANCE),
      },
      body: JSON.stringify({ payout_id: 'not-a-uuid', reason: 'early release approved' }),
    })
    expect(res.status).toBe(400)
  })

  it('releases despite scheduled_at in the future (force bypass)', async () => {
    const chains = [
      // middleware row
      chain({ data: FINANCE }),
      // releasePayout: fetch payout
      chain({ data: payoutRow }),
      // releasePayout: booking status
      chain({ data: { status: 'completed' } }),
      // releasePayout: refunds
      chain({ data: [] }),
      // releasePayout: update processing
      chain({ data: null }),
      // audit insert (fire-and-forget)
      chain({ data: null }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)
    vi.mocked(razorpay.editTransfer).mockResolvedValueOnce({
      id: TRANSFER_ID,
      status: 'processed',
      amount: 100,
      currency: 'INR',
      recipient: 'acc_1',
      on_hold: false,
    })

    const app = buildApp()
    const res = await app.request('/api/v1/admin/payouts/release', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await cookieFor(FINANCE),
      },
      body: JSON.stringify({ payout_id: PAYOUT_ID, reason: 'creator requested early release' }),
    })

    expect(res.status).toBe(200)
    expect(razorpay.editTransfer).toHaveBeenCalledWith(TRANSFER_ID, { on_hold: 0 })
    const body = (await res.json()) as { success: boolean; data: { status: string } }
    expect(body.data.status).toBe('released')
  })

  it('returns 409 when the booking is not completed', async () => {
    const chains = [
      chain({ data: FINANCE }),
      chain({ data: payoutRow }),
      chain({ data: { status: 'confirmed' } }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/payouts/release', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await cookieFor(FINANCE),
      },
      body: JSON.stringify({ payout_id: PAYOUT_ID, reason: 'please release' }),
    })

    expect(res.status).toBe(409)
    expect(razorpay.editTransfer).not.toHaveBeenCalled()
  })

  it('returns 409 when a refund is in flight', async () => {
    const chains = [
      chain({ data: FINANCE }),
      chain({ data: payoutRow }),
      chain({ data: { status: 'completed' } }),
      chain({ data: [{ id: 'rfn-1', status: 'processing' }] }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/payouts/release', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await cookieFor(FINANCE),
      },
      body: JSON.stringify({ payout_id: PAYOUT_ID, reason: 'please release' }),
    })

    expect(res.status).toBe(409)
    expect(razorpay.editTransfer).not.toHaveBeenCalled()
  })

  it('returns 409 when no Razorpay transfer id is linked', async () => {
    const noTransfer = { ...payoutRow, razorpay_transfer_id: null }
    const chains = [chain({ data: FINANCE }), chain({ data: noTransfer })]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/payouts/release', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await cookieFor(FINANCE),
      },
      body: JSON.stringify({ payout_id: PAYOUT_ID, reason: 'please release' }),
    })

    expect(res.status).toBe(409)
  })

  it('returns 404 when the payout does not exist', async () => {
    const chains = [chain({ data: FINANCE }), chain({ data: null })]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/payouts/release', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await cookieFor(FINANCE),
      },
      body: JSON.stringify({ payout_id: PAYOUT_ID, reason: 'please release' }),
    })

    expect(res.status).toBe(404)
  })

  it('returns 502 when Razorpay rejects the release', async () => {
    const chains = [
      chain({ data: FINANCE }),
      chain({ data: payoutRow }),
      chain({ data: { status: 'completed' } }),
      chain({ data: [] }),
      // failure update inside releasePayout
      chain({ data: null }),
      // notifyReleaseFailure → payouts lookup
      chain({ data: { creator_id: 'c1', booking_id: BOOKING_ID } }),
      // notifyReleaseFailure → bookings lookup
      chain({ data: { content: { title: 't' } } }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)
    vi.mocked(razorpay.editTransfer).mockRejectedValueOnce(new Error('rzp boom'))

    const app = buildApp()
    const res = await app.request('/api/v1/admin/payouts/release', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await cookieFor(FINANCE),
      },
      body: JSON.stringify({ payout_id: PAYOUT_ID, reason: 'please release' }),
    })

    expect(res.status).toBe(502)
  })

  it('idempotent: returns 200 + already_released when payout is already processing', async () => {
    const alreadyReleased = { ...payoutRow, status: 'processing' }
    const chains = [chain({ data: FINANCE }), chain({ data: alreadyReleased })]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/payouts/release', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await cookieFor(FINANCE),
      },
      body: JSON.stringify({ payout_id: PAYOUT_ID, reason: 'please release' }),
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { status: string } }
    expect(body.data.status).toBe('already_released')
    expect(razorpay.editTransfer).not.toHaveBeenCalled()
  })
})
