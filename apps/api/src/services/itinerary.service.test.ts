import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (must come before any imports that touch these modules) ─────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn(), rpc: vi.fn() }
  return { supabase: mockSupabase }
})

vi.mock('./content-state.service.js', () => ({
  publish: vi.fn(),
}))

import {
  createItineraryDraft,
  getItineraryDetail,
  addDay,
  removeDay,
  addSpot,
  computeDayStats,
  setDayCount,
} from './itinerary.service.js'
import { supabase } from '../lib/supabase.js'
import { publish } from './content-state.service.js'

// ─── Mock helpers ──────────────────────────────────────────────────────────

/**
 * Returns a chainable Supabase mock that:
 *  - resolves via .single()     to { data, error }
 *  - resolves via direct await  to { data, error, count }
 */
function mockChain(data: unknown, error: unknown = null, count: number | null = null) {
  const resolvedVal = { data, error, count }
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    // Thenable — makes `await chain` resolve to resolvedVal
    then: (
      onFulfilled: (val: typeof resolvedVal) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolvedVal).then(onFulfilled, onRejected),
  }
  return chain
}

const USER_ID = 'user-001'
const OTHER_USER_ID = 'user-999'
const CONTENT_ID = 'content-001'
const DAY_ID = 'day-001'
const SPOT_ID = 'spot-001'

const draftItineraryContent = {
  id: CONTENT_ID,
  user_id: USER_ID,
  type: 'self_paced_itinerary',
  status: 'draft',
  title: 'Bali in 5 Days',
  vertical: 'travel',
  pricing_model: 'free',
  price_paisa: 0,
  deleted_at: null,
}

const paidItineraryContent = {
  ...draftItineraryContent,
  status: 'published',
  pricing_model: 'paid',
}

// ─── createItineraryDraft ──────────────────────────────────────────────────

describe('createItineraryDraft', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates content row and day_count empty day rows', async () => {
    // Call 1: content insert → new content row
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftItineraryContent) as never)
      // Call 2: itinerary_days insert → success
      .mockReturnValueOnce(mockChain(null, null) as never)

    const result = await createItineraryDraft(USER_ID, {
      vertical: 'travel',
      day_count: 3,
    })

    expect(result).toMatchObject({ type: 'self_paced_itinerary' })
    // Verify days insert was called
    expect(vi.mocked(supabase.from)).toHaveBeenCalledTimes(2)
  })

  it('defaults to 1 day when day_count is not provided', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftItineraryContent) as never)
      .mockReturnValueOnce(mockChain(null, null) as never)

    await createItineraryDraft(USER_ID, { vertical: 'travel', day_count: 1 })

    // Second from() call is the day insert
    expect(vi.mocked(supabase.from)).toHaveBeenCalledTimes(2)
  })

  it('throws 500 when content insert fails', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(null, { message: 'insert failed' }) as never,
    )

    await expect(
      createItineraryDraft(USER_ID, { vertical: 'travel', day_count: 1 }),
    ).rejects.toMatchObject({ status: 500, type: 'db-error' })
  })

  it('throws 500 when day insert fails', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftItineraryContent) as never)
      .mockReturnValueOnce(mockChain(null, { message: 'day insert failed' }) as never)

    await expect(
      createItineraryDraft(USER_ID, { vertical: 'travel', day_count: 2 }),
    ).rejects.toMatchObject({ status: 500, type: 'db-error' })
  })
})

// ─── getItineraryDetail ────────────────────────────────────────────────────

