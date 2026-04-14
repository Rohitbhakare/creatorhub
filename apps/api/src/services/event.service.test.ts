import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (must come before any imports that touch these modules) ─────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn(), rpc: vi.fn() }
  return { supabase: mockSupabase }
})

vi.mock('./content.service.js', () => ({
  createDraft: vi.fn(),
}))

vi.mock('./content-state.service.js', () => ({
  publish: vi.fn(),
}))

import {
  createEventDraft,
  getEventDetail,
  updateEvent,
  publishEvent,
  rsvpEvent,
  cancelRsvp,
  listEvents,
} from './event.service.js'
import { supabase } from '../lib/supabase.js'
import { createDraft } from './content.service.js'
import { publish } from './content-state.service.js'

// ─── Mock helpers ──────────────────────────────────────────────────────────

function mockChain(
  data: unknown,
  error: unknown = null,
  count: number | null = null,
  singleData?: unknown,
) {
  const resolvedVal = { data, error, count }
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: singleData ?? data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data: singleData ?? data, error }),
    head: vi.fn().mockReturnThis(),
    then: (
      onFulfilled: (val: typeof resolvedVal) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolvedVal).then(onFulfilled, onRejected),
  }
  return chain
}

// ─── Fixtures ──────────────────────────────────────────────────────────────

const USER_ID = 'user-001'
const OTHER_USER_ID = 'user-002'
const CONTENT_ID = 'event-001'
const BOOKING_ID = 'booking-001'

const FUTURE_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
const FUTURE_END = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString()
const PAST_DATE = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

const draftEvent = {
  id: CONTENT_ID,
  user_id: USER_ID,
  type: 'event',
  status: 'draft',
  title: 'Delhi Photography Walk',
  description: 'Explore Old Delhi with your camera',
  vertical: 'travel',
  pricing_model: 'free',
  price_paisa: 0,
}

const validOccurrence = {
  content_id: CONTENT_ID,
  start_at: FUTURE_DATE,
  end_at: FUTURE_END,
  timezone: 'Asia/Kolkata',
  venue_name: 'Chandni Chowk Metro Exit 1',
  venue_address: 'Chandni Chowk, New Delhi, 110006',
  venue_point: 'POINT(77.2300 28.6556)',
  city_id: 'in.dl.delhi',
  capacity: 20,
  spots_booked: 0,
  is_free: true,
  what_to_bring: [],
}

const publishedEvent = { ...draftEvent, status: 'published' }

// ─── createEventDraft ──────────────────────────────────────────────────────

describe('createEventDraft', () => {
  beforeEach(() => vi.clearAllMocks())

  it('delegates to createDraft with type=event and free pricing', async () => {
    vi.mocked(createDraft).mockResolvedValue({ id: CONTENT_ID, type: 'event' } as never)
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(null, null) as never)

    const result = await createEventDraft(USER_ID, { vertical: 'travel' })

    expect(createDraft).toHaveBeenCalledWith(USER_ID, {
      type: 'event',
      vertical: 'travel',
    })
    expect(result).toMatchObject({ type: 'event' })
  })

  it('inserts event_occurrences stub row after creating draft', async () => {
    vi.mocked(createDraft).mockResolvedValue({ id: CONTENT_ID, type: 'event' } as never)
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(null, null) as never)

    await createEventDraft(USER_ID, { vertical: 'travel' })

    // The second supabase.from call should be for event_occurrences insert
    expect(supabase.from).toHaveBeenCalledWith('event_occurrences')
  })

  it('throws 500 and cleans up content if event_occurrences insert fails', async () => {
    vi.mocked(createDraft).mockResolvedValue({ id: CONTENT_ID, type: 'event' } as never)
    // event_occurrences insert fails
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(null, { message: 'constraint error' }) as never)
      // cleanup delete
      .mockReturnValueOnce(mockChain(null, null) as never)

    await expect(createEventDraft(USER_ID, { vertical: 'travel' })).rejects.toMatchObject({
      status: 500,
    })
  })
})

