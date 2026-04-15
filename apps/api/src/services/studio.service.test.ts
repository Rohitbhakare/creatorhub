import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────────────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn(), rpc: vi.fn() }
  return { supabase: mockSupabase }
})

import {
  getTopAlert,
  dismissAlert,
  getCreatorStats,
  listCreatorContent,
} from './studio.service.js'
import { supabase } from '../lib/supabase.js'

// ─── Mock helpers ──────────────────────────────────────────────────────

function mockChain(data: unknown, error: unknown = null) {
  const resolvedVal = { data, error }
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: (
      onFulfilled: (val: typeof resolvedVal) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolvedVal).then(onFulfilled, onRejected),
  }
  return chain
}

// ─── Fixtures ──────────────────────────────────────────────────────────

const USER_ID = 'user-aaa-111'
const ALERT_ID = 'alert-bbb-222'
const CONTENT_ID_1 = 'content-ccc-333'
const CONTENT_ID_2 = 'content-ddd-444'

beforeEach(() => {
  vi.resetAllMocks()
})

// ── getTopAlert ────────────────────────────────────────────────────────

describe('getTopAlert', () => {
  it('returns the highest priority alert from the DB when one exists', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain({
        id: ALERT_ID,
        alert_type: 'kyc_reminder',
        priority: 10,
        payload: { title: 'Complete KYC', body: 'Submit your documents.', cta_target: '/kyc' },
      }) as never,
    )

    const result = await getTopAlert(USER_ID)
    expect(result.id).toBe(ALERT_ID)
    expect(result.alertType).toBe('kyc_reminder')
    expect(result.priority).toBe(10)
    expect(result.title).toBe('Complete KYC')
    expect(result.body).toBe('Submit your documents.')
    expect(result.ctaTarget).toBe('/kyc')
  })

  it('returns quiet_state synthetic alert when no DB alert exists', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    const result = await getTopAlert(USER_ID)
    expect(result.id).toBe('quiet')
    expect(result.alertType).toBe('quiet_state')
    expect(result.priority).toBe(0)
    expect(result.title).toBe('Start your first piece')
    expect(result.ctaTarget).toBe('/content/create')
  })

  it('excludes dismissed alerts (query filters dismissed_at IS NULL)', async () => {
    // When dismissed alerts are filtered out and no undismissed alert exists
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    const result = await getTopAlert(USER_ID)
    // The .is('dismissed_at', null) filter is applied; with no results, quiet_state is returned
    expect(result.id).toBe('quiet')
    const chain = fromMock.mock.results[0]!.value as Record<string, ReturnType<typeof vi.fn>>
    expect(chain.is).toHaveBeenCalledWith('dismissed_at', null)
  })

  it('excludes expired alerts (query filters expires_at > now())', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await getTopAlert(USER_ID)
    // Verify the .or() clause handles the expires_at filter
    const chain = fromMock.mock.results[0]!.value as Record<string, ReturnType<typeof vi.fn>>
    expect(chain.or).toHaveBeenCalledWith(expect.stringContaining('expires_at'))
  })

  it('returns highest priority alert when multiple exist', async () => {
    // DB already returns the highest-priority row (ORDER BY priority DESC LIMIT 1)
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain({
        id: ALERT_ID,
        alert_type: 'payout_ready',
        priority: 99,
        payload: { title: 'Payout ready', body: 'Withdraw now.', cta_target: '/wallet' },
      }) as never,
    )

    const result = await getTopAlert(USER_ID)
    expect(result.priority).toBe(99)
    expect(result.alertType).toBe('payout_ready')
  })

  it('throws db-error on query failure', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'query error' }) as never)

    await expect(getTopAlert(USER_ID)).rejects.toThrow('Failed to fetch studio alert')
  })
})

// ── dismissAlert ───────────────────────────────────────────────────────

