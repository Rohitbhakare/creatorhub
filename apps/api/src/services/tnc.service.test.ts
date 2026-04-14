import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (must come before any imports that touch these modules) ─────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn() }
  return { supabase: mockSupabase }
})

import { recordConsent, hasConsented } from './tnc.service.js'
import { supabase } from '../lib/supabase.js'

// ─── Mock helpers ──────────────────────────────────────────────────────────

function mockChain(
  data: unknown,
  error: unknown = null,
  count: number | null = null,
) {
  const resolvedVal = { data, error, count }
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    head: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: (
      onFulfilled: (val: typeof resolvedVal) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolvedVal).then(onFulfilled, onRejected),
  }
  return chain
}

// ─── Fixtures ──────────────────────────────────────────────────────────────

const USER_ID = 'user-001'
const CONTENT_ID = 'content-001'

// ─── recordConsent ────────────────────────────────────────────────────────

describe('recordConsent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('upserts consent record and resolves void on success', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(null) as never)

    await expect(
      recordConsent(USER_ID, CONTENT_ID, '1.2.3.4', 'Mozilla/5.0'),
    ).resolves.toBeUndefined()
  })

  it('is idempotent — calling twice does not throw', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(null) as never)
      .mockReturnValueOnce(mockChain(null) as never)

    await recordConsent(USER_ID, CONTENT_ID, null, null)
    await expect(
      recordConsent(USER_ID, CONTENT_ID, null, null),
    ).resolves.toBeUndefined()
  })

  it('accepts null ip_address and user_agent', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(null) as never)

    await expect(
      recordConsent(USER_ID, CONTENT_ID, null, null),
    ).resolves.toBeUndefined()
  })

  it('throws 500 on DB upsert error', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(null, { message: 'upsert failed' }) as never,
    )

    await expect(
      recordConsent(USER_ID, CONTENT_ID, '1.2.3.4', 'Mozilla/5.0'),
    ).rejects.toMatchObject({
      status: 500,
      type: 'db-error',
    })
  })
})

// ─── hasConsented ─────────────────────────────────────────────────────────

describe('hasConsented', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns true when count > 0', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(null, null, 1) as never,
    )

    const result = await hasConsented(USER_ID, CONTENT_ID)

    expect(result).toBe(true)
  })

  it('returns false when count is 0', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(null, null, 0) as never,
    )

    const result = await hasConsented(USER_ID, CONTENT_ID)

    expect(result).toBe(false)
  })

  it('returns false when count is null (treats null as 0)', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(null, null, null) as never,
    )

    const result = await hasConsented(USER_ID, CONTENT_ID)

    expect(result).toBe(false)
  })

  it('throws 500 on DB error', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(null, { message: 'query failed' }, null) as never,
    )

    await expect(hasConsented(USER_ID, CONTENT_ID)).rejects.toMatchObject({
      status: 500,
      type: 'db-error',
    })
  })
})