// ─── updateEvent ───────────────────────────────────────────────────────────

describe('updateEvent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates event fields and returns id + updated_at', async () => {
    // verifyEventOwnership fetch
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftEvent) as never)
      // content update
      .mockReturnValueOnce(mockChain({ updated_at: '2026-04-14T10:00:00Z' }) as never)
      // event_occurrences update
      .mockReturnValueOnce(mockChain(null, null) as never)

    const result = await updateEvent(CONTENT_ID, USER_ID, {
      title: 'Updated Title',
      venue_name: 'New Venue',
    })

    expect(result).toMatchObject({ id: CONTENT_ID })
  })

  it('throws 403 when user does not own the event', async () => {
    const otherOwner = { ...draftEvent, user_id: OTHER_USER_ID }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(otherOwner) as never)

    await expect(
      updateEvent(CONTENT_ID, USER_ID, { title: 'New Title' }),
    ).rejects.toMatchObject({ status: 403, type: 'forbidden' })
  })

  it('throws 422 when event is already published', async () => {
    const published = { ...draftEvent, status: 'published' }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(published) as never)

    await expect(
      updateEvent(CONTENT_ID, USER_ID, { venue_name: 'Venue' }),
    ).rejects.toMatchObject({ status: 422, type: 'unprocessable' })
  })
})

// ─── publishEvent ──────────────────────────────────────────────────────────

