import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn() }
  return { supabase: mockSupabase }
})

import {
  submitReview,
  submitCreatorResponse,
  getReview,
  listContentReviews,
  revealDueReviews,
} from './review.service.js'
import { supabase } from '../lib/supabase.js'

// ─── Mock helpers ──────────────────────────────────────────────────

function mockChain(
  data: unknown,
  error: unknown = null,
  singleData?: unknown,
) {
  const resolvedVal = { data, error, count: null }
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: singleData ?? data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data: singleData ?? data, error }),
    then: (
      onFulfilled: (val: typeof resolvedVal) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolvedVal).then(onFulfilled, onRejected),
  }
  return chain
}

// ─── Fixtures ──────────────────────────────────────────────────────

const REVIEWER_ID = 'user-reviewer-001'
const CREATOR_ID = 'user-creator-002'
const OTHER_USER_ID = 'user-other-003'
const BOOKING_ID = 'booking-001'
const CONTENT_ID = 'content-001'
const REVIEW_ID = 'review-001'

const completedBooking = {
  id: BOOKING_ID,
  user_id: REVIEWER_ID,
  content_id: CONTENT_ID,
  creator_id: CREATOR_ID,
  status: 'completed',
}

const reviewRow = {
  id: REVIEW_ID,
  booking_id: BOOKING_ID,
  content_id: CONTENT_ID,
  reviewer_id: REVIEWER_ID,
  creator_id: CREATOR_ID,
  rating: 4,
  reviewer_text: 'Great experience!',
  creator_response: 'Thank you!',
  is_revealed: true,
  revealed_at: '2026-04-01T10:00:00Z',
  created_at: '2026-03-18T10:00:00Z',
  reviewer: {
    id: REVIEWER_ID,
    display_name: 'Aarav Shah',
    avatar_url: null,
    username: 'aarav',
  },
}

const unrevealedReviewRow = {
  ...reviewRow,
  is_revealed: false,
  revealed_at: '2026-05-01T10:00:00Z',
}

// ─── submitReview ──────────────────────────────────────────────────

describe('submitReview', () => {
  beforeEach(() => vi.clearAllMocks())

  it('happy path: creates review and returns id', async () => {
    vi.mocked(supabase.from)
      // booking fetch
      .mockReturnValueOnce(mockChain(completedBooking) as never)
      // existing review check (none)
      .mockReturnValueOnce(mockChain(null) as never)
      // insert review
      .mockReturnValueOnce(mockChain({ id: REVIEW_ID }) as never)

    const result = await submitReview(REVIEWER_ID, BOOKING_ID, 4, 'Great experience!')

    expect(result).toEqual({ id: REVIEW_ID })
  })

  it('throws 404 when booking not found', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(null) as never)

    await expect(
      submitReview(REVIEWER_ID, BOOKING_ID, 4, 'Great!'),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('throws 403 when reviewer does not own the booking', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(
        mockChain({ ...completedBooking, user_id: OTHER_USER_ID }) as never,
      )

    await expect(
      submitReview(REVIEWER_ID, BOOKING_ID, 4, 'Great!'),
    ).rejects.toMatchObject({ status: 403, type: 'forbidden' })
  })

  it('throws 422 booking_not_completed when booking is not completed', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(
        mockChain({ ...completedBooking, status: 'confirmed' }) as never,
      )

    const err = await submitReview(REVIEWER_ID, BOOKING_ID, 4, 'Great!').catch((e) => e)
    expect(err.status).toBe(422)
    const fieldError = err.errors?.find(
      (e: { code: string }) => e.code === 'booking_not_completed',
    )
    expect(fieldError).toBeDefined()
  })

  it('throws 409 review_exists when review already submitted', async () => {
    vi.mocked(supabase.from)
      // booking fetch
      .mockReturnValueOnce(mockChain(completedBooking) as never)
      // existing review found
      .mockReturnValueOnce(mockChain({ id: REVIEW_ID }) as never)

    const err = await submitReview(REVIEWER_ID, BOOKING_ID, 4, 'Great!').catch((e) => e)
    expect(err.status).toBe(409)
    const fieldError = err.errors?.find(
      (e: { code: string }) => e.code === 'review_exists',
    )
    expect(fieldError).toBeDefined()
  })

  it('throws 500 on db insert error', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(completedBooking) as never)
      .mockReturnValueOnce(mockChain(null) as never)
      // insert fails
      .mockReturnValueOnce(mockChain(null, { message: 'constraint error' }) as never)

    await expect(
      submitReview(REVIEWER_ID, BOOKING_ID, 4, 'Great!'),
    ).rejects.toMatchObject({ status: 500 })
  })
})