describe('dismissAlert', () => {
  it('marks dismissed_at on matching alert', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain([{ id: ALERT_ID }]) as never)

    await expect(dismissAlert(USER_ID, ALERT_ID)).resolves.toBeUndefined()
    expect(fromMock).toHaveBeenCalledWith('studio_alerts')
    const chain = fromMock.mock.results[0]!.value as Record<string, ReturnType<typeof vi.fn>>
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ dismissed_at: expect.any(String) }))
    expect(chain.eq).toHaveBeenCalledWith('id', ALERT_ID)
    expect(chain.eq).toHaveBeenCalledWith('user_id', USER_ID)
  })

  it('throws 404 when alert is not found', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    await expect(dismissAlert(USER_ID, ALERT_ID)).rejects.toThrow('Alert not found')
  })

  it('throws 404 when alert belongs to a different user', async () => {
    const fromMock = vi.mocked(supabase.from)
    // The .eq('user_id', ...) filter means a wrong-user alert returns 0 rows
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    await expect(dismissAlert('other-user-id', ALERT_ID)).rejects.toThrow('Alert not found')
  })

  it('throws db-error on update failure', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'update error' }) as never)

    await expect(dismissAlert(USER_ID, ALERT_ID)).rejects.toThrow('Failed to dismiss alert')
  })
})

// ── getCreatorStats ────────────────────────────────────────────────────

describe('getCreatorStats', () => {
  it('returns aggregated stats for a creator with published content', async () => {
    const fromMock = vi.mocked(supabase.from)
    // 1. users query
    fromMock.mockReturnValueOnce(
      mockChain({ follower_count: 42, content_count: 5 }) as never,
    )
    // 2. content query
    fromMock.mockReturnValueOnce(
      mockChain([
        { save_count: 10, like_count: 200 },
        { save_count: 5, like_count: 100 },
      ]) as never,
    )

    const stats = await getCreatorStats(USER_ID)
    expect(stats.followers).toBe(42)
    expect(stats.contentCount).toBe(5)
    expect(stats.saves).toBe(15)
    expect(stats.views).toBe(300)
    expect(stats.bookings).toBe(0) // always 0 in M1
  })

  it('returns zeros for a user with no published content', async () => {
    const fromMock = vi.mocked(supabase.from)
    // users: no content yet
    fromMock.mockReturnValueOnce(
      mockChain({ follower_count: 0, content_count: 0 }) as never,
    )
    // content: empty array
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    const stats = await getCreatorStats(USER_ID)
    expect(stats.followers).toBe(0)
    expect(stats.contentCount).toBe(0)
    expect(stats.saves).toBe(0)
    expect(stats.views).toBe(0)
    expect(stats.bookings).toBe(0)
  })

  it('returns zeros when user row is missing', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    const stats = await getCreatorStats(USER_ID)
    expect(stats.followers).toBe(0)
    expect(stats.contentCount).toBe(0)
  })

  it('throws db-error when users query fails', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'db error' }) as never)
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    await expect(getCreatorStats(USER_ID)).rejects.toThrow('Failed to fetch user stats')
  })

  it('throws db-error when content query fails', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain({ follower_count: 5, content_count: 2 }) as never,
    )
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'db error' }) as never)

    await expect(getCreatorStats(USER_ID)).rejects.toThrow('Failed to fetch content stats')
  })

  it('always returns bookings as 0 (M1: no payments)', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain({ follower_count: 100, content_count: 10 }) as never,
    )
    fromMock.mockReturnValueOnce(
      mockChain([{ save_count: 50, like_count: 1000 }]) as never,
    )

    const stats = await getCreatorStats(USER_ID)
    expect(stats.bookings).toBe(0)
  })
})

// ── listCreatorContent ─────────────────────────────────────────────────