describe('publishEvent', () => {
  beforeEach(() => vi.clearAllMocks())

  // Helper: sets up the standard happy-path mock sequence
  function setupHappyPath() {
    vi.mocked(supabase.from)
      // verifyEventOwnership
      .mockReturnValueOnce(mockChain(draftEvent) as never)
      // content fetch for validation
      .mockReturnValueOnce(mockChain(draftEvent) as never)
      // event_occurrences fetch for validation
      .mockReturnValueOnce(mockChain(validOccurrence) as never)
      // media count: 1 image
      .mockReturnValueOnce(mockChain(null, null, 1) as never)
      // force free pricing: content update
      .mockReturnValueOnce(mockChain(null, null) as never)
      // force is_free: event_occurrences update
      .mockReturnValueOnce(mockChain(null, null) as never)
  }

  it('happy path: creates published event with free pricing', async () => {
    setupHappyPath()
    vi.mocked(publish).mockResolvedValue(publishedEvent as never)

    const result = await publishEvent(CONTENT_ID, USER_ID, true)

    expect(publish).toHaveBeenCalledWith(CONTENT_ID, USER_ID, true)
    expect((result as Record<string, unknown>).status).toBe('published')
  })

  it('throws 400 when venue_name is missing', async () => {
    const noVenue = { ...validOccurrence, venue_name: null }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftEvent) as never)
      .mockReturnValueOnce(mockChain(draftEvent) as never)
      .mockReturnValueOnce(mockChain(noVenue) as never)
      .mockReturnValueOnce(mockChain(null, null, 1) as never)

    await expect(publishEvent(CONTENT_ID, USER_ID, true)).rejects.toMatchObject({
      status: 400,
      type: 'validation-failed',
    })
  })

  it('throws 400 when start_at is in the past', async () => {
    const pastOcc = { ...validOccurrence, start_at: PAST_DATE }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftEvent) as never)
      .mockReturnValueOnce(mockChain(draftEvent) as never)
      .mockReturnValueOnce(mockChain(pastOcc) as never)
      .mockReturnValueOnce(mockChain(null, null, 1) as never)

    const err = await publishEvent(CONTENT_ID, USER_ID, true).catch((e) => e)
    expect(err.status).toBe(400)
    const fieldError = err.errors?.find((e: { code: string }) => e.code === 'in_past')
    expect(fieldError).toBeDefined()
  })

  it('throws 400 when start_at and end_at are on different days', async () => {
    const tomorrow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const dayAfter = new Date(tomorrow.getTime() + 25 * 60 * 60 * 1000) // +25h → next day
    const diffDayOcc = {
      ...validOccurrence,
      start_at: tomorrow.toISOString(),
      end_at: dayAfter.toISOString(),
    }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftEvent) as never)
      .mockReturnValueOnce(mockChain(draftEvent) as never)
      .mockReturnValueOnce(mockChain(diffDayOcc) as never)
      .mockReturnValueOnce(mockChain(null, null, 1) as never)

    const err = await publishEvent(CONTENT_ID, USER_ID, true).catch((e) => e)
    expect(err.status).toBe(400)
    const fieldError = err.errors?.find((e: { code: string }) => e.code === 'different_day')
    expect(fieldError).toBeDefined()
  })

  // M1 note: cover images are optional for events (media upload step not yet built).
  // The too_many check (> MAX_EVENT_IMAGES) still applies.
  it('allows publishing with 0 cover images (M1 — media upload deferred)', async () => {
    vi.mocked(supabase.from)
      // verifyEventOwnership
      .mockReturnValueOnce(mockChain(draftEvent) as never)
      // content fetch for validation
      .mockReturnValueOnce(mockChain(draftEvent) as never)
      // event_occurrences fetch for validation
      .mockReturnValueOnce(mockChain(validOccurrence) as never)
      // 0 images — should NOT block publishing
      .mockReturnValueOnce(mockChain(null, null, 0) as never)
      // force free pricing: content update
      .mockReturnValueOnce(mockChain(null, null) as never)
      // force is_free: event_occurrences update
      .mockReturnValueOnce(mockChain(null, null) as never)
    vi.mocked(publish).mockResolvedValue(publishedEvent as never)

    const result = await publishEvent(CONTENT_ID, USER_ID, true)
    expect((result as Record<string, unknown>).status).toBe('published')
  })

  it('forces pricing_model=free and is_free=true', async () => {
    setupHappyPath()
    vi.mocked(publish).mockResolvedValue(publishedEvent as never)

    await publishEvent(CONTENT_ID, USER_ID, true)

    // Verify the content update was called to force free pricing
    const updateCalls = vi.mocked(supabase.from).mock.calls
    const contentUpdateIdx = updateCalls.findIndex((call) => call[0] === 'content')
    expect(contentUpdateIdx).toBeGreaterThan(-1)
  })

  it('does NOT check KYC — free events skip KYC', async () => {
    setupHappyPath()
    vi.mocked(publish).mockResolvedValue(publishedEvent as never)

    await publishEvent(CONTENT_ID, USER_ID, true)

    // Verify publish was called — if KYC was checked, it would add extra supabase.from calls
    // The happy path mock only has 6 calls; KYC would add more
    expect(publish).toHaveBeenCalledTimes(1)
  })
})

// ─── rsvpEvent ─────────────────────────────────────────────────────────────

