// Unit tests for the search-log fire-and-forget writer (E4.1, T10).
//
// Verifies the core guarantees: normalization, truncation at 200
// chars, empty-query skip, and that errors are swallowed (never
// thrown) so a logging failure can't break a user search.

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase.js', () => ({
  supabase: { from: vi.fn() },
}))

import { logSearchQuery, recordSearchClick } from './search-log.service.js'
import { supabase } from '../lib/supabase.js'

interface MockChain {
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
}

function okChain(row: { id: string } | null): MockChain {
  const chain: MockChain = {
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: row, error: null }),
  }
  return chain
}

function errChain(): MockChain {
  const chain: MockChain = {
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
    single: vi.fn().mockResolvedValue({ data: null, error: { message: 'boom' } }),
  }
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => undefined)
})

describe('logSearchQuery', () => {
  it('inserts a normalized + trimmed row and returns the id', async () => {
    const chain = okChain({ id: 'log-1' })
    vi.mocked(supabase.from).mockReturnValueOnce(chain as never)

    const id = await logSearchQuery({
      query: '  GOA Beaches  ',
      userId: 'user-1',
      sessionId: null,
      resultCount: 12,
    })

    expect(id).toBe('log-1')
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'GOA Beaches',
        normalized_query: 'goa beaches',
        result_count: 12,
        user_id: 'user-1',
        session_id: null,
      }),
    )
  })

  it('returns null for empty / whitespace query without calling DB', async () => {
    const id = await logSearchQuery({
      query: '   ',
      userId: null,
      resultCount: 0,
    })

    expect(id).toBeNull()
    expect(vi.mocked(supabase.from)).not.toHaveBeenCalled()
  })

  it('truncates queries above 200 chars', async () => {
    const chain = okChain({ id: 'log-2' })
    vi.mocked(supabase.from).mockReturnValueOnce(chain as never)
    const long = 'a'.repeat(400)

    await logSearchQuery({ query: long, userId: null, resultCount: 0 })

    const call = chain.insert.mock.calls[0]?.[0] as { query: string }
    expect(call.query.length).toBe(200)
  })

  it('returns null (not throws) on DB error', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(errChain() as never)

    const id = await logSearchQuery({
      query: 'goa',
      userId: null,
      resultCount: 0,
    })

    expect(id).toBeNull()
  })

  it('swallows thrown errors from supabase client', async () => {
    vi.mocked(supabase.from).mockImplementationOnce(() => {
      throw new Error('network down')
    })

    const id = await logSearchQuery({
      query: 'goa',
      userId: null,
      resultCount: 0,
    })

    expect(id).toBeNull()
  })
})

describe('recordSearchClick', () => {
  it('updates the row with clicked fields', async () => {
    const chain = okChain(null)
    vi.mocked(supabase.from).mockReturnValueOnce(chain as never)

    await recordSearchClick({
      searchId: 'log-1',
      resultId: 'content-99',
      resultType: 'content',
    })

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({
        clicked_result_id: 'content-99',
        clicked_result_type: 'content',
      }),
    )
    expect(chain.eq).toHaveBeenCalledWith('id', 'log-1')
  })

  it('does not throw when the DB errors', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(errChain() as never)

    await expect(
      recordSearchClick({
        searchId: 'log-1',
        resultId: 'content-99',
        resultType: 'content',
      }),
    ).resolves.toBeUndefined()
  })
})
