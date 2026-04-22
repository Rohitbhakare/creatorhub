// Integration tests for GET /api/v1/admin/content/search added in E4.1 T19
// for the editorial collection picker. Exercises auth gating, query
// validation, and creator-username hydration.

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

const FINANCE: AdminRow = {
  ...MODERATOR,
  id: '44444444-4444-4444-4444-444444444444',
  role: 'finance',
}

const CONTENT_ID = '55555555-5555-5555-5555-555555555555'
const CREATOR_ID = '66666666-6666-6666-6666-666666666666'

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
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
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

describe('GET /api/v1/admin/content/search', () => {
  it('returns 401 without a session cookie', async () => {
    const app = buildApp()
    const res = await app.request('/api/v1/admin/content/search?q=sunset')
    expect(res.status).toBe(401)
  })

  it('returns 403 when caller lacks content_moderator/super_admin role', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: FINANCE }) as never)
    const app = buildApp()
    const res = await app.request('/api/v1/admin/content/search?q=sunset', {
      headers: { Cookie: await cookieFor(FINANCE) },
    })
    expect(res.status).toBe(403)
  })

  it('returns 400 when q is empty', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: MODERATOR }) as never)
    const app = buildApp()
    const res = await app.request('/api/v1/admin/content/search?q=', {
      headers: { Cookie: await cookieFor(MODERATOR) },
    })
    expect(res.status).toBe(400)
  })

  it('returns matching published content with creator username hydrated', async () => {
    const contentRows = [
      {
        id: CONTENT_ID,
        title: 'Sunset walk',
        type: 'itinerary',
        status: 'published',
        user_id: CREATOR_ID,
        cover_image_url: 'https://cdn.example.com/c.jpg',
      },
    ]
    const chains = [
      chain({ data: MODERATOR }),
      chain({ data: contentRows }),
      chain({ data: [{ id: CREATOR_ID, username: 'arjun' }] }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request(
      '/api/v1/admin/content/search?q=sunset&limit=20',
      { headers: { Cookie: await cookieFor(MODERATOR) } },
    )
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      data: Array<{
        id: string
        title: string
        creator_username: string | null
        cover_image_url: string | null
      }>
    }
    expect(body.data).toHaveLength(1)
    expect(body.data[0]?.id).toBe(CONTENT_ID)
    expect(body.data[0]?.title).toBe('Sunset walk')
    expect(body.data[0]?.creator_username).toBe('arjun')
    expect(body.data[0]?.cover_image_url).toBe('https://cdn.example.com/c.jpg')
  })
})