describe('getItineraryDetail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 404 when content not found', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(null, { message: 'not found' }) as never,
    )

    await expect(getItineraryDetail(CONTENT_ID)).rejects.toMatchObject({
      status: 404,
      type: 'not-found',
    })
  })

  it('throws 404 when content type is not self_paced_itinerary', async () => {
    const postContent = { ...draftItineraryContent, type: 'post' }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(postContent) as never)

    await expect(getItineraryDetail(CONTENT_ID)).rejects.toMatchObject({
      status: 404,
      type: 'not-found',
    })
  })

  it('throws 404 when non-owner tries to view a draft itinerary', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(draftItineraryContent) as never, // status='draft', not published
    )

    await expect(getItineraryDetail(CONTENT_ID, OTHER_USER_ID)).rejects.toMatchObject({
      status: 404,
    })
  })

  it('free preview gating: non-owner of paid itinerary sees only is_free_preview=true spots', async () => {
    // Call 1: content fetch → published paid itinerary
    // Call 2: itinerary_days → [day1, day2]
    // Call 3: itinerary_spots → spots for those days
    // Call 4: rpc('extract_spot_coords') → coords
    // Call 5: content_media → []
    // Call 6: users (creator) → creator row

    const day1 = { id: 'day-1', content_id: CONTENT_ID, day_number: 1 }
    const day2 = { id: 'day-2', content_id: CONTENT_ID, day_number: 2 }

    const freeSpot = { id: 'spot-1', itinerary_day_id: 'day-1', spot_order: 0, is_free_preview: true }
    const paidSpot = { id: 'spot-2', itinerary_day_id: 'day-2', spot_order: 0, is_free_preview: false }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(paidItineraryContent) as never)   // content
      .mockReturnValueOnce(mockChain([day1, day2]) as never)            // days
      .mockReturnValueOnce(mockChain([freeSpot, paidSpot]) as never)    // spots
      .mockReturnValueOnce(mockChain([]) as never)                       // content_media
      .mockReturnValueOnce(mockChain({ id: USER_ID, display_name: 'Creator', username: 'creator', avatar_url: null }) as never) // users

    // RPC for extract_spot_coords — return error so it falls back to inline parsing
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: { message: 'rpc not available' } } as never)

    const result = await getItineraryDetail(CONTENT_ID, OTHER_USER_ID)

    // Only Day 1 spots (is_free_preview=true) should be visible
    const allSpots = result.days.flatMap((d) => (d as Record<string, unknown>).spots as unknown[])
    expect(allSpots).toHaveLength(1)
    expect((allSpots[0] as Record<string, unknown>).id).toBe('spot-1')
  })

  it('owner sees all spots including non-preview ones', async () => {
    const day1 = { id: 'day-1', content_id: CONTENT_ID, day_number: 1 }
    const day2 = { id: 'day-2', content_id: CONTENT_ID, day_number: 2 }

    const freeSpot = { id: 'spot-1', itinerary_day_id: 'day-1', spot_order: 0, is_free_preview: true }
    const paidSpot = { id: 'spot-2', itinerary_day_id: 'day-2', spot_order: 0, is_free_preview: false }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(paidItineraryContent) as never)
      .mockReturnValueOnce(mockChain([day1, day2]) as never)
      .mockReturnValueOnce(mockChain([freeSpot, paidSpot]) as never)
      .mockReturnValueOnce(mockChain([]) as never)
      .mockReturnValueOnce(mockChain({ id: USER_ID, display_name: 'Creator', username: 'creator', avatar_url: null }) as never)

    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: { message: 'rpc not available' } } as never)

    const result = await getItineraryDetail(CONTENT_ID, USER_ID) // owner

    const allSpots = result.days.flatMap((d) => (d as Record<string, unknown>).spots as unknown[])
    expect(allSpots).toHaveLength(2) // Owner sees both spots
  })
})

// ─── Ownership chain (3-level: spot → day → content → user) ───────────────

