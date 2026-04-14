import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// ─── Mocks (must be declared before any imports that touch these modules) ─

vi.mock('../utils/tokens.js', () => ({ verifyAccessToken: vi.fn() }))
vi.mock('../lib/supabase.js', () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }))

vi.mock('../services/itinerary.service.js', () => ({
  createItineraryDraft: vi.fn(),
  getItineraryDetail:   vi.fn(),
  updateItinerary:      vi.fn(),
  publishItinerary:     vi.fn(),
  addDay:               vi.fn(),
  updateDay:            vi.fn(),
  removeDay:            vi.fn(),
  addSpot:              vi.fn(),
  updateSpot:           vi.fn(),
  removeSpot:           vi.fn(),
  reorderSpots:         vi.fn(),
}))

vi.mock('../services/tnc.service.js', () => ({ recordConsent: vi.fn().mockResolvedValue(undefined) }))
vi.mock('../services/audit.service.js', () => ({ extractIp: vi.fn().mockReturnValue('127.0.0.1') }))

import itinerariesRoutes from '../routes/itineraries.routes.js'
import { verifyAccessToken } from '../utils/tokens.js'
import {
  createItineraryDraft,
  getItineraryDetail,
  updateItinerary,
  publishItinerary,
  addDay,
  removeDay,
  addSpot,
  reorderSpots,
} from '../services/itinerary.service.js'
import { errorHandler } from '../middleware/errorHandler.js'
import { AppError } from '../errors/AppError.js'

// ─── Test app ──────────────────────────────────────────────────────────────

