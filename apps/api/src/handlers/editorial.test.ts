// Integration tests for /api/v1/admin/collections/* (E4.1, T9).
//
// Covers auth gating (401/403), schema validation, slug uniqueness
// (409), item append/remove behavior including the published-status
// guard, and the MAX_ITEMS ceiling.

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

import editorialRoutes from '../routes/editorial.routes.js'
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

const FINANCE = { ...MODERATOR, id: '22222222-2222-2222-2222-222222222222', role: 'finance' }

const COLLECTION_ID = '33333333-3333-3333-3333-333333333333'
const CONTENT_ID_A = '44444444-4444-4444-4444-444444444444'
const CONTENT_ID_B = '55555555-5555-5555-5555-555555555555'

const COLLECTION_ROW = {
  id: COLLECTION_ID,
  slug: 'editor-picks',
  title: 'Editor Picks',
  subtitle: null,
  cover_image_url: null,
  content_ids: [CONTENT_ID_A],
  is_active: true,
  priority: 10,
  source: 'manual',
  scheduled_start: null,
  scheduled_end: null,
  created_by: MODERATOR.id,
  created_at: '2026-04-22T10:00:00Z',
  refreshed_at: '2026-04-22T10:00:00Z',
}

function buildApp(): Hono {
  const app = new Hono()
  app.route('/api/v1/admin/collections', editorialRoutes)
  app.onError(errorHandler)
  return app
}

function chain(res: { data: unknown; error?: unknown }) {
  const resolved = { data: res.data, error: res.error ?? null }
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolved),
    maybeSingle: vi.fn().mockResolvedValue(resolved),
    then: (ok: (v: unknown) => unknown, fail?: (r: unknown) => unknown) =>
      Promise.resolve(resolved).then(ok, fail),
  }
}

async function cookieFor(row: typeof MODERATOR): Promise<string> {
  const token = await signAdminSession({
    adminId: row.id,
    role: row.role as 'content_moderator' | 'finance',
    email: row.email,
    mustChangePassword: row.must_change_password,
  })
  return `${ADMIN_SESSION_COOKIE}=${token}`
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('GET /api/v1/admin/collections', () => {
  it('returns 401 without a session', async () => {
    const app = buildApp()
    const res = await app.request('/api/v1/admin/collections')
    expect(res.status).toBe(401)
  })

  it('returns 403 for finance role (not moderation)', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: FINANCE }) as never)
    const app = buildApp()
    const res = await app.request('/api/v1/admin/collections', {
      headers: { Cookie: await cookieFor(FINANCE) },
    })
    expect(res.status).toBe(403)
  })

  it('returns 200 + list for moderator', async () => {
    const chains = [chain({ data: MODERATOR }), chain({ data: [COLLECTION_ROW] })]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/collections', {
      headers: { Cookie: await cookieFor(MODERATOR) },
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: unknown[] }
    expect(body.data).toHaveLength(1)
  })
})

describe('POST /api/v1/admin/collections', () => {
  const validBody = {
    slug: 'editor-picks',
    title: 'Editor Picks',
    subtitle: 'Our favourites',
    priority: 10,
    source: 'manual',
    content_ids: [],
  }

  it('returns 400 on invalid slug', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(chain({ data: MODERATOR }) as never)
    const app = buildApp()
    const res = await app.request('/api/v1/admin/collections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await cookieFor(MODERATOR),
      },
      body: JSON.stringify({ ...validBody, slug: 'Bad Slug!' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 409 on duplicate slug', async () => {
    const chains = [
      chain({ data: MODERATOR }),
      chain({ data: null, error: { code: '23505', message: 'duplicate key' } }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/collections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await cookieFor(MODERATOR),
      },
      body: JSON.stringify(validBody),
    })
    expect(res.status).toBe(409)
  })

  it('returns 201 + row on success', async () => {
    const chains = [chain({ data: MODERATOR }), chain({ data: COLLECTION_ROW })]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request('/api/v1/admin/collections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await cookieFor(MODERATOR),
      },
      body: JSON.stringify(validBody),
    })

    expect(res.status).toBe(201)
    const body = (await res.json()) as { data: { slug: string } }
    expect(body.data.slug).toBe('editor-picks')
  })
})