// ─── submitCreatorResponse ─────────────────────────────────────────

describe('submitCreatorResponse', () => {
  beforeEach(() => vi.clearAllMocks())

  it('happy path: updates creator_response', async () => {
    vi.mocked(supabase.from)
      // review fetch (no existing response)
      .mockReturnValueOnce(
        mockChain({
          id: REVIEW_ID,
          creator_id: CREATOR_ID,
          creator_response: null,
        }) as never,
      )
      // update
      .mockReturnValueOnce(mockChain(null) as never)

    await expect(
      submitCreatorResponse(CREATOR_ID, REVIEW_ID, 'Thank you!'),
    ).resolves.toBeUndefined()
  })

  it('throws 404 when review not found', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(null) as never)

    await expect(
      submitCreatorResponse(CREATOR_ID, REVIEW_ID, 'Thanks!'),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('throws 403 when user is not the creator', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain({
        id: REVIEW_ID,
        creator_id: CREATOR_ID,
        creator_response: null,
      }) as never,
    )

    await expect(
      submitCreatorResponse(OTHER_USER_ID, REVIEW_ID, 'Thanks!'),
    ).rejects.toMatchObject({ status: 403, type: 'forbidden' })
  })

  it('throws 409 response_exists when creator already responded', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain({
        id: REVIEW_ID,
        creator_id: CREATOR_ID,
        creator_response: 'Already replied',
      }) as never,
    )

    const err = await submitCreatorResponse(CREATOR_ID, REVIEW_ID, 'Another reply').catch(
      (e) => e,
    )
    expect(err.status).toBe(409)
    const fieldError = err.errors?.find(
      (e: { code: string }) => e.code === 'response_exists',
    )
    expect(fieldError).toBeDefined()
  })
})

// ─── getReview ─────────────────────────────────────────────────────

describe('getReview', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns review with text visible when is_revealed = true', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(reviewRow) as never)

    const result = await getReview(REVIEW_ID, OTHER_USER_ID)

    expect(result.reviewerText).toBe('Great experience!')
    expect(result.creatorResponse).toBe('Thank you!')
    expect(result.isRevealed).toBe(true)
  })

  it('hides reviewerText from public when not revealed', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(unrevealedReviewRow) as never,
    )

    const result = await getReview(REVIEW_ID, OTHER_USER_ID)

    expect(result.reviewerText).toBeNull()
    expect(result.isRevealed).toBe(false)
  })

  it('reviewer always sees own reviewerText even when unrevealed', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(unrevealedReviewRow) as never,
    )

    const result = await getReview(REVIEW_ID, REVIEWER_ID)

    expect(result.reviewerText).toBe('Great experience!')
    expect(result.isRevealed).toBe(false)
  })

  it('hides creatorResponse from public when not revealed', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain({ ...unrevealedReviewRow, creator_response: 'Thank you!' }) as never,
    )

    const result = await getReview(REVIEW_ID, OTHER_USER_ID)

    expect(result.creatorResponse).toBeNull()
  })

  it('creator always sees own creatorResponse even when unrevealed', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain({ ...unrevealedReviewRow, creator_response: 'Thank you!' }) as never,
    )

    const result = await getReview(REVIEW_ID, CREATOR_ID)

    expect(result.creatorResponse).toBe('Thank you!')
  })

  it('throws 404 when review not found', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(null) as never)

    await expect(getReview(REVIEW_ID, OTHER_USER_ID)).rejects.toMatchObject({
      status: 404,
    })
  })
})

// ─── listContentReviews ────────────────────────────────────────────

