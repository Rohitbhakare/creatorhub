import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'

// ─── Mocks (must be declared before any imports that touch these modules) ─

vi.mock('../utils/tokens.js', () => ({ verifyAccessToken: vi.fn() }))
vi.mock('../lib/supabase.js', () => ({ supabase: { from: vi.fn(), rpc: vi.fn() } }))

vi.mock('../services/event.service.js', () => ({
  createEventDraft: vi.fn(),
  getEventDetail:   vi.fn(),
  updateEvent:      vi.fn(),
  publishEvent:     vi.fn(),
  rsvpEvent:        vi.fn(),
  cancelRsvp:       vi.fn(),
  listEvents:       vi.fn(),
}))

vi.mock('../services/tnc.service.js', () => ({ recordConsent: vi.fn().mockResolvedValue(undefined) }))
vi.mock('../services/audit.service.js', () => ({ extractIp: vi.fn().mockReturnValue('127.0.0.1') }))

import eventsRoutes from '../routes/events.routes.js'
import { verifyAccessToken } from '../utils/tokens.js'
import {
  createEventDraft,
  getEventDetail,
  updateEvent,
  publishEvent,
  rsvpEvent,
  cancelRsvp,
  listEvents,
} from '../services/event.service.js'
import { errorHandler } from '../middleware/errorHandler.js'
import { resetRateLimitStore } from '../middleware/rateLimit.js'
import { AppError } from '../errors/AppError.js'

// ─── Test app ──────────────────────────────────────────────────────────────

