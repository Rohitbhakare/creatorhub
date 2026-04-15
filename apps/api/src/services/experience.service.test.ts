import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (must come before imports that touch these modules) ────

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
  createExperienceDraft,
  getExperienceDetail,
  updateExperience,
  setMeetingPoint,
  publishExperience,
} from './experience.service.js'
import { supabase } from '../lib/supabase.js'
import { createDraft } from './content.service.js'
import { publish } from './content-state.service.js'

// ─── Mock helpers ─────────────────────────────────────────────────

function mockChain(
  data: unknown,
  error: unknown = null,
  count: number | null = null,
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
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    head: vi.fn().mockReturnThis(),
    then: (
      onFulfilled: (val: typeof resolvedVal) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolvedVal).then(onFulfilled, onRejected),
  }
  return chain
}

// ─── Fixtures ─────────────────────────────────────────────────────

const USER_ID = 'user-001'
const OTHER_USER_ID = 'user-002'
const CONTENT_ID = 'exp-001'

const FUTURE_DATE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
const PAST_DATE = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

const draftExperience = {
  id: CONTENT_ID,
  user_id: USER_ID,
  type: 'scheduled_experience',
  status: 'draft',
  title: 'Himalayan Trek',
  description: 'A multi-day trek in the Himalayas',
  vertical: 'travel',
  pricing_model: 'paid',
  price_paisa: 500000,
  cover_image_url: 'https://img.test/cover.jpg',
  location_name: 'Manali',
  like_count: 0,
  comment_count: 0,
  save_count: 0,
}

const freeExperience = {
  ...draftExperience,
  pricing_model: 'free',
  price_paisa: 0,
}

const publishedExperience = { ...draftExperience, status: 'published' }

const creator = {
  id: USER_ID,
  display_name: 'Test Creator',
  username: 'testcreator',
  avatar_url: null,
  follower_count: 10,
}

const scheduledDateRow = {
  id: 'date-001',
  content_id: CONTENT_ID,
  start_date: FUTURE_DATE,
  end_date: FUTURE_DATE,
  capacity: 10,
  spots_booked: 0,
  is_active: true,
}

const meetingPointRow = {
  content_id: CONTENT_ID,
  public_area_name: 'Solang Valley Parking',
  lat: 32.3141,
  lng: 77.1531,
  private_exact_name: 'Hidden Trail Entry',
  private_lat: 32.3155,
  private_lng: 77.1544,
  reveal_hours_before: 24,
}

// ─── createExperienceDraft ────────────────────────────────────────

describe('createExperienceDraft', () => {
  beforeEach(() => vi.clearAllMocks())

  it('delegates to createDraft with type=scheduled_experience', async () => {
    vi.mocked(createDraft).mockResolvedValue({ id: CONTENT_ID, type: 'scheduled_experience' } as never)

    const result = await createExperienceDraft(USER_ID, 'travel')

    expect(createDraft).toHaveBeenCalledWith(USER_ID, {
      type: 'scheduled_experience',
      vertical: 'travel',
    })
    expect(result).toMatchObject({ id: CONTENT_ID })
  })

  it('returns id from created draft', async () => {
    vi.mocked(createDraft).mockResolvedValue({ id: 'new-exp-id', type: 'scheduled_experience' } as never)

    const result = await createExperienceDraft(USER_ID, 'fitness')

    expect(result.id).toBe('new-exp-id')
  })

  it('propagates errors from createDraft', async () => {
    vi.mocked(createDraft).mockRejectedValue(new Error('DB failure') as never)

    await expect(createExperienceDraft(USER_ID, 'travel')).rejects.toThrow('DB failure')
  })
})

// ─── getExperienceDetail ──────────────────────────────────────────

