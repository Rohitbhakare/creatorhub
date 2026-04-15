import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (must come before any service imports) ─────────────────────────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn() }
  return { supabase: mockSupabase }
})

// Mock global fetch for Perspective API tests
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import {
  submitReport,
  checkToxicity,
  moderateText,
  getPendingReports,
  actionReport,
  giveStrike,
  getUserStrikes,
} from './trust.service.js'
import { supabase } from '../lib/supabase.js'

// ─── Mock chain helper ────────────────────────────────────────────────────────

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
    head: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: singleData ?? data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data: singleData ?? data, error }),
    then: (
      onFulfilled: (val: typeof resolvedVal) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolvedVal).then(onFulfilled, onRejected),
  }
  return chain
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const REPORTER_ID = 'user-reporter-001'
const CONTENT_ID = 'content-001'
const REPORT_ID = 'report-001'
const USER_ID = 'user-target-001'
const ADMIN_ID = 'admin-retool-001'

// ─── submitReport ─────────────────────────────────────────────────────────────

describe('submitReport', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a report and returns the new id', async () => {
    vi.mocked(supabase.from)
      // rate limit count check (< 10)
      .mockReturnValueOnce(mockChain(null, null, 2) as never)
      // duplicate check (none)
      .mockReturnValueOnce(mockChain(null, null) as never)
      // insert
      .mockReturnValueOnce(mockChain({ id: REPORT_ID }) as never)

    const result = await submitReport(REPORTER_ID, 'content', CONTENT_ID, 'spam')

    expect(result).toEqual({ id: REPORT_ID })
  })

  it('throws 429 when reporter exceeds 10 reports per hour', async () => {
    vi.mocked(supabase.from)
      // rate limit count = 10 (at limit)
      .mockReturnValueOnce(mockChain(null, null, 10) as never)

    await expect(
      submitReport(REPORTER_ID, 'content', CONTENT_ID, 'spam'),
    ).rejects.toMatchObject({ status: 429, type: 'rate-limited' })
  })

  it('throws 409 when same reporter/reported_id/reason exists within 24h', async () => {
    vi.mocked(supabase.from)
      // rate limit count (ok)
      .mockReturnValueOnce(mockChain(null, null, 1) as never)
      // duplicate found
      .mockReturnValueOnce(mockChain({ id: 'existing-report' }) as never)

    await expect(
      submitReport(REPORTER_ID, 'content', CONTENT_ID, 'spam'),
    ).rejects.toMatchObject({ status: 409, type: 'conflict' })
  })

  it('includes details in the insert when provided', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(null, null, 0) as never)
      .mockReturnValueOnce(mockChain(null, null) as never)
      .mockReturnValueOnce(mockChain({ id: REPORT_ID }) as never)

    const result = await submitReport(
      REPORTER_ID,
      'user',
      USER_ID,
      'harassment',
      'They sent me abusive messages',
    )

    expect(result.id).toBe(REPORT_ID)
  })

  it('throws 500 when DB insert fails', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(null, null, 0) as never)
      .mockReturnValueOnce(mockChain(null, null) as never)
      // insert fails
      .mockReturnValueOnce(mockChain(null, { message: 'DB error' }) as never)

    await expect(
      submitReport(REPORTER_ID, 'content', CONTENT_ID, 'spam'),
    ).rejects.toMatchObject({ status: 500 })
  })
})

// ─── checkToxicity ────────────────────────────────────────────────────────────

describe('checkToxicity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    // Clear PERSPECTIVE_API_KEY env
    delete process.env['PERSPECTIVE_API_KEY']
  })

  it('returns 0 when PERSPECTIVE_API_KEY is not set (fail-open)', async () => {
    const score = await checkToxicity('some text')
    expect(score).toBe(0)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns high toxicity score for hateful text (mocked API)', async () => {
    process.env['PERSPECTIVE_API_KEY'] = 'test-key-123'
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        attributeScores: {
          TOXICITY: {
            summaryScore: { value: 0.95 },
          },
        },
      }),
    })

    const score = await checkToxicity('I hate you and want to kill you')
    expect(score).toBeCloseTo(0.95)
  })

  it('returns low toxicity score for clean text (mocked API)', async () => {
    process.env['PERSPECTIVE_API_KEY'] = 'test-key-123'
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        attributeScores: {
          TOXICITY: {
            summaryScore: { value: 0.04 },
          },
        },
      }),
    })

    const score = await checkToxicity('Beautiful sunrise over the mountains')
    expect(score).toBeCloseTo(0.04)
  })

  it('returns 0 when Perspective API returns non-ok response (fail-open)', async () => {
    process.env['PERSPECTIVE_API_KEY'] = 'test-key-123'
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    })

    const score = await checkToxicity('some text')
    expect(score).toBe(0)
  })

  it('returns 0 when fetch throws (network error, fail-open)', async () => {
    process.env['PERSPECTIVE_API_KEY'] = 'test-key-123'
    mockFetch.mockRejectedValueOnce(new Error('Network failure'))

    const score = await checkToxicity('some text')
    expect(score).toBe(0)
  })
})

// ─── moderateText ─────────────────────────────────────────────────────────────