describe('listCreatorContent', () => {
  const makeContent = (id: string, overrides: Partial<Record<string, unknown>> = {}) => ({
    id,
    title: `Content ${id}`,
    type: 'post',
    status: 'published',
    cover_image_url: 'https://example.com/img.jpg',
    price_paisa: null,
    like_count: 5,
    comment_count: 2,
    save_count: 1,
    updated_at: '2025-01-10T00:00:00.000Z',
    ...overrides,
  })

  it('returns all content for a user (no filters)', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain([makeContent(CONTENT_ID_1), makeContent(CONTENT_ID_2)]) as never,
    )

    const result = await listCreatorContent(USER_ID, {})
    expect(result.items).toHaveLength(2)
    expect(result.next_cursor).toBeNull()
    expect(result.items[0]!.id).toBe(CONTENT_ID_1)
    expect(result.items[0]!.content_type).toBe('post')
  })

  it('filters content by status', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain([makeContent(CONTENT_ID_1, { status: 'draft' })]) as never,
    )

    const result = await listCreatorContent(USER_ID, { status: 'draft' })
    expect(result.items).toHaveLength(1)
    expect(result.items[0]!.status).toBe('draft')

    const chain = fromMock.mock.results[0]!.value as Record<string, ReturnType<typeof vi.fn>>
    expect(chain.eq).toHaveBeenCalledWith('status', 'draft')
  })

  it('filters content by type', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain([makeContent(CONTENT_ID_1, { type: 'itinerary' })]) as never,
    )

    const result = await listCreatorContent(USER_ID, { type: 'itinerary' })
    expect(result.items[0]!.content_type).toBe('itinerary')

    const chain = fromMock.mock.results[0]!.value as Record<string, ReturnType<typeof vi.fn>>
    expect(chain.eq).toHaveBeenCalledWith('type', 'itinerary')
  })

  it('returns next_cursor when more items exist than limit', async () => {
    const fromMock = vi.mocked(supabase.from)
    // Return 3 items when limit is 2 → hasMore = true
    fromMock.mockReturnValueOnce(
      mockChain([
        makeContent(CONTENT_ID_1, { updated_at: '2025-01-10T00:00:00.000Z' }),
        makeContent(CONTENT_ID_2, { updated_at: '2025-01-09T00:00:00.000Z' }),
        makeContent('content-extra', { updated_at: '2025-01-08T00:00:00.000Z' }),
      ]) as never,
    )

    const result = await listCreatorContent(USER_ID, { limit: 2 })
    expect(result.items).toHaveLength(2)
    expect(result.next_cursor).not.toBeNull()
    // Cursor should be base64 of "updated_at::id" for the last returned item
    const decoded = Buffer.from(result.next_cursor!, 'base64').toString('utf8')
    expect(decoded).toBe(`2025-01-09T00:00:00.000Z::${CONTENT_ID_2}`)
  })

  it('applies cursor when provided', async () => {
    const fromMock = vi.mocked(supabase.from)
    const cursor = Buffer.from('2025-01-09T00:00:00.000Z::some-id').toString('base64')
    fromMock.mockReturnValueOnce(mockChain([makeContent(CONTENT_ID_1)]) as never)

    const result = await listCreatorContent(USER_ID, { cursor, limit: 10 })
    expect(result.items).toHaveLength(1)

    // Verify the cursor triggered an .or() call on the query chain
    const chain = fromMock.mock.results[0]!.value as Record<string, ReturnType<typeof vi.fn>>
    expect(chain.or).toHaveBeenCalledWith(expect.stringContaining('updated_at'))
  })

  it('returns empty result when creator has no content', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    const result = await listCreatorContent(USER_ID, {})
    expect(result.items).toHaveLength(0)
    expect(result.next_cursor).toBeNull()
  })

  it('maps DB fields to the correct output shape', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain([
        makeContent(CONTENT_ID_1, {
          type: 'event',
          status: 'archived',
          price_paisa: 50000,
          like_count: 99,
          comment_count: 12,
          save_count: 7,
          cover_image_url: 'https://cdn.example.com/cover.jpg',
          updated_at: '2025-03-01T12:00:00.000Z',
        }),
      ]) as never,
    )

    const result = await listCreatorContent(USER_ID, {})
    const item = result.items[0]!
    expect(item.id).toBe(CONTENT_ID_1)
    expect(item.content_type).toBe('event')
    expect(item.status).toBe('archived')
    expect(item.price_paisa).toBe(50000)
    expect(item.like_count).toBe(99)
    expect(item.comment_count).toBe(12)
    expect(item.save_count).toBe(7)
    expect(item.cover_image_url).toBe('https://cdn.example.com/cover.jpg')
    expect(item.updated_at).toBe('2025-03-01T12:00:00.000Z')
  })

  it('throws db-error on query failure', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'query error' }) as never)

    await expect(listCreatorContent(USER_ID, {})).rejects.toThrow('Failed to fetch content')
  })

  it('ignores malformed cursor and returns from start', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain([makeContent(CONTENT_ID_1)]) as never)

    // A cursor that decodes to a string without "::" is treated as no-cursor
    const badCursor = Buffer.from('not-a-valid-cursor').toString('base64')
    const result = await listCreatorContent(USER_ID, { cursor: badCursor })
    expect(result.items).toHaveLength(1)
  })
})