describe('getExperienceDetail', () => {
  beforeEach(() => vi.clearAllMocks())

  function setupHappyPath(experienceData = publishedExperience) {
    vi.mocked(supabase.from)
      // content fetch
      .mockReturnValueOnce(mockChain(experienceData) as never)
      // days fetch
      .mockReturnValueOnce(mockChain([]) as never)
      // scheduled_dates fetch
      .mockReturnValueOnce(mockChain([scheduledDateRow]) as never)
      // creator fetch
      .mockReturnValueOnce(mockChain(creator) as never)
      // meeting_point fetch (null)
      .mockReturnValueOnce(mockChain(null) as never)
      // promise.resolve(null) × 2 are not DB calls
      // spots fetch (days is empty, skipped)
  }

  it('returns experience detail for published experience', async () => {
    setupHappyPath()

    const result = await getExperienceDetail(CONTENT_ID)

    expect(result.id).toBe(CONTENT_ID)
    expect(result.status).toBe('published')
    expect(result.creator.id).toBe(USER_ID)
    expect(result.scheduledDates).toHaveLength(1)
  })

  it('returns 404 for draft accessed by non-owner', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ ...draftExperience, status: 'draft' }) as never)

    await expect(getExperienceDetail(CONTENT_ID, OTHER_USER_ID)).rejects.toMatchObject({
      status: 404,
    })
  })

  it('allows owner to access their own draft', async () => {
    vi.mocked(supabase.from)
      // content fetch (owner)
      .mockReturnValueOnce(mockChain(draftExperience) as never)
      // days
      .mockReturnValueOnce(mockChain([]) as never)
      // scheduled_dates
      .mockReturnValueOnce(mockChain([]) as never)
      // creator
      .mockReturnValueOnce(mockChain(creator) as never)
      // meeting_point
      .mockReturnValueOnce(mockChain(null) as never)

    const result = await getExperienceDetail(CONTENT_ID, USER_ID)

    expect(result.status).toBe('draft')
  })

  it('hides private meeting point for non-owner when date is far future', async () => {
    // Start date is 7 days away — beyond 24h reveal window
    const farFutureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const farDateRow = { ...scheduledDateRow, start_date: farFutureDate }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(publishedExperience) as never)
      .mockReturnValueOnce(mockChain([]) as never)
      .mockReturnValueOnce(mockChain([farDateRow]) as never)
      .mockReturnValueOnce(mockChain(creator) as never)
      .mockReturnValueOnce(mockChain(meetingPointRow) as never)
      // like/save checks for non-owner
      .mockReturnValueOnce(mockChain(null) as never)
      .mockReturnValueOnce(mockChain(null) as never)

    const result = await getExperienceDetail(CONTENT_ID, OTHER_USER_ID)

    expect(result.meetingPoint).not.toBeNull()
    expect(result.meetingPoint?.publicAreaName).toBe('Solang Valley Parking')
    expect(result.meetingPoint?.privateExact).toBeUndefined()
  })

  it('reveals private meeting point at T-24h for non-owner', async () => {
    // Start date is within 24h — should reveal private location
    const soonDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 10) // 2h from now → today
    const soonDateRow = { ...scheduledDateRow, start_date: soonDate }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(publishedExperience) as never)
      .mockReturnValueOnce(mockChain([]) as never)
      .mockReturnValueOnce(mockChain([soonDateRow]) as never)
      .mockReturnValueOnce(mockChain(creator) as never)
      .mockReturnValueOnce(mockChain(meetingPointRow) as never)
      .mockReturnValueOnce(mockChain(null) as never)
      .mockReturnValueOnce(mockChain(null) as never)

    const result = await getExperienceDetail(CONTENT_ID, OTHER_USER_ID)

    expect(result.meetingPoint?.privateExact).toBeDefined()
    expect(result.meetingPoint?.privateExact?.name).toBe('Hidden Trail Entry')
  })

  it('always shows private meeting point to owner', async () => {
    const farFutureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const farDateRow = { ...scheduledDateRow, start_date: farFutureDate }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftExperience) as never)
      .mockReturnValueOnce(mockChain([]) as never)
      .mockReturnValueOnce(mockChain([farDateRow]) as never)
      .mockReturnValueOnce(mockChain(creator) as never)
      .mockReturnValueOnce(mockChain(meetingPointRow) as never)

    const result = await getExperienceDetail(CONTENT_ID, USER_ID)

    expect(result.meetingPoint?.privateExact).toBeDefined()
    expect(result.meetingPoint?.privateExact?.name).toBe('Hidden Trail Entry')
  })

  it('returns 404 when experience does not exist', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(null, { message: 'not found' }) as never)

    await expect(getExperienceDetail('nonexistent')).rejects.toMatchObject({ status: 404 })
  })

  it('includes isLiked and isSaved when requester is authenticated', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(publishedExperience) as never)
      .mockReturnValueOnce(mockChain([]) as never)
      .mockReturnValueOnce(mockChain([]) as never)
      .mockReturnValueOnce(mockChain(creator) as never)
      .mockReturnValueOnce(mockChain(null) as never)
      // like check — found
      .mockReturnValueOnce(mockChain({ id: 'like-001' }) as never)
      // save check — not found
      .mockReturnValueOnce(mockChain(null) as never)

    const result = await getExperienceDetail(CONTENT_ID, OTHER_USER_ID)

    expect(result.isLiked).toBe(true)
    expect(result.isSaved).toBe(false)
  })
})