function buildApp() {
  const app = new Hono()
  app.route('/', itinerariesRoutes)
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
const DAY_ID = 'day-001'
const SPOT_ID = '00000000-0000-0000-0000-000000000001' // must be UUID for reorderSpotsSchema

const draftItinerary = {
  id: CONTENT_ID,
  type: 'self_paced_itinerary',
  status: 'draft',
  title: 'Bali in 5 Days',
  vertical: 'travel',
}

const dayRow = { id: DAY_ID, content_id: CONTENT_ID, day_number: 1 }

const spotRow = {
  id: SPOT_ID,
  itinerary_day_id: DAY_ID,
  name: 'Tanah Lot Temple',
  lat: -8.62,
  lng: 115.09,
}

// ─── POST / — create draft ─────────────────────────────────────────────────

describe('POST / — create itinerary draft', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when Authorization header is missing', async () => {
    const app = buildApp()
    const res = await app.request('/', { method: 'POST', ...json({ vertical: 'travel' }) })
    expect(res.status).toBe(401)
  })

  it('returns 400 when vertical is missing', async () => {
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
      ...authJson({ vertical: 'invalid_vertical' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when day_count exceeds 30', async () => {
    mockValidToken()
    const app = buildApp()
    const res = await app.request('/', {
      method: 'POST',
      ...authJson({ vertical: 'travel', day_count: 31 }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 201 with Location header and created draft', async () => {
    mockValidToken()
    vi.mocked(createItineraryDraft).mockResolvedValue(draftItinerary as never)

    const app = buildApp()
    const res = await app.request('/', {
      method: 'POST',
      ...authJson({ vertical: 'travel', day_count: 3 }),
    })

    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toBe(`/api/v1/itineraries/${CONTENT_ID}`)
    const body = await res.json() as { success: boolean; data: typeof draftItinerary }
    expect(body.success).toBe(true)
    expect(body.data.type).toBe('self_paced_itinerary')
  })

  it('calls createItineraryDraft with userId and body', async () => {
    mockValidToken()
    vi.mocked(createItineraryDraft).mockResolvedValue(draftItinerary as never)

    const app = buildApp()
    await app.request('/', { method: 'POST', ...authJson({ vertical: 'travel', day_count: 2 }) })

    expect(createItineraryDraft).toHaveBeenCalledWith('user-001', expect.objectContaining({ vertical: 'travel', day_count: 2 }))
  })
})

// ─── GET /:id — get detail ─────────────────────────────────────────────────

describe('GET /:id — get itinerary detail', () => {
  beforeEach(() => vi.clearAllMocks())

  const detailResult = {
    content: draftItinerary,
    days: [{ ...dayRow, spots: [] }],
    media: [],
    creator: { id: 'user-001', display_name: 'Creator', username: 'creator', avatar_url: null },
  }

  it('returns 200 without auth (optional authentication)', async () => {
    vi.mocked(getItineraryDetail).mockResolvedValue(detailResult as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`)

    expect(res.status).toBe(200)
    const body = await res.json() as { success: boolean; data: { days: unknown[] } }
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data.days)).toBe(true)
  })

  it('returns 404 when service throws not-found AppError', async () => {
    vi.mocked(getItineraryDetail).mockRejectedValue(new AppError('not-found', 404, 'Content not found'))

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`)

    expect(res.status).toBe(404)
  })

  it('calls getItineraryDetail with null requesterId when no auth', async () => {
    vi.mocked(getItineraryDetail).mockResolvedValue(detailResult as never)

    const app = buildApp()
    await app.request(`/${CONTENT_ID}`)

    expect(getItineraryDetail).toHaveBeenCalledWith(CONTENT_ID, null)
  })
})

// ─── PUT /:id — update itinerary ───────────────────────────────────────────

describe('PUT /:id — update itinerary', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without auth', async () => {
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`, { method: 'PUT', ...json({ title: 'New title here' }) })
    expect(res.status).toBe(401)
  })

  it('returns 400 when body is empty (refine: at least one field required)', async () => {
    mockValidToken()
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`, { method: 'PUT', ...authJson({}) })
    expect(res.status).toBe(400)
  })

  it('returns 200 with updated itinerary', async () => {
    mockValidToken()
    vi.mocked(updateItinerary).mockResolvedValue({ ...draftItinerary, title: 'Updated' } as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`, {
      method: 'PUT',
      ...authJson({ title: 'Updated title here' }),
    })

    expect(res.status).toBe(200)
    const body = await res.json() as { success: boolean }
    expect(body.success).toBe(true)
  })
})

// ─── POST /:id/publish — publish itinerary ────────────────────────────────

describe('POST /:id/publish — publish itinerary', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without auth', async () => {
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/publish`, { method: 'POST', ...json({ tnc_accepted: true }) })
    expect(res.status).toBe(401)
  })

  it('returns 400 when tnc_accepted is false', async () => {
    mockValidToken()
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/publish`, {
      method: 'POST',
      ...authJson({ tnc_accepted: false }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 200 when publish succeeds', async () => {
    mockValidToken()
    vi.mocked(publishItinerary).mockResolvedValue({ ...draftItinerary, status: 'published' } as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/publish`, {
      method: 'POST',
      ...authJson({ tnc_accepted: true }),
    })

    expect(res.status).toBe(200)
    const body = await res.json() as { data: { status: string } }
    expect(body.data.status).toBe('published')
  })

  it('returns 400 when itinerary has no spots', async () => {
    mockValidToken()
    vi.mocked(publishItinerary).mockRejectedValue(new AppError('validation-failed', 400, 'Day 1 has no spots'))

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/publish`, {
      method: 'POST',
      ...authJson({ tnc_accepted: true }),
    })

    expect(res.status).toBe(400)
  })
})

// ─── POST /:id/days — add day ──────────────────────────────────────────────

describe('POST /:id/days — add day', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without auth', async () => {
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/days`, { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('returns 201 with new day', async () => {
    mockValidToken()
    vi.mocked(addDay).mockResolvedValue(dayRow as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/days`, { method: 'POST', headers: AUTH })

    expect(res.status).toBe(201)
    const body = await res.json() as { success: boolean; data: typeof dayRow }
    expect(body.success).toBe(true)
    expect(body.data.day_number).toBe(1)
  })

  it('returns 400 when max days exceeded', async () => {
    mockValidToken()
    vi.mocked(addDay).mockRejectedValue(new AppError('validation-failed', 400, 'Maximum 30 days allowed'))

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/days`, { method: 'POST', headers: AUTH })

    expect(res.status).toBe(400)
  })
})

// ─── DELETE /:id/days/:dayId — remove day ─────────────────────────────────

describe('DELETE /:id/days/:dayId — remove day', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without auth', async () => {
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/days/${DAY_ID}`, { method: 'DELETE' })
    expect(res.status).toBe(401)
  })

  it('returns 204 on success', async () => {
    mockValidToken()
    vi.mocked(removeDay).mockResolvedValue(undefined)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/days/${DAY_ID}`, { method: 'DELETE', headers: AUTH })

    expect(res.status).toBe(204)
  })

  it('returns 403 when user does not own the itinerary', async () => {
    mockValidToken()
    vi.mocked(removeDay).mockRejectedValue(new AppError('forbidden', 403, 'You do not own this content'))

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/days/${DAY_ID}`, { method: 'DELETE', headers: AUTH })

    expect(res.status).toBe(403)
  })

  it('returns 404 when day does not exist', async () => {
    mockValidToken()
    vi.mocked(removeDay).mockRejectedValue(new AppError('not-found', 404, 'Day not found'))

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/days/${DAY_ID}`, { method: 'DELETE', headers: AUTH })

    expect(res.status).toBe(404)
  })
})