function buildApp() {
  const app = new Hono()
  app.route('/', eventsRoutes)
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

const CONTENT_ID = 'content-event-001'
const BOOKING_ID = 'booking-001'

const FUTURE_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
const FUTURE_END  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString()

const draftEvent = {
  id: CONTENT_ID,
  type: 'event',
  status: 'draft',
  title: 'Sunset Hike Hampi',
  vertical: 'travel',
  user_id: 'user-001',
}

const occurrence = {
  content_id: CONTENT_ID,
  start_at: FUTURE_DATE,
  end_at: FUTURE_END,
  timezone: 'Asia/Kolkata',
  venue_name: 'Hampi Boulders',
  venue_address: 'Hampi, Karnataka',
  venue_point: 'POINT(76.4601 15.3350)',
  city_id: 'city-001',
  capacity: 20,
  spots_booked: 3,
  is_free: true,
  what_to_bring: ['water bottle', 'sunscreen'],
}

const eventDetailResult = {
  content: draftEvent,
  occurrence,
  media: [{ id: 'media-001', url: 'https://cdn.example.com/img.jpg', media_type: 'image', display_order: 0 }],
  creator: { id: 'user-001', display_name: 'Rohit', username: 'rohit', avatar_url: null },
  attendees: [{ id: 'user-002', display_name: 'Alice', avatar_url: null }],
  attendee_count: 3,
  has_rsvpd: false,
}

// ─── POST / — create event draft ──────────────────────────────────────────

describe('POST / — create event draft', () => {
  beforeEach(() => { vi.clearAllMocks(); resetRateLimitStore() })

  it('returns 401 when Authorization header is missing', async () => {
    const app = buildApp()
    const res = await app.request('/', { method: 'POST', ...json({ type: 'event', vertical: 'travel' }) })
    expect(res.status).toBe(401)
  })

  it('returns 400 when vertical is missing', async () => {
    mockValidToken()
    const app = buildApp()
    const res = await app.request('/', { method: 'POST', ...authJson({ type: 'event' }) })
    expect(res.status).toBe(400)
    const body = await res.json() as { error: { type: string } }
    expect(body.error.type).toContain('validation-failed')
  })

  it('returns 400 when type is invalid', async () => {
    mockValidToken()
    const app = buildApp()
    const res = await app.request('/', { method: 'POST', ...authJson({ type: 'blog', vertical: 'travel' }) })
    expect(res.status).toBe(400)
  })

  it('returns 400 when vertical is invalid', async () => {
    mockValidToken()
    const app = buildApp()
    const res = await app.request('/', { method: 'POST', ...authJson({ type: 'event', vertical: 'astrology' }) })
    expect(res.status).toBe(400)
  })

  it('returns 201 with Location header and created draft', async () => {
    mockValidToken()
    vi.mocked(createEventDraft).mockResolvedValue(draftEvent as never)

    const app = buildApp()
    const res = await app.request('/', {
      method: 'POST',
      ...authJson({ type: 'event', vertical: 'travel' }),
    })

    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toBe(`/api/v1/events/${CONTENT_ID}`)
    const body = await res.json() as { success: boolean; data: typeof draftEvent }
    expect(body.success).toBe(true)
    expect(body.data.type).toBe('event')
    expect(body.data.status).toBe('draft')
  })

  it('calls createEventDraft with userId and vertical', async () => {
    mockValidToken()
    vi.mocked(createEventDraft).mockResolvedValue(draftEvent as never)

    const app = buildApp()
    await app.request('/', { method: 'POST', ...authJson({ type: 'event', vertical: 'travel' }) })

    expect(createEventDraft).toHaveBeenCalledWith('user-001', expect.objectContaining({ vertical: 'travel' }))
  })
})

// ─── GET / — list events ───────────────────────────────────────────────────

describe('GET / — list events', () => {
  beforeEach(() => { vi.clearAllMocks(); resetRateLimitStore() })

  const listResult = {
    items: [
      {
        id: CONTENT_ID,
        title: 'Sunset Hike Hampi',
        start_at: FUTURE_DATE,
        end_at: FUTURE_END,
        venue_name: 'Hampi Boulders',
        city_id: 'city-001',
        capacity: 20,
        spots_booked: 3,
        is_free: true,
        cover_image_url: 'https://cdn.example.com/img.jpg',
        creator: { id: 'user-001', display_name: 'Rohit', username: 'rohit', avatar_url: null },
      },
    ],
    next_cursor: null,
  }

  it('returns 200 without auth (optional authentication)', async () => {
    vi.mocked(listEvents).mockResolvedValue(listResult as never)

    const app = buildApp()
    const res = await app.request('/')

    expect(res.status).toBe(200)
    const body = await res.json() as { success: boolean; data: unknown[]; meta: { has_more: boolean } }
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('returns meta.has_more=false when no next_cursor', async () => {
    vi.mocked(listEvents).mockResolvedValue({ items: [], next_cursor: null } as never)

    const app = buildApp()
    const res = await app.request('/')
    const body = await res.json() as { meta: { has_more: boolean; next_cursor: null; per_page: number } }

    expect(body.meta.has_more).toBe(false)
    expect(body.meta.next_cursor).toBeNull()
    expect(body.meta.per_page).toBe(20)
  })

  it('returns meta.has_more=true when next_cursor is present', async () => {
    vi.mocked(listEvents).mockResolvedValue({
      items: listResult.items,
      next_cursor: 'dGVzdA',
    } as never)

    const app = buildApp()
    const res = await app.request('/?limit=1')
    const body = await res.json() as { meta: { has_more: boolean; next_cursor: string; per_page: number } }

    expect(body.meta.has_more).toBe(true)
    expect(body.meta.next_cursor).toBe('dGVzdA')
    expect(body.meta.per_page).toBe(1)
  })

  it('passes city_id filter to listEvents service', async () => {
    vi.mocked(listEvents).mockResolvedValue({ items: [], next_cursor: null } as never)

    const app = buildApp()
    await app.request('/?city_id=city-001')

    expect(listEvents).toHaveBeenCalledWith(
      expect.objectContaining({ city_id: 'city-001' }),
    )
  })
})

// ─── GET /:id — get event detail ──────────────────────────────────────────

describe('GET /:id — get event detail', () => {
  beforeEach(() => { vi.clearAllMocks(); resetRateLimitStore() })

  it('returns 200 without auth (optional authentication)', async () => {
    vi.mocked(getEventDetail).mockResolvedValue(eventDetailResult as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`)

    expect(res.status).toBe(200)
    const body = await res.json() as { success: boolean; data: Record<string, unknown> }
    expect(body.success).toBe(true)
    expect(body.data.has_rsvpd).toBe(false)
    expect(Array.isArray(body.data.media)).toBe(true)
  })

  it('parses POINT(lng lat) format to venue_lat and venue_lng', async () => {
    vi.mocked(getEventDetail).mockResolvedValue(eventDetailResult as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`)
    const body = await res.json() as { data: { venue_lat: number; venue_lng: number } }

    // POINT(76.4601 15.3350) → lng=76.4601, lat=15.3350
    expect(body.data.venue_lng).toBeCloseTo(76.4601, 3)
    expect(body.data.venue_lat).toBeCloseTo(15.3350, 3)
  })

  it('returns venue_lat and venue_lng as null when venue_point is null', async () => {
    vi.mocked(getEventDetail).mockResolvedValue({
      ...eventDetailResult,
      occurrence: { ...occurrence, venue_point: null },
    } as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`)
    const body = await res.json() as { data: { venue_lat: null; venue_lng: null } }

    expect(body.data.venue_lat).toBeNull()
    expect(body.data.venue_lng).toBeNull()
  })

  it('includes what_to_bring as empty array when not set', async () => {
    vi.mocked(getEventDetail).mockResolvedValue({
      ...eventDetailResult,
      occurrence: { ...occurrence, what_to_bring: undefined },
    } as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`)
    const body = await res.json() as { data: { what_to_bring: string[] } }

    expect(body.data.what_to_bring).toEqual([])
  })

  it('returns 404 when service throws not-found AppError', async () => {
    vi.mocked(getEventDetail).mockRejectedValue(new AppError('not-found', 404, 'Event not found'))

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`)

    expect(res.status).toBe(404)
  })

  it('calls getEventDetail with undefined requesterId when no auth', async () => {
    vi.mocked(getEventDetail).mockResolvedValue(eventDetailResult as never)

    const app = buildApp()
    await app.request(`/${CONTENT_ID}`)

    expect(getEventDetail).toHaveBeenCalledWith(CONTENT_ID, undefined)
  })

  it('calls getEventDetail with userId when authenticated', async () => {
    mockValidToken()
    vi.mocked(getEventDetail).mockResolvedValue({ ...eventDetailResult, has_rsvpd: true } as never)

    const app = buildApp()
    await app.request(`/${CONTENT_ID}`, { headers: AUTH })

    expect(getEventDetail).toHaveBeenCalledWith(CONTENT_ID, 'user-001')
  })
})

// ─── PUT /:id — update event ───────────────────────────────────────────────

describe('PUT /:id — update event', () => {
  beforeEach(() => { vi.clearAllMocks(); resetRateLimitStore() })

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
    const body = await res.json() as { error: { type: string } }
    expect(body.error.type).toContain('validation-failed')
  })

  it('returns 400 when capacity is below minimum (1)', async () => {
    mockValidToken()
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`, {
      method: 'PUT',
      ...authJson({ capacity: 0 }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 200 with updated event id and timestamp', async () => {
    mockValidToken()
    vi.mocked(updateEvent).mockResolvedValue({
      id: CONTENT_ID,
      updated_at: new Date().toISOString(),
    } as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`, {
      method: 'PUT',
      ...authJson({ title: 'Updated Sunset Hike', capacity: 30 }),
    })

    expect(res.status).toBe(200)
    const body = await res.json() as { success: boolean; data: { id: string } }
    expect(body.success).toBe(true)
    expect(body.data.id).toBe(CONTENT_ID)
  })

  it('returns 403 when user does not own the event', async () => {
    mockValidToken()
    vi.mocked(updateEvent).mockRejectedValue(new AppError('forbidden', 403, 'You do not own this event'))

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}`, {
      method: 'PUT',
      ...authJson({ title: 'Attempt to steal' }),
    })

    expect(res.status).toBe(403)
  })
})

// ─── POST /:id/publish — publish event ────────────────────────────────────

describe('POST /:id/publish — publish event', () => {
  beforeEach(() => { vi.clearAllMocks(); resetRateLimitStore() })

  it('returns 401 without auth', async () => {
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/publish`, {
      method: 'POST',
      ...json({ tnc_accepted: true }),
    })
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

  it('returns 400 when tnc_accepted is missing', async () => {
    mockValidToken()
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/publish`, {
      method: 'POST',
      ...authJson({}),
    })
    expect(res.status).toBe(400)
  })

  it('returns 200 with published event when publish succeeds', async () => {
    mockValidToken()
    vi.mocked(publishEvent).mockResolvedValue({ ...draftEvent, status: 'published' } as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/publish`, {
      method: 'POST',
      ...authJson({ tnc_accepted: true }),
    })

    expect(res.status).toBe(200)
    const body = await res.json() as { success: boolean; data: { status: string } }
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('published')
  })

  it('returns 400 when venue_name is missing (service validation)', async () => {
    mockValidToken()
    vi.mocked(publishEvent).mockRejectedValue(
      new AppError('validation-failed', 400, 'Event cannot be published', [
        { field: 'venue_name', message: 'Venue name is required', code: 'required' },
      ]),
    )

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/publish`, {
      method: 'POST',
      ...authJson({ tnc_accepted: true }),
    })

    expect(res.status).toBe(400)
    const body = await res.json() as { error: { errors: { field: string }[] } }
    expect(body.error.errors?.[0]?.field).toBe('venue_name')
  })

  it('calls publishEvent with correct contentId, userId, tncAccepted', async () => {
    mockValidToken()
    vi.mocked(publishEvent).mockResolvedValue({ ...draftEvent, status: 'published' } as never)

    const app = buildApp()
    await app.request(`/${CONTENT_ID}/publish`, {
      method: 'POST',
      ...authJson({ tnc_accepted: true }),
    })

    expect(publishEvent).toHaveBeenCalledWith(CONTENT_ID, 'user-001', true)
  })
})

// ─── POST /:id/rsvp — RSVP to event ───────────────────────────────────────

describe('POST /:id/rsvp — RSVP to event', () => {
  beforeEach(() => { vi.clearAllMocks(); resetRateLimitStore() })

  const rsvpResult = {
    booking_id: BOOKING_ID,
    event_id: CONTENT_ID,
    status: 'confirmed',
    spots_booked: 4,
  }

  it('returns 401 without auth', async () => {
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/rsvp`, { method: 'POST' })
    expect(res.status).toBe(401)
  })

  it('returns 201 with Location header and booking data on success', async () => {
    mockValidToken()
    vi.mocked(rsvpEvent).mockResolvedValue(rsvpResult as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/rsvp`, { method: 'POST', headers: AUTH })

    expect(res.status).toBe(201)
    expect(res.headers.get('Location')).toBe(`/api/v1/bookings/${BOOKING_ID}`)
    const body = await res.json() as { success: boolean; data: typeof rsvpResult }
    expect(body.success).toBe(true)
    expect(body.data.status).toBe('confirmed')
    expect(body.data.spots_booked).toBe(4)
  })

  it('returns 409 when event is at capacity', async () => {
    mockValidToken()
    vi.mocked(rsvpEvent).mockRejectedValue(
      new AppError('conflict', 409, 'This event is at capacity', [
        { field: 'capacity', message: 'This event is at capacity', code: 'event_full' },
      ]),
    )

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/rsvp`, { method: 'POST', headers: AUTH })

    expect(res.status).toBe(409)
    const body = await res.json() as { error: { errors: { code: string }[] } }
    expect(body.error.errors?.[0]?.code).toBe('event_full')
  })

  it('returns 409 when user has already RSVP\'d', async () => {
    mockValidToken()
    vi.mocked(rsvpEvent).mockRejectedValue(
      new AppError('conflict', 409, 'You have already RSVP\'d to this event', [
        { field: 'user_id', message: 'You have already RSVP\'d to this event', code: 'already_rsvpd' },
      ]),
    )

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/rsvp`, { method: 'POST', headers: AUTH })

    expect(res.status).toBe(409)
    const body = await res.json() as { error: { errors: { code: string }[] } }
    expect(body.error.errors?.[0]?.code).toBe('already_rsvpd')
  })

  it('returns 422 when user tries to RSVP own event', async () => {
    mockValidToken()
    vi.mocked(rsvpEvent).mockRejectedValue(
      new AppError('conflict', 422, 'You cannot RSVP to your own event', [
        { field: 'user_id', message: 'You cannot RSVP to your own event', code: 'own_event' },
      ]),
    )

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/rsvp`, { method: 'POST', headers: AUTH })

    expect(res.status).toBe(422)
    const body = await res.json() as { error: { errors: { code: string }[] } }
    expect(body.error.errors?.[0]?.code).toBe('own_event')
  })

  it('returns 404 when event does not exist or is not published', async () => {
    mockValidToken()
    vi.mocked(rsvpEvent).mockRejectedValue(new AppError('not-found', 404, 'Event not found'))

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/rsvp`, { method: 'POST', headers: AUTH })

    expect(res.status).toBe(404)
  })
})

// ─── DELETE /:id/rsvp — cancel RSVP ───────────────────────────────────────

describe('DELETE /:id/rsvp — cancel RSVP', () => {
  beforeEach(() => { vi.clearAllMocks(); resetRateLimitStore() })

  const cancelResult = {
    event_id: CONTENT_ID,
    spots_booked: 2,
  }

  it('returns 401 without auth', async () => {
    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/rsvp`, { method: 'DELETE' })
    expect(res.status).toBe(401)
  })

  it('returns 200 with updated spots_booked on success', async () => {
    mockValidToken()
    vi.mocked(cancelRsvp).mockResolvedValue(cancelResult as never)

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/rsvp`, { method: 'DELETE', headers: AUTH })

    expect(res.status).toBe(200)
    const body = await res.json() as { success: boolean; data: typeof cancelResult }
    expect(body.success).toBe(true)
    expect(body.data.event_id).toBe(CONTENT_ID)
    expect(body.data.spots_booked).toBe(2)
  })

  it('returns 404 when no RSVP found', async () => {
    mockValidToken()
    vi.mocked(cancelRsvp).mockRejectedValue(new AppError('not-found', 404, 'No RSVP found for this event'))

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/rsvp`, { method: 'DELETE', headers: AUTH })

    expect(res.status).toBe(404)
  })

  it('returns 422 when trying to cancel RSVP for a past event', async () => {
    mockValidToken()
    vi.mocked(cancelRsvp).mockRejectedValue(
      new AppError('unprocessable', 422, 'Cannot cancel RSVP for past events', [
        { field: 'start_at', message: 'Cannot cancel RSVP for past events', code: 'event_past' },
      ]),
    )

    const app = buildApp()
    const res = await app.request(`/${CONTENT_ID}/rsvp`, { method: 'DELETE', headers: AUTH })

    expect(res.status).toBe(422)
    const body = await res.json() as { error: { errors: { code: string }[] } }
    expect(body.error.errors?.[0]?.code).toBe('event_past')
  })
})