describe('ownership chain verification', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('addDay', () => {
    it('throws 403 when user does not own the content (verifyContentOwnership)', async () => {
      // verifyContentOwnership: content.user_id !== userId
      const otherUserContent = { ...draftItineraryContent, user_id: OTHER_USER_ID }
      vi.mocked(supabase.from).mockReturnValueOnce(mockChain(otherUserContent) as never)

      await expect(addDay(CONTENT_ID, USER_ID)).rejects.toMatchObject({
        status: 403,
        type: 'forbidden',
      })
    })

    it('throws 422 when itinerary is not a draft', async () => {
      const publishedContent = { ...draftItineraryContent, status: 'published' }
      vi.mocked(supabase.from).mockReturnValueOnce(mockChain(publishedContent) as never)

      await expect(addDay(CONTENT_ID, USER_ID)).rejects.toMatchObject({
        status: 422,
        type: 'unprocessable',
      })
    })
  })

  describe('removeDay', () => {
    it('throws 404 when day not found (first level: day ownership)', async () => {
      // verifyDayOwnership: day lookup fails
      vi.mocked(supabase.from).mockReturnValueOnce(
        mockChain(null, { message: 'not found' }) as never,
      )

      await expect(removeDay(DAY_ID, CONTENT_ID, USER_ID)).rejects.toMatchObject({
        status: 404,
        type: 'not-found',
      })
    })

    it('throws 403 when user does not own the content (second level: content ownership)', async () => {
      // Day found, but content owner is different user
      const day = { id: DAY_ID, content_id: CONTENT_ID, day_number: 2 }
      const otherUserContent = { ...draftItineraryContent, user_id: OTHER_USER_ID }

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockChain(day) as never)         // day lookup — OK
        .mockReturnValueOnce(mockChain(otherUserContent) as never) // content lookup — wrong owner

      await expect(removeDay(DAY_ID, CONTENT_ID, USER_ID)).rejects.toMatchObject({
        status: 403,
        type: 'forbidden',
      })
    })

    it('calls renumber_itinerary_days RPC after successful delete', async () => {
      const day = { id: DAY_ID, content_id: CONTENT_ID, day_number: 2 }

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockChain(day) as never)                   // itinerary_days fetch
        .mockReturnValueOnce(mockChain(draftItineraryContent) as never) // content ownership
        .mockReturnValueOnce(mockChain(null, null) as never)            // delete

      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: null, error: null } as never)

      await removeDay(DAY_ID, CONTENT_ID, USER_ID)

      expect(supabase.rpc).toHaveBeenCalledWith('renumber_itinerary_days', {
        p_content_id: CONTENT_ID,
        p_deleted_day_number: 2,
      })
    })
  })
})

// ─── addSpot ───────────────────────────────────────────────────────────────

describe('addSpot', () => {
  beforeEach(() => vi.clearAllMocks())

  const spotInput = {
    name: 'Tanah Lot Temple',
    lat: -8.6215,
    lng: 115.0865,
    google_place_id: 'ChIJxyz',
    stop_type: 'viewpoint' as const,
    duration_minutes: 60,
  }

  it('calls insert_itinerary_spot RPC with PostGIS coordinates', async () => {
    const day = { id: DAY_ID, content_id: CONTENT_ID, day_number: 2 }
    const newSpot = { id: SPOT_ID, itinerary_day_id: DAY_ID, spot_order: 0 }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(day) as never)                   // day ownership
      .mockReturnValueOnce(mockChain(draftItineraryContent) as never) // content ownership
      .mockReturnValueOnce(mockChain([]) as never)                     // existing spots (empty)

    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [newSpot], error: null } as never)

    await addSpot(DAY_ID, CONTENT_ID, USER_ID, spotInput)

    expect(supabase.rpc).toHaveBeenCalledWith('insert_itinerary_spot', expect.objectContaining({
      p_itinerary_day_id: DAY_ID,
      p_lat: spotInput.lat,
      p_lng: spotInput.lng,
      p_name: spotInput.name,
    }))
  })

  it('sets is_free_preview=true for Day 1 spots', async () => {
    const day1 = { id: DAY_ID, content_id: CONTENT_ID, day_number: 1 } // Day 1
    const newSpot = { id: SPOT_ID, itinerary_day_id: DAY_ID, spot_order: 0 }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(day1) as never)
      .mockReturnValueOnce(mockChain(draftItineraryContent) as never)
      .mockReturnValueOnce(mockChain([]) as never)

    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [newSpot], error: null } as never)

    await addSpot(DAY_ID, CONTENT_ID, USER_ID, spotInput)

    expect(supabase.rpc).toHaveBeenCalledWith('insert_itinerary_spot', expect.objectContaining({
      p_is_free_preview: true,
    }))
  })

  it('sets is_free_preview=false for Day 2+ spots', async () => {
    const day2 = { id: DAY_ID, content_id: CONTENT_ID, day_number: 2 } // Day 2
    const newSpot = { id: SPOT_ID, itinerary_day_id: DAY_ID, spot_order: 0 }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(day2) as never)
      .mockReturnValueOnce(mockChain(draftItineraryContent) as never)
      .mockReturnValueOnce(mockChain([]) as never)

    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [newSpot], error: null } as never)

    await addSpot(DAY_ID, CONTENT_ID, USER_ID, spotInput)

    expect(supabase.rpc).toHaveBeenCalledWith('insert_itinerary_spot', expect.objectContaining({
      p_is_free_preview: false,
    }))
  })

  it('throws 400 when max spots per day exceeded', async () => {
    const day = { id: DAY_ID, content_id: CONTENT_ID, day_number: 1 }
    // 20 existing spots (MAX_SPOTS_PER_DAY = 20, order goes 0..19)
    const fullDaySpots = [{ spot_order: 19 }]

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(day) as never)
      .mockReturnValueOnce(mockChain(draftItineraryContent) as never)
      .mockReturnValueOnce(mockChain(fullDaySpots) as never)

    await expect(addSpot(DAY_ID, CONTENT_ID, USER_ID, spotInput)).rejects.toMatchObject({
      status: 400,
      type: 'validation-failed',
    })
  })
})