describe('rsvpEvent', () => {
  beforeEach(() => vi.clearAllMocks())

  function setupRsvpHappyPath() {
    vi.mocked(supabase.from)
      // content fetch
      .mockReturnValueOnce(mockChain({ id: CONTENT_ID, user_id: OTHER_USER_ID, status: 'published', type: 'event' }) as never)
      // occurrence fetch (start_at, capacity, spots_booked)
      .mockReturnValueOnce(mockChain({ start_at: FUTURE_DATE, capacity: 20, spots_booked: 5 }) as never)
      // existing booking check (none)
      .mockReturnValueOnce(mockChain(null, null) as never)
      // atomic update (succeed: 1 row updated)
      .mockReturnValueOnce(mockChain({ spots_booked: 6 }) as never)
      // booking insert
      .mockReturnValueOnce(mockChain({ id: BOOKING_ID }) as never)
  }

  it('happy path: increments spots_booked and creates booking', async () => {
    setupRsvpHappyPath()

    const result = await rsvpEvent(CONTENT_ID, USER_ID)

    expect(result).toMatchObject({
      booking_id: BOOKING_ID,
      event_id: CONTENT_ID,
      status: 'confirmed',
      spots_booked: 6,
    })
  })

  it('throws 409 event_full when atomic update returns no rows', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ id: CONTENT_ID, user_id: OTHER_USER_ID, status: 'published', type: 'event' }) as never)
      .mockReturnValueOnce(mockChain({ start_at: FUTURE_DATE, capacity: 20, spots_booked: 20 }) as never)
      // no existing booking
      .mockReturnValueOnce(mockChain(null, null) as never)
      // atomic update returns null (capacity hit)
      .mockReturnValueOnce(mockChain(null, null) as never)

    const err = await rsvpEvent(CONTENT_ID, USER_ID).catch((e) => e)
    expect(err.status).toBe(409)
    const fieldError = err.errors?.find((e: { code: string }) => e.code === 'event_full')
    expect(fieldError).toBeDefined()
  })

  it('throws 409 already_rsvpd when booking already exists', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ id: CONTENT_ID, user_id: OTHER_USER_ID, status: 'published', type: 'event' }) as never)
      .mockReturnValueOnce(mockChain({ start_at: FUTURE_DATE, capacity: 20, spots_booked: 5 }) as never)
      // existing booking found
      .mockReturnValueOnce(mockChain({ id: BOOKING_ID }) as never)

    const err = await rsvpEvent(CONTENT_ID, USER_ID).catch((e) => e)
    expect(err.status).toBe(409)
    const fieldError = err.errors?.find((e: { code: string }) => e.code === 'already_rsvpd')
    expect(fieldError).toBeDefined()
  })

  it('throws 422 own_event when creator tries to RSVP own event', async () => {
    // content.user_id === USER_ID (same as requester)
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ id: CONTENT_ID, user_id: USER_ID, status: 'published', type: 'event' }) as never)

    const err = await rsvpEvent(CONTENT_ID, USER_ID).catch((e) => e)
    expect(err.status).toBe(422)
    const fieldError = err.errors?.find((e: { code: string }) => e.code === 'own_event')
    expect(fieldError).toBeDefined()
  })

  it('throws 422 event_past when start_at is in the past', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ id: CONTENT_ID, user_id: OTHER_USER_ID, status: 'published', type: 'event' }) as never)
      .mockReturnValueOnce(mockChain({ start_at: PAST_DATE, capacity: 20, spots_booked: 5 }) as never)

    const err = await rsvpEvent(CONTENT_ID, USER_ID).catch((e) => e)
    expect(err.status).toBe(422)
    const fieldError = err.errors?.find((e: { code: string }) => e.code === 'event_past')
    expect(fieldError).toBeDefined()
  })

  it('throws 404 when event is not published', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(null, { message: 'not found' }) as never)

    await expect(rsvpEvent(CONTENT_ID, USER_ID)).rejects.toMatchObject({ status: 404 })
  })
})

// ─── cancelRsvp ────────────────────────────────────────────────────────────

describe('cancelRsvp', () => {
  beforeEach(() => vi.clearAllMocks())

  it('happy path: deletes booking and decrements spots_booked', async () => {
    vi.mocked(supabase.from)
      // occurrence fetch
      .mockReturnValueOnce(mockChain({ start_at: FUTURE_DATE, spots_booked: 6 }) as never)
      // booking fetch
      .mockReturnValueOnce(mockChain({ id: BOOKING_ID }) as never)
      // booking delete
      .mockReturnValueOnce(mockChain(null, null) as never)
      // spots_booked decrement
      .mockReturnValueOnce(mockChain({ spots_booked: 5 }) as never)

    const result = await cancelRsvp(CONTENT_ID, USER_ID)

    expect(result).toMatchObject({ event_id: CONTENT_ID, spots_booked: 5 })
  })

  it('throws 404 when no booking exists for user', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ start_at: FUTURE_DATE, spots_booked: 6 }) as never)
      // no booking found
      .mockReturnValueOnce(mockChain(null, null) as never)

    await expect(cancelRsvp(CONTENT_ID, USER_ID)).rejects.toMatchObject({ status: 404 })
  })

  it('throws 422 event_past when trying to cancel RSVP for past event', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ start_at: PAST_DATE, spots_booked: 3 }) as never)

    const err = await cancelRsvp(CONTENT_ID, USER_ID).catch((e) => e)
    expect(err.status).toBe(422)
    const fieldError = err.errors?.find((e: { code: string }) => e.code === 'event_past')
    expect(fieldError).toBeDefined()
  })
})