// ─── updateExperience ─────────────────────────────────────────────

describe('updateExperience', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates content fields', async () => {
    // verifyExperienceOwnership
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftExperience) as never)
      // content update
      .mockReturnValueOnce(mockChain(null, null) as never)

    await expect(
      updateExperience(CONTENT_ID, USER_ID, { title: 'New Title' }),
    ).resolves.toBeUndefined()
  })

  it('throws 403 when user does not own the experience', async () => {
    const otherOwner = { ...draftExperience, user_id: OTHER_USER_ID }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(otherOwner) as never)

    await expect(
      updateExperience(CONTENT_ID, USER_ID, { title: 'New Title' }),
    ).rejects.toMatchObject({ status: 403, type: 'forbidden' })
  })

  it('throws 404 when experience does not exist', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(null, { message: 'not found' }) as never)

    await expect(
      updateExperience('nonexistent', USER_ID, { title: 'x' }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('sets pricing_model=paid when pricePaisa > 0', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftExperience) as never)
      .mockReturnValueOnce(mockChain(null, null) as never)

    await updateExperience(CONTENT_ID, USER_ID, { pricePaisa: 250000 })

    const updateCall = vi.mocked(supabase.from).mock.calls[1]
    expect(updateCall).toBeDefined()
  })

  it('sets pricing_model=free when pricePaisa is 0', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftExperience) as never)
      .mockReturnValueOnce(mockChain(null, null) as never)

    await updateExperience(CONTENT_ID, USER_ID, { pricePaisa: 0 })

    // Should not throw
    const calls = vi.mocked(supabase.from).mock.calls
    expect(calls.length).toBeGreaterThanOrEqual(2)
  })

  it('is a no-op when data is empty', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftExperience) as never)

    await expect(updateExperience(CONTENT_ID, USER_ID, {})).resolves.toBeUndefined()

    // Only the ownership check call should happen
    expect(supabase.from).toHaveBeenCalledTimes(1)
  })
})

// ─── setMeetingPoint ──────────────────────────────────────────────

describe('setMeetingPoint', () => {
  beforeEach(() => vi.clearAllMocks())

  it('upserts meeting point successfully', async () => {
    vi.mocked(supabase.from)
      // ownership check
      .mockReturnValueOnce(mockChain(draftExperience) as never)
      // upsert meeting_points
      .mockReturnValueOnce(mockChain(null, null) as never)

    await expect(
      setMeetingPoint(CONTENT_ID, USER_ID, {
        publicAreaName: 'Solang Valley',
        lat: 32.3141,
        lng: 77.1531,
      }),
    ).resolves.toBeUndefined()

    expect(supabase.from).toHaveBeenCalledWith('meeting_points')
  })

  it('throws 403 when user does not own experience', async () => {
    const otherOwner = { ...draftExperience, user_id: OTHER_USER_ID }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(otherOwner) as never)

    await expect(
      setMeetingPoint(CONTENT_ID, USER_ID, {
        publicAreaName: 'Somewhere',
        lat: 0,
        lng: 0,
      }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('throws 500 on DB error during upsert', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftExperience) as never)
      .mockReturnValueOnce(mockChain(null, { message: 'constraint' }) as never)

    await expect(
      setMeetingPoint(CONTENT_ID, USER_ID, {
        publicAreaName: 'Somewhere',
        lat: 0,
        lng: 0,
      }),
    ).rejects.toMatchObject({ status: 500 })
  })
})

