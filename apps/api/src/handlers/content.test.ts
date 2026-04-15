import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// ─── Mocks (must be declared before any imports that touch these modules) ─

vi.mock('../utils/tokens.js', () => ({ verifyAccessToken: vi.fn() }))
vi.mock('../lib/supabase.js', () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }))

vi.mock('../services/content.service.js', () => ({
  createDraft: vi.fn(),
  getById: vi.fn(),
  updateDraft: vi.fn(),
  listDrafts: vi.fn(),
  listPublished: vi.fn(),
  softDelete: vi.fn(),
}))

vi.mock('../services/content-state.service.js', () => ({
  publish: vi.fn(),
  unpublish: vi.fn(),
  archive: vi.fn(),
}))

vi.mock('../services/tnc.service.js', () => ({
  recordConsent: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../services/audit.service.js', () => ({
  extractIp: vi.fn().mockReturnValue('127.0.0.1'),
}))

import contentRoutes from '../routes/content.routes.js'
import { verifyAccessToken } from '../utils/tokens.js'
import {
  createDraft,
  getById,
  updateDraft,
  listDrafts,
  listPublished,
  softDelete,
} from '../services/content.service.js'
import { publish, unpublish, archive } from '../services/content-state.service.js'
import { errorHandler } from '../middleware/errorHandler.js'
import { AppError } from '../errors/AppError.js'

// ─── Test app ─────────────────────────────────────────────────────────────

function buildApp() {
  const app = new Hono()
  app.route('/', contentRoutes)
  app.onError(errorHandler)
  return app
}

// ─── Helpers ──────────────────────────────────────────────────────────────

const AUTH_HEADER = 'Bearer valid.token.here'
const TOKEN_PAYLOAD = {
  sub: 'user-001',
  type: 'access' as const,
  iss: 'creatorhub',
  iat: 0,
  exp: 9_999_999_999,
}

function mockValidToken() {
  vi.mocked(verifyAccessToken).mockResolvedValue(TOKEN_PAYLOAD)
}

function json(body: unknown) {
  return {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

function authJson(body: unknown) {
  return {
    headers: { 'Content-Type': 'application/json', Authorization: AUTH_HEADER },
    body: JSON.stringify(body),
  }
}

const AUTH = { Authorization: AUTH_HEADER }

const USER_ID = 'user-001'
const CONTENT_ID = 'content-001'

const draftContent = {
  id: CONTENT_ID,
  user_id: USER_ID,
  type: 'post',
  status: 'draft',
  title: 'My Draft',
  vertical: 'travel',
  pricing_model: 'free',
  price_paisa: 0,
}

const publishedContent = {
  ...draftContent,
  status: 'published',
  published_at: '2026-01-01T00:00:00Z',
}

// ─── POST / — handleCreateDraft ───────────────────────────────────────────

describe('POST / — create draft', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without auth token', async () => {
    const app = buildApp()
    const res = await app.request('/', {
      method: 'POST',
      ...json({ type: 'post', vertical: 'travel' }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 400 when required fields are missing', async () => {
    mockValidToken()
    const app = buildApp()
    const res = await app.request('/', {
      method: 'POST',
      ...authJson({ vertical: 'travel' }), // missing type
    })
    expect(res.status).toBe(400)
  })

  it('creates draft and returns 201 with Location header', async () => {
    mockValidToken()
    vi.mocked(createDraft).mockResolvedValue(draftContent as never)

    const app = buildApp()
    const res = await app.request('/', {
      method: 'POST',
      ...authJson({ type: 'post', vertical: 'travel' }),
    })

    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toBe(`/api/v1/content/${CONTENT_ID}`)
    const body = await res.json() as any
    expect(body.success).toBe(true)
    expect(body.data).toMatchObject({ id: CONTENT_ID, type: 'post' })
  })
})

// ─── GET /:id — handleGetContent ─────────────────────────────────────────

describe('GET /:id — get content', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 404 when content not found', async () => {
    vi.mocked(verifyAccessToken).mockResolvedValue(null as never)
    vi.mocked(getById).mockRejectedValue(
      new AppError('not-found', 404, 'Content not found'),
    )

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`)
    expect(res.status).toBe(404)
  })

  it('returns content with media and creator for guest', async () => {
    vi.mocked(getById).mockResolvedValue({
      content: publishedContent,
      media: [],
      creator: { id: USER_ID, display_name: 'Creator', username: 'creator', avatar_url: null },
    } as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`)
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.success).toBe(true)
    expect(body.data).toMatchObject({ id: CONTENT_ID, media: [], creator: { id: USER_ID } })
  })

  it('returns draft to authenticated owner', async () => {
    mockValidToken()
    vi.mocked(getById).mockResolvedValue({
      content: draftContent,
      media: [],
      creator: { id: USER_ID, display_name: 'Creator', username: 'creator', avatar_url: null },
    } as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`, { headers: AUTH })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.data.status).toBe('draft')
  })
})

// ─── PUT /:id — handleUpdateDraft ────────────────────────────────────────

describe('PUT /:id — update draft', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without auth token', async () => {
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`, {
      method: 'PUT',
      ...json({ title: 'New Title' }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 403 when user does not own the content', async () => {
    mockValidToken()
    vi.mocked(updateDraft).mockRejectedValue(
      new AppError('forbidden', 403, 'You do not own this content'),
    )

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`, {
      method: 'PUT',
      ...authJson({ title: 'New Title' }),
    })
    expect(res.status).toBe(403)
  })

  it('accepts any JSON body (no Zod validation on PUT)', async () => {
    mockValidToken()
    const updated = { ...draftContent, title: 'New Title' }
    vi.mocked(updateDraft).mockResolvedValue(updated as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`, {
      method: 'PUT',
      ...authJson({ title: 'New Title', extra_field: 'allowed' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.data.title).toBe('New Title')
  })
})

// ─── GET /me/drafts — handleListDrafts ───────────────────────────────────

describe('GET /me/drafts — list drafts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without auth token', async () => {
    const app = buildApp()
    const res = await app.request('/me/drafts')
    expect(res.status).toBe(401)
  })

  it('returns empty array when no drafts', async () => {
    mockValidToken()
    vi.mocked(listDrafts).mockResolvedValue([])

    const app = buildApp()
    const res = await app.request('/me/drafts', { headers: AUTH })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.data).toEqual([])
  })

  it('passes type filter from query param', async () => {
    mockValidToken()
    vi.mocked(listDrafts).mockResolvedValue([draftContent as never])

    const app = buildApp()
    const res = await app.request('/me/drafts?type=post', { headers: AUTH })
    expect(res.status).toBe(200)
    expect(listDrafts).toHaveBeenCalledWith(USER_ID, 'post')
  })
})