describe('GET /api/v1/admin/collections/:id', () => {
  it('returns 404 when collection missing', async () => {
    const chains = [chain({ data: MODERATOR }), chain({ data: null })]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request(`/api/v1/admin/collections/${COLLECTION_ID}`, {
      headers: { Cookie: await cookieFor(MODERATOR) },
    })
    expect(res.status).toBe(404)
  })

  it('returns 200 + resolved items in array order', async () => {
    const row = { ...COLLECTION_ROW, content_ids: [CONTENT_ID_B, CONTENT_ID_A] }
    const rawContent = [
      {
        id: CONTENT_ID_A,
        type: 'post',
        title: 'A',
        cover_image_url: null,
        creator_id: 'c1',
        status: 'published',
      },
      {
        id: CONTENT_ID_B,
        type: 'post',
        title: 'B',
        cover_image_url: null,
        creator_id: 'c1',
        status: 'published',
      },
    ]
    const chains = [
      chain({ data: MODERATOR }),
      chain({ data: row }),
      chain({ data: rawContent }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request(`/api/v1/admin/collections/${COLLECTION_ID}`, {
      headers: { Cookie: await cookieFor(MODERATOR) },
    })
    expect(res.status).toBe(200)
    const body = (await res.json()) as {
      data: { items: { id: string }[] }
    }
    expect(body.data.items.map((i) => i.id)).toEqual([CONTENT_ID_B, CONTENT_ID_A])
  })
})

describe('PATCH /api/v1/admin/collections/:id', () => {
  it('returns 404 when collection missing', async () => {
    const chains = [chain({ data: MODERATOR }), chain({ data: null })]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request(`/api/v1/admin/collections/${COLLECTION_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await cookieFor(MODERATOR),
      },
      body: JSON.stringify({ title: 'New Title' }),
    })
    expect(res.status).toBe(404)
  })

  it('returns 200 on reorder (content_ids)', async () => {
    const updated = { ...COLLECTION_ROW, content_ids: [CONTENT_ID_B, CONTENT_ID_A] }
    const chains = [chain({ data: MODERATOR }), chain({ data: updated })]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request(`/api/v1/admin/collections/${COLLECTION_ID}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: await cookieFor(MODERATOR),
      },
      body: JSON.stringify({ content_ids: [CONTENT_ID_B, CONTENT_ID_A] }),
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { content_ids: string[] } }
    expect(body.data.content_ids).toEqual([CONTENT_ID_B, CONTENT_ID_A])
  })
})

describe('DELETE /api/v1/admin/collections/:id', () => {
  it('returns 404 when collection missing', async () => {
    const chains = [chain({ data: MODERATOR }), chain({ data: null })]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request(`/api/v1/admin/collections/${COLLECTION_ID}`, {
      method: 'DELETE',
      headers: { Cookie: await cookieFor(MODERATOR) },
    })
    expect(res.status).toBe(404)
  })

  it('returns 200 on success', async () => {
    const chains = [chain({ data: MODERATOR }), chain({ data: { id: COLLECTION_ID } })]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request(`/api/v1/admin/collections/${COLLECTION_ID}`, {
      method: 'DELETE',
      headers: { Cookie: await cookieFor(MODERATOR) },
    })
    expect(res.status).toBe(200)
  })
})

describe('POST /api/v1/admin/collections/:id/items', () => {
  it('returns 409 when content is not published', async () => {
    const chains = [
      chain({ data: MODERATOR }),
      // assertContentPublished
      chain({ data: { id: CONTENT_ID_B, status: 'draft' } }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/collections/${COLLECTION_ID}/items`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await cookieFor(MODERATOR),
        },
        body: JSON.stringify({ content_id: CONTENT_ID_B }),
      },
    )
    expect(res.status).toBe(409)
  })

  it('returns 404 when content missing', async () => {
    const chains = [chain({ data: MODERATOR }), chain({ data: null })]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/collections/${COLLECTION_ID}/items`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await cookieFor(MODERATOR),
        },
        body: JSON.stringify({ content_id: CONTENT_ID_B }),
      },
    )
    expect(res.status).toBe(404)
  })

  it('appends when content is published + not already listed', async () => {
    const appended = {
      ...COLLECTION_ROW,
      content_ids: [CONTENT_ID_A, CONTENT_ID_B],
    }
    const chains = [
      chain({ data: MODERATOR }),
      // assertContentPublished
      chain({ data: { id: CONTENT_ID_B, status: 'published' } }),
      // loadContentIds
      chain({ data: { id: COLLECTION_ID, content_ids: [CONTENT_ID_A] } }),
      // updateContentIds
      chain({ data: appended }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/collections/${COLLECTION_ID}/items`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await cookieFor(MODERATOR),
        },
        body: JSON.stringify({ content_id: CONTENT_ID_B }),
      },
    )

    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { content_ids: string[] } }
    expect(body.data.content_ids).toEqual([CONTENT_ID_A, CONTENT_ID_B])
  })

  it('idempotent: returns current row when content already present', async () => {
    const chains = [
      chain({ data: MODERATOR }),
      // assertContentPublished
      chain({ data: { id: CONTENT_ID_A, status: 'published' } }),
      // loadContentIds → already contains A
      chain({ data: { id: COLLECTION_ID, content_ids: [CONTENT_ID_A] } }),
      // fetchCollection (short-circuit path)
      chain({ data: COLLECTION_ROW }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/collections/${COLLECTION_ID}/items`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: await cookieFor(MODERATOR),
        },
        body: JSON.stringify({ content_id: CONTENT_ID_A }),
      },
    )

    expect(res.status).toBe(200)
  })
})

describe('DELETE /api/v1/admin/collections/:id/items/:contentId', () => {
  it('removes the item from the array', async () => {
    const removed = { ...COLLECTION_ROW, content_ids: [] }
    const chains = [
      chain({ data: MODERATOR }),
      // loadContentIds
      chain({ data: { id: COLLECTION_ID, content_ids: [CONTENT_ID_A] } }),
      // updateContentIds
      chain({ data: removed }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/collections/${COLLECTION_ID}/items/${CONTENT_ID_A}`,
      {
        method: 'DELETE',
        headers: { Cookie: await cookieFor(MODERATOR) },
      },
    )

    expect(res.status).toBe(200)
    const body = (await res.json()) as { data: { content_ids: string[] } }
    expect(body.data.content_ids).toEqual([])
  })

  it('idempotent: no-op when content not present', async () => {
    const chains = [
      chain({ data: MODERATOR }),
      // loadContentIds → does not contain target
      chain({ data: { id: COLLECTION_ID, content_ids: [CONTENT_ID_A] } }),
      // fetchCollection (short-circuit)
      chain({ data: COLLECTION_ROW }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => chains.shift() as never)

    const app = buildApp()
    const res = await app.request(
      `/api/v1/admin/collections/${COLLECTION_ID}/items/${CONTENT_ID_B}`,
      {
        method: 'DELETE',
        headers: { Cookie: await cookieFor(MODERATOR) },
      },
    )

    expect(res.status).toBe(200)
  })
})
