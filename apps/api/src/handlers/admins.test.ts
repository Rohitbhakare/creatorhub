// Integration tests for /api/v1/admin/admins/* (E4.1, T6).
//
// Drives the full pipeline: route → requireAdminRole → validateBody →
// handler → service. Supabase + Firebase Admin + audit writes are
// mocked; session signing is real so role checks exercise the JWT
// flow end-to-end.

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

import adminsRoutes from '../routes/admins.routes.js'
import { errorHandler } from '../middleware/errorHandler.js'
import { supabase } from '../lib/supabase.js'
import { firebaseAuth } from '../lib/firebase.js'
import {
  signAdminSession,
  ADMIN_SESSION_COOKIE,
} from '../utils/admin-session.js'

const SUPER_ADMIN = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'root@creatorhub.in',
  firebase_uid: 'fb-root',
  full_name: 'Root',
  role: 'super_admin',
  is_active: true,
  must_change_password: false,
  failed_login_count: 0,
  locked_until: null,
  created_at: '2026-01-01T00:00:00Z',
  last_login_at: null,
  password_changed_at: null,
}

const SUPPORT_ADMIN = {
  ...SUPER_ADMIN,
  id: '22222222-2222-2222-2222-222222222222',
  email: 'support@creatorhub.in',
  role: 'support',
}

const NEW_ADMIN_ROW = {
  id: '33333333-3333-3333-3333-333333333333',
  email: 'new@creatorhub.in',
  full_name: 'New Admin',
  role: 'content_moderator',
  is_active: true,
  must_change_password: true,
  last_login_at: null,
  created_at: '2026-04-22T10:00:00Z',
}

function buildApp(): Hono {
  const app = new Hono()
  app.route('/api/v1/admin/admins', adminsRoutes)
  app.onError(errorHandler)
  return app
}

/**
 * Chain factory. `reads` is a FIFO queue of results returned by
 * terminal reads (`.maybeSingle`, `.single`) and update/insert awaits.
 * Matches the call pattern in admins.service.ts.
 */
function queuedChain(reads: { data: unknown; error?: unknown }[]) {
  const next = (): { data: unknown; error: unknown } => {
    const entry = reads.shift() ?? { data: null, error: null }
    return { data: entry.data, error: entry.error ?? null }
  }

  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(next())),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(next())),
    then: (
      onFulfilled: (val: { data: unknown; error: unknown }) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(next()).then(onFulfilled, onRejected),
  }
  return chain
}

async function sessionCookieFor(row: typeof SUPER_ADMIN): Promise<string> {
  const token = await signAdminSession({
    adminId: row.id,
    role: row.role as 'super_admin' | 'support',
    email: row.email,
    mustChangePassword: row.must_change_password,
  })
  return `${ADMIN_SESSION_COOKIE}=${token}`
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/v1/admin/admins (list)', () => {
  it('returns 401 without a session cookie', async () => {
    const app = buildApp()
    const res = await app.request('/api/v1/admin/admins')
    expect(res.status).toBe(401)
  })

  it('returns 403 when caller is not super_admin', async () => {
    vi.mocked(supabase.from).mockReturnValue(
      queuedChain([{ data: SUPPORT_ADMIN }]) as never,
    )

    const app = buildApp()
    const res = await app.request('/api/v1/admin/admins', {
      headers: { Cookie: await sessionCookieFor(SUPPORT_ADMIN) },
    })
    expect(res.status).toBe(403)
  })

  it('returns 200 + admin list when caller is super_admin', async () => {
    // First call: middleware row lookup. Second call: list query.
    vi.mocked(supabase.from)
      .mockReturnValueOnce(queuedChain([{ data: SUPER_ADMIN }]) as never)
      .mockReturnValueOnce(queuedChain([{ data: [NEW_ADMIN_ROW] }]) as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/admins', {
      headers: { Cookie: await sessionCookieFor(SUPER_ADMIN) },
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as { success: boolean; data: unknown[] }
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
  })
})