describe('moderateText', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    delete process.env['PERSPECTIVE_API_KEY']
  })

  it('auto-creates a report when content is toxic (score >= 0.8)', async () => {
    process.env['PERSPECTIVE_API_KEY'] = 'test-key-123'
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        attributeScores: { TOXICITY: { summaryScore: { value: 0.92 } } },
      }),
    })

    // Insert auto-flag report
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(null, null) as never)

    const result = await moderateText(CONTENT_ID, 'Hateful content here', 'content')

    expect(result.isToxic).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(0.8)
    expect(supabase.from).toHaveBeenCalledWith('reports')
  })

  it('returns isToxic=false and does NOT create a report for clean content', async () => {
    process.env['PERSPECTIVE_API_KEY'] = 'test-key-123'
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        attributeScores: { TOXICITY: { summaryScore: { value: 0.05 } } },
      }),
    })

    const result = await moderateText(CONTENT_ID, 'Beautiful travel blog post', 'content')

    expect(result.isToxic).toBe(false)
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('returns isToxic=false when API unavailable (fail-open, no report created)', async () => {
    // No API key set → checkToxicity returns 0
    const result = await moderateText(CONTENT_ID, 'some text', 'content')

    expect(result.isToxic).toBe(false)
    expect(result.score).toBe(0)
    expect(supabase.from).not.toHaveBeenCalled()
  })
})

// ─── getPendingReports ────────────────────────────────────────────────────────

describe('getPendingReports', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns paginated pending reports', async () => {
    const fakeReports = [
      { id: 'r1', reporter_id: REPORTER_ID, reported_type: 'content', status: 'pending', created_at: '2026-04-15T10:00:00Z' },
      { id: 'r2', reporter_id: REPORTER_ID, reported_type: 'user', status: 'pending', created_at: '2026-04-15T09:00:00Z' },
    ]

    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(fakeReports) as never)

    const result = await getPendingReports({ limit: 20 })

    expect(result.items).toHaveLength(2)
    expect(result.nextCursor).toBeNull()
  })

  it('filters by reported_type when provided', async () => {
    const contentReports = [
      { id: 'r1', reporter_id: REPORTER_ID, reported_type: 'content', status: 'pending', created_at: '2026-04-15T10:00:00Z' },
    ]

    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(contentReports) as never)

    const result = await getPendingReports({ limit: 20, reportedType: 'content' })

    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({ reported_type: 'content' })
  })

  it('returns nextCursor when more items exist than limit', async () => {
    // limit=2, return 3 items → nextCursor set
    const fakeReports = [
      { id: 'r1', status: 'pending', created_at: '2026-04-15T10:00:00Z' },
      { id: 'r2', status: 'pending', created_at: '2026-04-15T09:00:00Z' },
      { id: 'r3', status: 'pending', created_at: '2026-04-15T08:00:00Z' },
    ]

    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(fakeReports) as never)

    const result = await getPendingReports({ limit: 2 })

    expect(result.items).toHaveLength(2)
    expect(result.nextCursor).not.toBeNull()
  })
})

// ─── actionReport ─────────────────────────────────────────────────────────────

describe('actionReport', () => {
  beforeEach(() => vi.clearAllMocks())

  it('successfully actions a report as dismissed', async () => {
    vi.mocked(supabase.from)
      // fetch report
      .mockReturnValueOnce(mockChain({ id: REPORT_ID, status: 'pending' }) as never)
      // update
      .mockReturnValueOnce(mockChain(null, null) as never)

    await expect(actionReport(REPORT_ID, ADMIN_ID, 'dismissed')).resolves.toBeUndefined()
  })

  it('successfully actions a report as content_removed', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ id: REPORT_ID, status: 'pending' }) as never)
      .mockReturnValueOnce(mockChain(null, null) as never)

    await expect(
      actionReport(REPORT_ID, ADMIN_ID, 'content_removed'),
    ).resolves.toBeUndefined()
  })

  it('throws 404 when report does not exist', async () => {
    vi.mocked(supabase.from)
      // fetch returns null (not found)
      .mockReturnValueOnce(mockChain(null, null) as never)

    await expect(actionReport('nonexistent-id', ADMIN_ID, 'dismissed')).rejects.toMatchObject({
      status: 404,
      type: 'not-found',
    })
  })
})

// ─── giveStrike ───────────────────────────────────────────────────────────────

describe('giveStrike', () => {
  beforeEach(() => vi.clearAllMocks())

  it('records a strike for an existing user', async () => {
    vi.mocked(supabase.from)
      // user lookup
      .mockReturnValueOnce(mockChain({ id: USER_ID }) as never)
      // insert strike
      .mockReturnValueOnce(mockChain(null, null) as never)

    await expect(
      giveStrike(USER_ID, ADMIN_ID, 'Posted inappropriate content'),
    ).resolves.toBeUndefined()
  })

  it('throws 404 when target user does not exist', async () => {
    vi.mocked(supabase.from)
      // user lookup returns null
      .mockReturnValueOnce(mockChain(null, null) as never)

    await expect(
      giveStrike('nonexistent-user', ADMIN_ID, 'reason'),
    ).rejects.toMatchObject({ status: 404, type: 'not-found' })
  })
})

// ─── getUserStrikes ───────────────────────────────────────────────────────────

describe('getUserStrikes', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns correct total count and strike history', async () => {
    const fakeStrikes = [
      { id: 's1', user_id: USER_ID, reason: 'spam', given_by: ADMIN_ID, strike_count: 1, created_at: '2026-04-10T00:00:00Z' },
      { id: 's2', user_id: USER_ID, reason: 'nudity', given_by: ADMIN_ID, strike_count: 2, created_at: '2026-04-12T00:00:00Z' },
    ]

    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(fakeStrikes) as never)

    const result = await getUserStrikes(USER_ID)

    // Total count = sum of strike_count fields = 1 + 2 = 3
    expect(result.count).toBe(3)
    expect(result.strikes).toHaveLength(2)
  })

  it('returns count=0 and empty array when user has no strikes', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain([]) as never)

    const result = await getUserStrikes(USER_ID)

    expect(result.count).toBe(0)
    expect(result.strikes).toHaveLength(0)
  })
})