// ─── computeDayStats ───────────────────────────────────────────────────────

describe('computeDayStats', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls compute_day_stats RPC and updates day with distance and duration', async () => {
    const day = { id: DAY_ID, content_id: CONTENT_ID, day_number: 1 }
    const updatedDay = { ...day, total_distance_km: 12.5, estimated_hours: 4.0 }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(day) as never)                   // day ownership
      .mockReturnValueOnce(mockChain(draftItineraryContent) as never) // content ownership
      .mockReturnValueOnce(mockChain(updatedDay) as never)            // update day stats

    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [{ total_distance_km: 12.5, estimated_hours: 4.0 }],
      error: null,
    } as never)

    const result = await computeDayStats(DAY_ID, CONTENT_ID, USER_ID)

    expect(supabase.rpc).toHaveBeenCalledWith('compute_day_stats', { p_day_id: DAY_ID })
    expect((result as Record<string, unknown>).total_distance_km).toBe(12.5)
    expect((result as Record<string, unknown>).estimated_hours).toBe(4.0)
  })

  it('throws 500 when compute_day_stats RPC fails', async () => {
    const day = { id: DAY_ID, content_id: CONTENT_ID, day_number: 1 }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(day) as never)
      .mockReturnValueOnce(mockChain(draftItineraryContent) as never)

    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'function not found' },
    } as never)

    await expect(computeDayStats(DAY_ID, CONTENT_ID, USER_ID)).rejects.toMatchObject({
      status: 500,
      type: 'db-error',
    })
  })
})

// ─── allowedTypes / cross-type guard ───────────────────────────────────────
// E2.x Experience day-plan reuses this service with
// allowedTypes=['scheduled_experience']. The default still rejects
// anything other than self_paced_itinerary.

describe('allowedTypes guard', () => {
  beforeEach(() => vi.clearAllMocks())

  const draftExperienceContent = {
    ...draftItineraryContent,
    type: 'scheduled_experience',
  }

  it('rejects a scheduled_experience row under default (itinerary-only) allowedTypes', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(draftExperienceContent) as never,
    )

    await expect(addDay(CONTENT_ID, USER_ID)).rejects.toMatchObject({
      status: 422,
      type: 'unprocessable',
    })
  })

  it('accepts a scheduled_experience row when allowedTypes includes it', async () => {
    const newDay = { id: DAY_ID, content_id: CONTENT_ID, day_number: 1 }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftExperienceContent) as never) // content ownership
      .mockReturnValueOnce(mockChain([]) as never) // current max day_number lookup → 0
      .mockReturnValueOnce(mockChain(newDay) as never) // insert

    const result = await addDay(CONTENT_ID, USER_ID, {
      allowedTypes: ['scheduled_experience'],
    })

    expect(result).toMatchObject({ id: DAY_ID, day_number: 1 })
  })

  it('setDayCount on an experience draft grows the day set', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftExperienceContent) as never) // ownership
      .mockReturnValueOnce(mockChain([]) as never) // current days (empty)
      .mockReturnValueOnce(mockChain(null, null) as never) // insert new days

    await expect(
      setDayCount(CONTENT_ID, USER_ID, 3, { allowedTypes: ['scheduled_experience'] }),
    ).resolves.toBeUndefined()
  })

  it('setDayCount rejects an experience draft under default allowedTypes', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(draftExperienceContent) as never,
    )

    await expect(setDayCount(CONTENT_ID, USER_ID, 3)).rejects.toMatchObject({
      status: 422,
      type: 'unprocessable',
    })
  })
})