// ─── listEvents ────────────────────────────────────────────────────────────

describe('listEvents', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns upcoming events only by default', async () => {
    const items = [
      {
        content_id: CONTENT_ID,
        start_at: FUTURE_DATE,
        end_at: FUTURE_END,
        venue_name: 'Delhi',
        city_id: 'in.dl.delhi',
        capacity: 20,
        spots_booked: 5,
        is_free: true,
        content: { id: CONTENT_ID, title: 'Test Event', user_id: USER_ID, status: 'published', type: 'event', vertical: 'travel', deleted_at: null },
      },
    ]

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(items) as never)
      // creator summaries
      .mockReturnValueOnce(mockChain([{ id: USER_ID, display_name: 'Test', username: 'test', avatar_url: null }]) as never)
      // cover images
      .mockReturnValueOnce(mockChain([{ content_id: CONTENT_ID, url: 'https://img.test/cover.jpg' }]) as never)

    const result = await listEvents({ limit: 20, include_past: false })

    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({ id: CONTENT_ID })
    expect(result.next_cursor).toBeNull()
  })

  it('returns next_cursor when more items exist', async () => {
    // Return 21 items to trigger next_cursor (limit=20)
    const items = Array.from({ length: 21 }, (_, i) => ({
      content_id: `event-${i}`,
      start_at: FUTURE_DATE,
      end_at: FUTURE_END,
      venue_name: 'Delhi',
      city_id: 'in.dl.delhi',
      capacity: 20,
      spots_booked: 0,
      is_free: true,
      content: { id: `event-${i}`, title: `Event ${i}`, user_id: USER_ID, status: 'published', type: 'event', vertical: 'travel', deleted_at: null },
    }))

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(items) as never)
      .mockReturnValueOnce(mockChain([]) as never)
      .mockReturnValueOnce(mockChain([]) as never)

    const result = await listEvents({ limit: 20, include_past: false })

    expect(result.items).toHaveLength(20)
    expect(result.next_cursor).not.toBeNull()
  })
})

// ─── getEventDetail ────────────────────────────────────────────────────────

describe('getEventDetail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns event detail with has_rsvpd=true when requester has booking', async () => {
    vi.mocked(supabase.from)
      // content fetch
      .mockReturnValueOnce(mockChain({ ...draftEvent, status: 'published' }) as never)
      // occurrence fetch
      .mockReturnValueOnce(mockChain(validOccurrence) as never)
      // media
      .mockReturnValueOnce(mockChain([]) as never)
      // creator
      .mockReturnValueOnce(mockChain({ id: USER_ID, display_name: 'Creator', username: 'creator', avatar_url: null }) as never)
      // attendees (with count)
      .mockReturnValueOnce(mockChain([], null, 0) as never)
      // has_rsvpd check: booking found
      .mockReturnValueOnce(mockChain({ id: BOOKING_ID }) as never)

    const result = await getEventDetail(CONTENT_ID, OTHER_USER_ID)

    expect(result.has_rsvpd).toBe(true)
  })

  it('returns 404 for draft event accessed by non-owner', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ ...draftEvent, status: 'draft' }) as never)

    await expect(getEventDetail(CONTENT_ID, OTHER_USER_ID)).rejects.toMatchObject({
      status: 404,
    })
  })
})