describe('POST /api/v1/admin/admins (create)', () => {
  it('returns 400 for invalid body', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      queuedChain([{ data: SUPER_ADMIN }]) as never,
    )

    const app = buildApp()
    const res = await app.request('/api/v1/admin/admins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await sessionCookieFor(SUPER_ADMIN),
      },
      body: JSON.stringify({ email: 'not-an-email', full_name: 'x', role: 'bogus' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 409 when email already exists', async () => {
    vi.mocked(supabase.from)
      // middleware row
      .mockReturnValueOnce(queuedChain([{ data: SUPER_ADMIN }]) as never)
      // uniqueness check — returns an existing row
      .mockReturnValueOnce(queuedChain([{ data: { id: NEW_ADMIN_ROW.id } }]) as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/admins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await sessionCookieFor(SUPER_ADMIN),
      },
      body: JSON.stringify({
        email: 'new@creatorhub.in',
        full_name: 'Dup Admin',
        role: 'support',
      }),
    })
    expect(res.status).toBe(409)
  })

  it('returns 201 + temp_password on success', async () => {
    vi.mocked(supabase.from)
      // middleware row
      .mockReturnValueOnce(queuedChain([{ data: SUPER_ADMIN }]) as never)
      // uniqueness check — empty
      .mockReturnValueOnce(queuedChain([{ data: null }]) as never)
      // insert → select → single
      .mockReturnValueOnce(queuedChain([{ data: NEW_ADMIN_ROW }]) as never)

    vi.mocked(firebaseAuth.getUserByEmail).mockRejectedValueOnce(
      Object.assign(new Error('no user'), { code: 'auth/user-not-found' }),
    )
    vi.mocked(firebaseAuth.createUser).mockResolvedValueOnce({ uid: 'fb-new' } as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/admins', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await sessionCookieFor(SUPER_ADMIN),
      },
      body: JSON.stringify({
        email: 'new@creatorhub.in',
        full_name: 'New Admin',
        role: 'content_moderator',
      }),
    })

    expect(res.status).toBe(201)
    const body = (await res.json()) as {
      data: { admin: { id: string }; temp_password: string }
    }
    expect(body.data.admin.id).toBe(NEW_ADMIN_ROW.id)
    // Temp password policy: 16 chars, includes symbol + digit.
    expect(body.data.temp_password.length).toBe(16)
    expect(body.data.temp_password).toMatch(/.*!7$/)
  })
})

describe('PATCH /api/v1/admin/admins/:id (update)', () => {
  it('translates last-super-admin trigger into 409', async () => {
    vi.mocked(supabase.from)
      // middleware row
      .mockReturnValueOnce(queuedChain([{ data: SUPER_ADMIN }]) as never)
      // update fails with trigger message
      .mockReturnValueOnce(
        queuedChain([
          {
            data: null,
            error: { message: 'cannot deactivate or demote the last active super_admin' },
          },
        ]) as never,
      )

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/admins/${SUPER_ADMIN.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await sessionCookieFor(SUPER_ADMIN),
        },
        body: JSON.stringify({ is_active: false }),
      },
    )

    expect(res.status).toBe(409)
  })

  it('returns updated profile on success', async () => {
    const updated = { ...NEW_ADMIN_ROW, role: 'support' }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(queuedChain([{ data: SUPER_ADMIN }]) as never)
      .mockReturnValueOnce(queuedChain([{ data: updated }]) as never)

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/admins/${NEW_ADMIN_ROW.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await sessionCookieFor(SUPER_ADMIN),
        },
        body: JSON.stringify({ role: 'support' }),
      },
    )

    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { role: string } }
    expect(body.data.role).toBe('support')
  })
})

describe('POST /api/v1/admin/admins/:id/reset-password', () => {
  it('rejects self-reset (400)', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      queuedChain([{ data: SUPER_ADMIN }]) as never,
    )

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/admins/${SUPER_ADMIN.id}/reset-password`,
      {
        method: 'POST',
        headers: { Cookie: await sessionCookieFor(SUPER_ADMIN) },
      },
    )

    expect(res.status).toBe(400)
  })

  it('returns temp_password on success', async () => {
    vi.mocked(supabase.from)
      // middleware row
      .mockReturnValueOnce(queuedChain([{ data: SUPER_ADMIN }]) as never)
      // lookup target
      .mockReturnValueOnce(
        queuedChain([
          {
            data: {
              id: NEW_ADMIN_ROW.id,
              firebase_uid: 'fb-new',
              is_active: true,
            },
          },
        ]) as never,
      )
      // supabase update (then-able)
      .mockReturnValueOnce(queuedChain([{ data: null, error: null }]) as never)
      // getAdminProfile → findAdminById → maybeSingle
      .mockReturnValueOnce(queuedChain([{ data: NEW_ADMIN_ROW }]) as never)

    vi.mocked(firebaseAuth.updateUser).mockResolvedValueOnce({} as never)

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/admins/${NEW_ADMIN_ROW.id}/reset-password`,
      {
        method: 'POST',
        headers: { Cookie: await sessionCookieFor(SUPER_ADMIN) },
      },
    )

    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      data: { admin: { id: string }; temp_password: string }
    }
    expect(body.data.admin.id).toBe(NEW_ADMIN_ROW.id)
    expect(body.data.temp_password.length).toBe(16)
  })
})
