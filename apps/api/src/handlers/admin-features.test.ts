// Integration tests for feature/unfeature endpoints (E4.1, T7).
//
// Covers auth gating (401/403), success paths (200 + audit call), and
// the 409 refusal on featuring unpublished content. Supabase and
// Firebase are mocked; session signing is real.

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

import adminRoutes from '../routes/admin.routes.js'
import { errorHandler } from '../middleware/errorHandler.js'
import { supabase } from '../lib/supabase.js'
import {
  signAdminSession,
  ADMIN_SESSION_COOKIE,
} from '../utils/admin-session.js'

const MODERATOR = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'mod@creatorhub.in',
  firebase_uid: 'fb-mod',
  full_name: 'Mod',
  role: 'content_moderator',
  is_active: true,
  must_change_password: false,
  failed_login_count: 0,
  locked_until: null,
  created_at: '2026-01-01T00:00:00Z',
  last_login_at: null,
  password_changed_at: null,
}

const SUPPORT = {
  ...MODERATOR,
  id: '22222222-2222-2222-2222-222222222222',
  email: 'support@creatorhub.in',
  role: 'support',
}

const CONTENT_ID = '33333333-3333-3333-3333-333333333333'
const USER_ID = '44444444-4444-4444-4444-444444444444'

function buildApp(): Hono {
  const app = new Hono()
  app.route('/api/v1/admin', adminRoutes)
  app.onError(errorHandler)
  return app
}

/**
 * FIFO queue of terminal results. Mirrors the helper used in
 * admins.test.ts.
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

async function cookieFor(row: typeof MODERATOR): Promise<string> {
  const token = await signAdminSession({
    adminId: row.id,
    role: row.role as 'content_moderator' | 'support',
    email: row.email,
    mustChangePassword: row.must_change_password,
  })
  return `${ADMIN_SESSION_COOKIE}=${token}`
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/v1/admin/content/:contentId/feature', () => {
  it('returns 401 without a session cookie', async () => {
    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/content/${CONTENT_ID}/feature`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      },
    )
    expect(res.status).toBe(401)
  })

  it('returns 403 when caller is support (no moderation role)', async () => {
    // middleware row lookup only — request is rejected before any
    // handler work.
    vi.mocked(supabase.from).mockReturnValueOnce(
      queuedChain([{ data: SUPPORT }]) as never,
    )

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/content/${CONTENT_ID}/feature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await cookieFor(SUPPORT),
        },
        body: JSON.stringify({}),
      },
    )
    expect(res.status).toBe(403)
  })

  it('returns 409 when content is not published', async () => {
    vi.mocked(supabase.from)
      // middleware row
      .mockReturnValueOnce(queuedChain([{ data: MODERATOR }]) as never)
      // service status lookup → draft
      .mockReturnValueOnce(
        queuedChain([{ data: { id: CONTENT_ID, status: 'draft' } }]) as never,
      )

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/content/${CONTENT_ID}/feature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await cookieFor(MODERATOR),
        },
        body: JSON.stringify({ reason: 'looks great' }),
      },
    )
    expect(res.status).toBe(409)
  })

  it('returns 404 when content does not exist', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(queuedChain([{ data: MODERATOR }]) as never)
      // status lookup returns nothing
      .mockReturnValueOnce(queuedChain([{ data: null }]) as never)

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/content/${CONTENT_ID}/feature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await cookieFor(MODERATOR),
        },
        body: JSON.stringify({}),
      },
    )
    expect(res.status).toBe(404)
  })

  it('returns 200 when content is published', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(queuedChain([{ data: MODERATOR }]) as never)
      // service status lookup
      .mockReturnValueOnce(
        queuedChain([
          { data: { id: CONTENT_ID, status: 'published' } },
        ]) as never,
      )
      // service update → select → maybeSingle
      .mockReturnValueOnce(queuedChain([{ data: { id: CONTENT_ID } }]) as never)
      // audit insert (fire-and-forget)
      .mockReturnValueOnce(queuedChain([{ data: null, error: null }]) as never)

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/content/${CONTENT_ID}/feature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await cookieFor(MODERATOR),
        },
        body: JSON.stringify({ reason: 'homepage hero' }),
      },
    )

    expect(res.status).toBe(200)
    const body = (await res.json()) as { success: boolean }
    expect(body.success).toBe(true)
  })
})

describe('POST /api/v1/admin/content/:contentId/unfeature', () => {
  it('returns 200 without requiring published status (corrective)', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(queuedChain([{ data: MODERATOR }]) as never)
      // update → select → maybeSingle (no status lookup since
      // unfeaturing is always allowed)
      .mockReturnValueOnce(queuedChain([{ data: { id: CONTENT_ID } }]) as never)
      .mockReturnValueOnce(queuedChain([{ data: null, error: null }]) as never)

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/content/${CONTENT_ID}/unfeature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await cookieFor(MODERATOR),
        },
        body: JSON.stringify({}),
      },
    )

    expect(res.status).toBe(200)
  })

  it('returns 404 when content does not exist', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(queuedChain([{ data: MODERATOR }]) as never)
      // update → select → maybeSingle → null
      .mockReturnValueOnce(queuedChain([{ data: null }]) as never)

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/content/${CONTENT_ID}/unfeature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await cookieFor(MODERATOR),
        },
        body: JSON.stringify({}),
      },
    )

    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/admin/users/:userId/feature', () => {
  it('returns 200 on success', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(queuedChain([{ data: MODERATOR }]) as never)
      // update → select → maybeSingle
      .mockReturnValueOnce(queuedChain([{ data: { id: USER_ID } }]) as never)
      .mockReturnValueOnce(queuedChain([{ data: null, error: null }]) as never)

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/users/${USER_ID}/feature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await cookieFor(MODERATOR),
        },
        body: JSON.stringify({ reason: 'editors pick' }),
      },
    )

    expect(res.status).toBe(200)
  })

  it('returns 404 when user is missing', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(queuedChain([{ data: MODERATOR }]) as never)
      .mockReturnValueOnce(queuedChain([{ data: null }]) as never)

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/users/${USER_ID}/feature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await cookieFor(MODERATOR),
        },
        body: JSON.stringify({}),
      },
    )

    expect(res.status).toBe(404)
  })
})

describe('POST /api/v1/admin/users/:userId/unfeature', () => {
  it('returns 400 when reason is too short', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      queuedChain([{ data: MODERATOR }]) as never,
    )

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/users/${USER_ID}/unfeature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await cookieFor(MODERATOR),
        },
        body: JSON.stringify({ reason: 'x' }),
      },
    )

    expect(res.status).toBe(400)
  })

  it('returns 200 with empty body', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(queuedChain([{ data: MODERATOR }]) as never)
      .mockReturnValueOnce(queuedChain([{ data: { id: USER_ID } }]) as never)
      .mockReturnValueOnce(queuedChain([{ data: null, error: null }]) as never)

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/users/${USER_ID}/unfeature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await cookieFor(MODERATOR),
        },
        body: JSON.stringify({}),
      },
    )

    expect(res.status).toBe(200)
  })
})
