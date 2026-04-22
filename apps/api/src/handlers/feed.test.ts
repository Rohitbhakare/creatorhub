import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// ─── Mocks ────────────────────────────────────────────────────────

vi.mock('../utils/tokens.js', () => ({ verifyAccessToken: vi.fn() }))
vi.mock('../lib/supabase.js', () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }))
vi.mock('../lib/firebase.js', () => ({
  firebaseAuth: { verifyIdToken: vi.fn() },
  firebaseMessaging: { send: vi.fn(), sendEachForMulticast: vi.fn() },
}))

vi.mock('../services/feed.service.js', () => ({
  getNearYouSection: vi.fn(),
  getVerticalSection: vi.fn(),
  getDiscoverSection: vi.fn(),
  updateUserCity: vi.fn(),
}))

import feedRoutes from '../routes/feed.routes.js'
import usersRoutes from '../routes/users.routes.js'
import { verifyAccessToken } from '../utils/tokens.js'
import {
  getNearYouSection,
  getVerticalSection,
  getDiscoverSection,
  updateUserCity,
} from '../services/feed.service.js'
import { errorHandler } from '../middleware/errorHandler.js'
import { AppError } from '../errors/AppError.js'

// ─── Test apps ────────────────────────────────────────────────────

function buildFeedApp() {
  const app = new Hono()
  app.route('/', feedRoutes)
  app.onError(errorHandler)
  return app
}

function buildUsersApp() {
  const app = new Hono()
  app.route('/', usersRoutes)
  app.onError(errorHandler)
  return app
}

// ─── Helpers ──────────────────────────────────────────────────────

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

const AUTH = { Authorization: AUTH_HEADER }

const NEAR_YOU_RESULT = {
  items: [{
    id: 'c1', type: 'post', title: 'Spiti', vertical: 'travel',
    pricing_model: 'free', price_paisa: 0,
    like_count: 5, comment_count: 0, duration_minutes: null,
    starting_city_id: 'in.mh.pune', cover_image_url: null, published_at: null,
    creator: null,
  }],
  fallback_level: 0,
  label: 'Weekend trips from Pune',
  fallback_cities: [],
}

const CONTENT_ITEMS = [
  {
    id: 'c1', type: 'post', title: 'Ladakh', vertical: 'travel',
    pricing_model: 'free', price_paisa: 0,
    like_count: 10, comment_count: 0, duration_minutes: null,
    starting_city_id: null, cover_image_url: null, published_at: null,
    creator: null,
  },
]

const CREATORS = [
  { id: 'u2', display_name: 'Aditya', username: 'aditya', avatar_url: null, vertical: 'stories' },
]

// ─── GET /near-you ────────────────────────────────────────────────

describe('GET /near-you — near you section', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without auth token', async () => {
    const app = buildFeedApp()
    const res = await app.request('/near-you')
    expect(res.status).toBe(401)
  })

  it('returns section data for authenticated user', async () => {
    mockValidToken()
    vi.mocked(getNearYouSection).mockResolvedValue(NEAR_YOU_RESULT)

    const app = buildFeedApp()
    const res = await app.request('/near-you', { headers: AUTH })
    expect(res.status).toBe(200)

    const body = await res.json() as any
    expect(body.success).toBe(true)
    expect(body.data.fallback_level).toBe(0)
    expect(body.data.label).toBe('Weekend trips from Pune')
    expect(body.data.items).toHaveLength(1)
  })

  it('propagates service errors', async () => {
    mockValidToken()
    vi.mocked(getNearYouSection).mockRejectedValue(new AppError('db-error', 500, 'DB fail'))

    const app = buildFeedApp()
    const res = await app.request('/near-you', { headers: AUTH })
    expect(res.status).toBe(500)
  })
})

// ─── GET /vertical/:vertical ──────────────────────────────────────

describe('GET /vertical/:vertical — vertical section', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 400 for invalid vertical', async () => {
    const app = buildFeedApp()
    const res = await app.request('/vertical/invalid')
    expect(res.status).toBe(400)
  })

  it('returns content items for valid vertical (guest)', async () => {
    vi.mocked(verifyAccessToken).mockResolvedValue(null as never)
    vi.mocked(getVerticalSection).mockResolvedValue(CONTENT_ITEMS)

    const app = buildFeedApp()
    const res = await app.request('/vertical/travel')
    expect(res.status).toBe(200)

    const body = await res.json() as any
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].title).toBe('Ladakh')
  })

  it('works for authenticated user too', async () => {
    mockValidToken()
    vi.mocked(getVerticalSection).mockResolvedValue(CONTENT_ITEMS)

    const app = buildFeedApp()
    const res = await app.request('/vertical/travel', { headers: AUTH })
    expect(res.status).toBe(200)
  })

  it('returns empty array when no content', async () => {
    vi.mocked(verifyAccessToken).mockResolvedValue(null as never)
    vi.mocked(getVerticalSection).mockResolvedValue([])

    const app = buildFeedApp()
    const res = await app.request('/vertical/stories')
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.data).toEqual([])
  })
})

// ─── GET /discover ────────────────────────────────────────────────

describe('GET /discover — discover section', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns creators for guest', async () => {
    vi.mocked(verifyAccessToken).mockResolvedValue(null as never)
    vi.mocked(getDiscoverSection).mockResolvedValue(CREATORS)

    const app = buildFeedApp()
    const res = await app.request('/discover')
    expect(res.status).toBe(200)

    const body = await res.json() as any
    expect(body.data).toHaveLength(1)
    expect(body.data[0].vertical).toBe('stories')
  })

  it('returns empty array when no other-vertical creators', async () => {
    mockValidToken()
    vi.mocked(getDiscoverSection).mockResolvedValue([])

    const app = buildFeedApp()
    const res = await app.request('/discover', { headers: AUTH })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.data).toEqual([])
  })
})

// ─── PUT /me/city ─────────────────────────────────────────────────

describe('PUT /me/city — update user city', () => {
  beforeEach(() => vi.clearAllMocks())

  const jsonHeaders = { 'Content-Type': 'application/json', Authorization: AUTH_HEADER }

  it('returns 401 without auth token', async () => {
    const app = buildUsersApp()
    const res = await app.request('/me/city', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city_id: 'in.mh.pune' }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 400 when city_id is missing', async () => {
    mockValidToken()
    const app = buildUsersApp()
    const res = await app.request('/me/city', {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
  })

  it('returns updated city on success', async () => {
    mockValidToken()
    vi.mocked(updateUserCity).mockResolvedValue({ id: 'in.mh.pune', name: 'Pune', state: 'Maharashtra' })

    const app = buildUsersApp()
    const res = await app.request('/me/city', {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({ city_id: 'in.mh.pune' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as any
    expect(body.data.name).toBe('Pune')
  })

  it('returns 404 when city not found', async () => {
    mockValidToken()
    vi.mocked(updateUserCity).mockRejectedValue(new AppError('not-found', 404, 'City not found'))

    const app = buildUsersApp()
    const res = await app.request('/me/city', {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify({ city_id: 'bad-id' }),
    })
    expect(res.status).toBe(404)
  })
})
