import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// ─── Mocks (must be declared before any imports that touch these modules) ─

vi.mock('../utils/tokens.js', () => ({ verifyAccessToken: vi.fn() }))
vi.mock('../lib/supabase.js', () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }))

vi.mock('../services/post.service.js', () => ({
  createPostDraft: vi.fn(),
  getPostDetail:   vi.fn(),
  updatePost:      vi.fn(),
  publishPost:     vi.fn(),
  listPosts:       vi.fn(),
}))

vi.mock('../services/tnc.service.js', () => ({ recordConsent: vi.fn().mockResolvedValue(undefined) }))
vi.mock('../services/audit.service.js', () => ({ extractIp: vi.fn().mockReturnValue('127.0.0.1') }))

import postsRoutes from '../routes/posts.routes.js'
import { verifyAccessToken } from '../utils/tokens.js'
import {
  createPostDraft,
  getPostDetail,
  updatePost,
  publishPost,
  listPosts,
} from '../services/post.service.js'
import { errorHandler } from '../middleware/errorHandler.js'
import { AppError } from '../errors/AppError.js'

// ─── Test app ──────────────────────────────────────────────────────────────

function buildApp() {
  const app = new Hono()
  app.route('/', postsRoutes)
  app.onError(errorHandler)
  return app
}

// ─── Helpers ───────────────────────────────────────────────────────────────

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

/** Build request options with JSON body (no auth). */
function json(body: unknown) {
  return {
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

/** Build request options with JSON body + Authorization header. */
function authJson(body: unknown) {
  return {
    headers: { 'Content-Type': 'application/json', Authorization: AUTH_HEADER },
    body: JSON.stringify(body),
  }
}

/** Authorization-only header (no body). */
const AUTH = { Authorization: AUTH_HEADER }

const CONTENT_ID = 'content-001'

const draftPost = {
  id: CONTENT_ID,
  type: 'post',
  status: 'draft',
  title: 'My Post',
  vertical: 'travel',
}

const publishedPost = { ...draftPost, status: 'published' }

// ─── POST / — create draft ─────────────────────────────────────────────────

describe('POST / — create post draft', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when Authorization header is missing', async () => {
    const app = buildApp()
    const res = await app.request('/', { method: 'POST', ...json({ type: 'post', vertical: 'travel' }) })
    expect(res.status).toBe(401)
  })

  it('returns 400 when body is missing required fields (type, vertical)', async () => {
    mockValidToken()
    const app = buildApp()
    const res = await app.request('/', { method: 'POST', ...authJson({}) })
    expect(res.status).toBe(400)
    const body = await res.json() as { error: { type: string } }
    expect(body.error.type).toContain('validation-failed')
  })

  it('returns 400 when vertical is invalid', async () => {
    mockValidToken()
    const app = buildApp()
    const res = await app.request('/', {
      method: 'POST',
      ...authJson({ type: 'post', vertical: 'nonexistent_vertical' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 201 with Location header and created post', async () => {
    mockValidToken()
    vi.mocked(createPostDraft).mockResolvedValue(draftPost as never)

    const app = buildApp()
    const res = await app.request('/', {
      method: 'POST',
      ...authJson({ type: 'post', vertical: 'travel' }),
    })

    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toBe(`/api/v1/posts/${CONTENT_ID}`)
    const body = await res.json() as { success: boolean; data: typeof draftPost }
    expect(body.success).toBe(true)
    expect(body.data.type).toBe('post')
  })

  it('calls createPostDraft with authenticated userId and vertical', async () => {
    mockValidToken()
    vi.mocked(createPostDraft).mockResolvedValue(draftPost as never)

    const app = buildApp()
    await app.request('/', { method: 'POST', ...authJson({ type: 'post', vertical: 'travel' }) })

    expect(createPostDraft).toHaveBeenCalledWith('user-001', { vertical: 'travel' })
  })
})

// ─── GET / — list posts ────────────────────────────────────────────────────

describe('GET / — list posts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 without auth (optional authentication)', async () => {
    vi.mocked(listPosts).mockResolvedValue({ items: [], next_cursor: null } as never)

    const app = buildApp()
    const res = await app.request('/')

    expect(res.status).toBe(200)
    const body = await res.json() as { success: boolean; data: unknown[]; meta: { has_more: boolean } }
    expect(body.success).toBe(true)
    expect(body.data).toEqual([])
    expect(body.meta.has_more).toBe(false)
  })

  it('returns correct pagination meta when next_cursor is present', async () => {
    vi.mocked(listPosts).mockResolvedValue({ items: [draftPost], next_cursor: 'abc123' } as never)

    const app = buildApp()
    const res = await app.request('/')

    const body = await res.json() as { meta: { has_more: boolean; next_cursor: string } }
    expect(body.meta.has_more).toBe(true)
    expect(body.meta.next_cursor).toBe('abc123')
  })
})

// ─── GET /:id — get post detail ────────────────────────────────────────────

describe('GET /:id — get post detail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 200 without auth (optional authentication)', async () => {
    vi.mocked(getPostDetail).mockResolvedValue({
      content: draftPost,
      media: [],
      creator: { id: 'user-001', display_name: 'Test', username: 'test', avatar_url: null, follower_count: 0 },
      is_liked: false,
      is_saved: false,
    } as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`)

    expect(res.status).toBe(200)
    const body = await res.json() as { success: boolean; data: Record<string, unknown> }
    expect(body.success).toBe(true)
    expect(body.data.is_liked).toBe(false)
    expect(body.data.is_saved).toBe(false)
  })

  it('returns 404 when service throws not-found AppError', async () => {
    vi.mocked(getPostDetail).mockRejectedValue(new AppError('not-found', 404, 'Post not found'))

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`)

    expect(res.status).toBe(404)
    const body = await res.json() as { error: { status: number } }
    expect(body.error.status).toBe(404)
  })

  it('calls getPostDetail with undefined requesterId when no auth', async () => {
    vi.mocked(getPostDetail).mockResolvedValue({
      content: draftPost, media: [], creator: { id: 'user-001', follower_count: 0 }, is_liked: false, is_saved: false,
    } as never)

    const app = buildApp()
    await app.request(`/${CONTENT_ID}`)

    // posts handler: requesterId = (c.get('userId') as string | null) ?? undefined
    // optionalAuthenticate sets userId=null → null ?? undefined = undefined
    expect(getPostDetail).toHaveBeenCalledWith(CONTENT_ID, undefined)
  })
})