// ─── POST /:id/days/:dayId/spots — add spot ────────────────────────────────

describe('POST /:id/days/:dayId/spots — add spot', () => {
  beforeEach(() => vi.clearAllMocks())

  const validSpotBody = {
    name: 'Tanah Lot Temple',
    lat: -8.6215,
    lng: 115.0865,
    stop_type: 'viewpoint',
  }

  it('returns 401 without auth', async () => {
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/days/${DAY_ID}/spots`, {
      method: 'POST',
      ...json(validSpotBody),
    })
    expect(res.status).toBe(401)
  })

  it('returns 400 when name is missing', async () => {
    mockValidToken()
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/days/${DAY_ID}/spots`, {
      method: 'POST',
      ...authJson({ lat: -8.62, lng: 115.09 }), // missing name
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when lat/lng are missing', async () => {
    mockValidToken()
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/days/${DAY_ID}/spots`, {
      method: 'POST',
      ...authJson({ name: 'Tanah Lot' }), // missing lat/lng
    })
    expect(res.status).toBe(400)
  })

  it('returns 201 with created spot', async () => {
    mockValidToken()
    vi.mocked(addSpot).mockResolvedValue(spotRow as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/days/${DAY_ID}/spots`, {
      method: 'POST',
      ...authJson(validSpotBody),
    })

    expect(res.status).toBe(201)
    const body = await res.json() as { success: boolean; data: typeof spotRow }
    expect(body.success).toBe(true)
    expect(body.data.name).toBe('Tanah Lot Temple')
  })

  it('returns 403 when user does not own the day', async () => {
    mockValidToken()
    vi.mocked(addSpot).mockRejectedValue(new AppError('forbidden', 403, 'You do not own this content'))

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/days/${DAY_ID}/spots`, {
      method: 'POST',
      ...authJson(validSpotBody),
    })

    expect(res.status).toBe(403)
  })
})

// ─── PUT /:id/days/:dayId/spots/reorder — reorder spots ───────────────────

describe('PUT /:id/days/:dayId/spots/reorder', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 without auth', async () => {
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/days/${DAY_ID}/spots/reorder`, {
      method: 'PUT',
      ...json({ spot_ids: [SPOT_ID] }),
    })
    expect(res.status).toBe(401)
  })

  it('returns 400 when spot_ids contains non-UUID values', async () => {
    mockValidToken()
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/days/${DAY_ID}/spots/reorder`, {
      method: 'PUT',
      ...authJson({ spot_ids: ['not-a-uuid'] }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 400 when spot_ids is empty', async () => {
    mockValidToken()
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/days/${DAY_ID}/spots/reorder`, {
      method: 'PUT',
      ...authJson({ spot_ids: [] }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 200 on success', async () => {
    mockValidToken()
    vi.mocked(reorderSpots).mockResolvedValue(undefined)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/days/${DAY_ID}/spots/reorder`, {
      method: 'PUT',
      ...authJson({ spot_ids: [SPOT_ID] }),
    })

    expect(res.status).toBe(200)
    const body = await res.json() as { success: boolean; data: { reordered: boolean } }
    expect(body.success).toBe(true)
    expect(body.data.reordered).toBe(true)
  })

  it('returns 400 when spot does not belong to the day', async () => {
    mockValidToken()
    vi.mocked(reorderSpots).mockRejectedValue(
      new AppError('validation-failed', 400, `Spot ${SPOT_ID} does not belong to this day`),
    )

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/days/${DAY_ID}/spots/reorder`, {
      method: 'PUT',
      ...authJson({ spot_ids: [SPOT_ID] }),
    })

    expect(res.status).toBe(400)
  })
})