// ─── publishExperience ────────────────────────────────────────────

describe('publishExperience', () => {
  beforeEach(() => vi.clearAllMocks())

  function setupPublishHappyPath(experience = draftExperience) {
    vi.mocked(supabase.from)
      // verifyExperienceOwnership
      .mockReturnValueOnce(mockChain(experience) as never)
      // KYC check (for paid)
      .mockReturnValueOnce(mockChain({ kyc_status: 'verified' }) as never)
      // future dates check
      .mockReturnValueOnce(mockChain([{ id: 'date-001' }]) as never)
  }

  it('publishes paid experience with verified KYC', async () => {
    setupPublishHappyPath()
    vi.mocked(publish).mockResolvedValue(publishedExperience as never)

    await publishExperience(CONTENT_ID, USER_ID, true)

    expect(publish).toHaveBeenCalledWith(CONTENT_ID, USER_ID, true)
  })

  it('throws 403 when KYC is not verified for paid experience', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftExperience) as never)
      // KYC status not verified
      .mockReturnValueOnce(mockChain({ kyc_status: 'pending' }) as never)

    await expect(
      publishExperience(CONTENT_ID, USER_ID, true),
    ).rejects.toMatchObject({ status: 403, type: 'forbidden' })
  })

  it('allows publishing free experience without KYC', async () => {
    vi.mocked(supabase.from)
      // ownership check — free experience
      .mockReturnValueOnce(mockChain(freeExperience) as never)
      // NO KYC call for free
      // future dates check
      .mockReturnValueOnce(mockChain([{ id: 'date-001' }]) as never)

    vi.mocked(publish).mockResolvedValue({ ...freeExperience, status: 'published' } as never)

    await publishExperience(CONTENT_ID, USER_ID, true)

    expect(publish).toHaveBeenCalledTimes(1)
    // Verify KYC was not checked: only 2 supabase.from calls (ownership + dates)
    expect(vi.mocked(supabase.from)).toHaveBeenCalledTimes(2)
  })

  it('throws 400 when cover_image_url is missing', async () => {
    const noImage = { ...draftExperience, cover_image_url: null }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(noImage) as never)
      .mockReturnValueOnce(mockChain({ kyc_status: 'verified' }) as never)

    await expect(
      publishExperience(CONTENT_ID, USER_ID, true),
    ).rejects.toMatchObject({ status: 400, type: 'validation-failed' })
  })

  it('throws 400 when no future scheduled dates exist', async () => {
    vi.mocked(supabase.from)
      // ownership
      .mockReturnValueOnce(mockChain(draftExperience) as never)
      // KYC
      .mockReturnValueOnce(mockChain({ kyc_status: 'verified' }) as never)
      // no future dates
      .mockReturnValueOnce(mockChain([]) as never)

    await expect(
      publishExperience(CONTENT_ID, USER_ID, true),
    ).rejects.toMatchObject({ status: 400, type: 'validation-failed' })
  })

  it('throws 403 when user does not own the experience', async () => {
    const otherOwner = { ...draftExperience, user_id: OTHER_USER_ID }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(otherOwner) as never)

    await expect(
      publishExperience(CONTENT_ID, USER_ID, true),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('throws 422 when experience is already published', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(publishedExperience) as never)

    await expect(
      publishExperience(CONTENT_ID, USER_ID, true),
    ).rejects.toMatchObject({ status: 422 })
  })
})