// ─── GET / — handleListPublished ─────────────────────────────────────────

describe('GET / — list published content', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns published items with meta and creator', async () => {
    vi.mocked(listPublished).mockResolvedValue({
      items: [publishedContent as never],
      next_cursor: null,
    })

    // Creator lookup — supabase.from('users').select(...).in(...)
    const { supabase } = await import('../lib/supabase.js')
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [{ id: USER_ID, display_name: 'Creator', username: 'creator', avatar_url: null }] }),
    } as never)

    const app = buildApp()
    const res = await app.request('/')
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
    expect(body.meta).toMatchObject({ has_more: false, per_page: 20 })
    expect(body.data[0].creator).toMatchObject({ id: USER_ID })
  })

  it('returns empty data with next_cursor in meta when paginated', async () => {
    const cursor = Buffer.from('2026-01-01T00:00:00Z|content-001', 'utf-8').toString('base64url')
    vi.mocked(listPublished).mockResolvedValue({
      items: [],
      next_cursor: cursor,
    })

    const { supabase } = await import('../lib/supabase.js')
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [] }),
    } as never)

    const app = buildApp()
    const res = await app.request('/')
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.meta.has_more).toBe(true)
    expect(body.meta.next_cursor).toBe(cursor)
  })

  it('returns 400 when limit param is not a number', async () => {
    const app = buildApp()
    const res = await app.request('/?limit=abc')
    expect(res.status).toBe(400)
  })
})

// ─── DELETE /:id — handleSoftDelete ──────────────────────────────────────

describe('DELETE /:id — soft delete', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without auth token', async () => {
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`, { method: 'DELETE' })
    expect(res.status).toBe(401)
  })

  it('returns 404 when content not found', async () => {
    mockValidToken()
    vi.mocked(softDelete).mockRejectedValue(
      new AppError('not-found', 404, 'Content not found'),
    )

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`, {
      method: 'DELETE',
      headers: AUTH,
    })
    expect(res.status).toBe(404)
  })

  it('returns 204 on success', async () => {
    mockValidToken()
    vi.mocked(softDelete).mockResolvedValue(undefined)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`, {
      method: 'DELETE',
      headers: AUTH,
    })
    expect(res.status).toBe(204)
  })
})

// ─── POST /:id/publish — handlePublish ───────────────────────────────────

describe('POST /:id/publish — publish content', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without auth token', async () => {
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/publish`, {
      method: 'POST',
      ...json({ tnc_accepted: true }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 400 when tnc_accepted is missing', async () => {
    mockValidToken()
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/publish`, {
      method: 'POST',
      ...authJson({}),
    })
    expect(res.status).toBe(400)
  })

  it('returns published content on success', async () => {
    mockValidToken()
    vi.mocked(publish).mockResolvedValue(publishedContent as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/publish`, {
      method: 'POST',
      ...authJson({ tnc_accepted: true }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.data.status).toBe('published')
  })
})

// ─── POST /:id/unpublish — handleUnpublish ───────────────────────────────

describe('POST /:id/unpublish — unpublish content', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without auth token', async () => {
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/unpublish`, { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('returns unpublished content on success', async () => {
    mockValidToken()
    const unpublishedContent = { ...publishedContent, status: 'unpublished' }
    vi.mocked(unpublish).mockResolvedValue(unpublishedContent as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/unpublish`, {
      method: 'POST',
      headers: AUTH,
    })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.data.status).toBe('unpublished')
  })
})

// ─── POST /:id/archive — handleArchive ───────────────────────────────────

describe('POST /:id/archive — archive content', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without auth token', async () => {
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/archive`, { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('returns archived content on success', async () => {
    mockValidToken()
    const archivedContent = { ...publishedContent, status: 'archived' }
    vi.mocked(archive).mockResolvedValue(archivedContent as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/archive`, {
      method: 'POST',
      headers: AUTH,
    })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.data.status).toBe('archived')
  })
})