// ─── PUT /:id — update post ────────────────────────────────────────────────

describe('PUT /:id — update post', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when Authorization header is missing', async () => {
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`, { method: 'PUT', ...json({ title: 'New title' }) })
    expect(res.status).toBe(401)
  })

  it('returns 400 when body is empty (refine: at least one field required)', async () => {
    mockValidToken()
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`, { method: 'PUT', ...authJson({}) })
    expect(res.status).toBe(400)
  })

  it('returns 200 with updated post', async () => {
    mockValidToken()
    vi.mocked(updatePost).mockResolvedValue({ ...draftPost, title: 'Updated title' } as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`, {
      method: 'PUT',
      ...authJson({ title: 'Updated title' }),
    })

    expect(res.status).toBe(200)
    const body = await res.json() as { success: boolean; data: typeof draftPost & { title: string } }
    expect(body.success).toBe(true)
    expect(body.data.title).toBe('Updated title')
  })

  it('returns 403 when service throws ownership forbidden error', async () => {
    mockValidToken()
    vi.mocked(updatePost).mockRejectedValue(new AppError('forbidden', 403, 'You do not own this post'))

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`, {
      method: 'PUT',
      ...authJson({ title: 'Hijack' }),
    })

    expect(res.status).toBe(403)
  })
})

// ─── POST /:id/publish — publish post ─────────────────────────────────────

describe('POST /:id/publish — publish post', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when Authorization header is missing', async () => {
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/publish`, {
      method: 'POST',
      ...json({ tnc_accepted: true }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 400 when tnc_accepted is false (must be literal true)', async () => {
    mockValidToken()
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/publish`, {
      method: 'POST',
      ...authJson({ tnc_accepted: false }),
    })
    expect(res.status).toBe(400)
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

  it('returns 200 with published post', async () => {
    mockValidToken()
    vi.mocked(publishPost).mockResolvedValue(publishedPost as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/publish`, {
      method: 'POST',
      ...authJson({ tnc_accepted: true }),
    })

    expect(res.status).toBe(200)
    const body = await res.json() as { success: boolean; data: typeof publishedPost }
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('published')
  })

  it('returns 404 when post does not exist', async () => {
    mockValidToken()
    vi.mocked(publishPost).mockRejectedValue(new AppError('not-found', 404, 'Post not found'))

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/publish`, {
      method: 'POST',
      ...authJson({ tnc_accepted: true }),
    })

    expect(res.status).toBe(404)
  })

  it('returns 403 when user does not own the post', async () => {
    mockValidToken()
    vi.mocked(publishPost).mockRejectedValue(new AppError('forbidden', 403, 'You do not own this post'))

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/publish`, {
      method: 'POST',
      ...authJson({ tnc_accepted: true }),
    })

    expect(res.status).toBe(403)
  })
})