describe('listContentReviews', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns only revealed reviews to public (non-creator)', async () => {
    const revealedRows = [reviewRow]

    vi.mocked(supabase.from)
      // content fetch (requester is not creator)
      .mockReturnValueOnce(mockChain({ user_id: CREATOR_ID }) as never)
      // list query
      .mockReturnValueOnce(mockChain(revealedRows) as never)
      // average rating query
      .mockReturnValueOnce(mockChain([{ rating: 4 }]) as never)

    const result = await listContentReviews(CONTENT_ID, OTHER_USER_ID, { limit: 20 })

    expect(result.items).toHaveLength(1)
    expect(result.averageRating).toBe(4)
    expect(result.nextCursor).toBeNull()
  })

  it('returns all reviews (including unrevealed) to creator', async () => {
    const rows = [reviewRow, { ...unrevealedReviewRow, id: 'review-002' }]

    vi.mocked(supabase.from)
      // content fetch (requester IS creator)
      .mockReturnValueOnce(mockChain({ user_id: CREATOR_ID }) as never)
      // list query (no is_revealed filter applied for creator)
      .mockReturnValueOnce(mockChain(rows) as never)
      // average rating query
      .mockReturnValueOnce(mockChain([{ rating: 4 }]) as never)

    const result = await listContentReviews(CONTENT_ID, CREATOR_ID, { limit: 20 })

    expect(result.items).toHaveLength(2)
  })

  it('calculates averageRating correctly across multiple revealed reviews', async () => {
    vi.mocked(supabase.from)
      // content fetch
      .mockReturnValueOnce(mockChain({ user_id: CREATOR_ID }) as never)
      // list
      .mockReturnValueOnce(mockChain([reviewRow]) as never)
      // rating data: 4 + 5 + 3 = 12 / 3 = 4.0
      .mockReturnValueOnce(
        mockChain([{ rating: 4 }, { rating: 5 }, { rating: 3 }]) as never,
      )

    const result = await listContentReviews(CONTENT_ID, OTHER_USER_ID, { limit: 20 })

    expect(result.averageRating).toBe(4)
  })

  it('returns averageRating = 0 when no revealed reviews', async () => {
    vi.mocked(supabase.from)
      // content fetch
      .mockReturnValueOnce(mockChain({ user_id: CREATOR_ID }) as never)
      // list
      .mockReturnValueOnce(mockChain([]) as never)
      // no ratings
      .mockReturnValueOnce(mockChain([]) as never)

    const result = await listContentReviews(CONTENT_ID, OTHER_USER_ID, { limit: 20 })

    expect(result.averageRating).toBe(0)
    expect(result.items).toHaveLength(0)
  })

  it('returns nextCursor when more items exist', async () => {
    // 21 items but limit = 20
    const rows = Array.from({ length: 21 }, (_, i) => ({
      ...reviewRow,
      id: `review-${i.toString().padStart(3, '0')}`,
      created_at: `2026-03-${(18 - i).toString().padStart(2, '0')}T10:00:00Z`,
    }))

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ user_id: CREATOR_ID }) as never)
      .mockReturnValueOnce(mockChain(rows) as never)
      .mockReturnValueOnce(mockChain([{ rating: 4 }]) as never)

    const result = await listContentReviews(CONTENT_ID, OTHER_USER_ID, { limit: 20 })

    expect(result.items).toHaveLength(20)
    expect(result.nextCursor).not.toBeNull()
  })

  it('works for unauthenticated requester (undefined requesterId)', async () => {
    vi.mocked(supabase.from)
      // no content fetch needed (requesterId undefined)
      .mockReturnValueOnce(mockChain([reviewRow]) as never)
      .mockReturnValueOnce(mockChain([{ rating: 4 }]) as never)

    const result = await listContentReviews(CONTENT_ID, undefined, { limit: 20 })

    expect(result.items).toHaveLength(1)
  })
})

// ─── revealDueReviews ──────────────────────────────────────────────

describe('revealDueReviews', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns count of revealed reviews', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain([{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }]) as never,
    )

    const result = await revealDueReviews()

    expect(result.count).toBe(3)
  })

  it('returns count = 0 when no reviews are due', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain([]) as never)

    const result = await revealDueReviews()

    expect(result.count).toBe(0)
  })

  it('throws 500 on db error', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(null, { message: 'db error' }) as never,
    )

    await expect(revealDueReviews()).rejects.toMatchObject({ status: 500 })
  })
})
