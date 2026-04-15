import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────────────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn(), rpc: vi.fn() }
  return { supabase: mockSupabase }
})

vi.mock('../lib/firebase.js', () => ({
  firebaseAuth: { verifyIdToken: vi.fn() },
  firebaseMessaging: { send: vi.fn(), sendEachForMulticast: vi.fn() },
}))

import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  likeContent,
  unlikeContent,
  recordShare,
} from './social.service.js'
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

const USER_A = 'aaa-111'
const USER_B = 'bbb-222'
const CONTENT_ID = 'ccc-333'

beforeEach(() => {
  vi.resetAllMocks()
})

// ── followUser ─────────────────────────────────────────────────────────

describe('followUser', () => {
  it('throws when trying to follow yourself', async () => {
    await expect(followUser(USER_A, USER_A)).rejects.toThrow('Cannot follow yourself')
  })

  it('returns already_following=true if already following', async () => {
    const fromMock = vi.mocked(supabase.from)
    // 1. verify target exists
    fromMock.mockReturnValueOnce(mockChain({ id: USER_B }) as never)
    // 2. check existing follow
    fromMock.mockReturnValueOnce(mockChain({ follower_id: USER_A }) as never)

    const result = await followUser(USER_A, USER_B)
    expect(result).toEqual({ already_following: true })
  })

  it('creates follow and increments counts', async () => {
    const fromMock = vi.mocked(supabase.from)
    const rpcMock = vi.mocked(supabase.rpc)

    // 1. verify target exists
    fromMock.mockReturnValueOnce(mockChain({ id: USER_B }) as never)
    // 2. check existing follow — not found
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    // 3. insert follow
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    // 4. rpc calls
    rpcMock.mockResolvedValue({ data: null, error: null } as never)

    const result = await followUser(USER_A, USER_B)
    expect(result).toEqual({ already_following: false })
    expect(fromMock).toHaveBeenCalledWith('follows')
    expect(rpcMock).toHaveBeenCalledTimes(2)
  })

  it('throws not-found when target user does not exist', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(followUser(USER_A, USER_B)).rejects.toThrow('User not found')
  })

  it('throws db-error when insert fails', async () => {
    const fromMock = vi.mocked(supabase.from)
    // 1. target exists
    fromMock.mockReturnValueOnce(mockChain({ id: USER_B }) as never)
    // 2. not already following
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    // 3. insert fails
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'insert error' }) as never)

    await expect(followUser(USER_A, USER_B)).rejects.toThrow('Failed to follow user')
  })
})

// ── unfollowUser ───────────────────────────────────────────────────────

describe('unfollowUser', () => {
  it('is a no-op when unfollowing yourself', async () => {
    const fromMock = vi.mocked(supabase.from)
    await unfollowUser(USER_A, USER_A)
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('decrements counts when a row was deleted', async () => {
    const fromMock = vi.mocked(supabase.from)
    const rpcMock = vi.mocked(supabase.rpc)
    fromMock.mockReturnValueOnce(mockChain([{ follower_id: USER_A }]) as never)
    rpcMock.mockResolvedValue({ data: null, error: null } as never)

    await unfollowUser(USER_A, USER_B)
    expect(rpcMock).toHaveBeenCalledTimes(2)
    expect(rpcMock).toHaveBeenCalledWith('increment_count', expect.objectContaining({
      column_name: 'follower_count',
      amount: -1,
    }))
  })

  it('does not decrement counts when no row was deleted', async () => {
    const fromMock = vi.mocked(supabase.from)
    const rpcMock = vi.mocked(supabase.rpc)
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    await unfollowUser(USER_A, USER_B)
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('throws db-error on delete failure', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'delete error' }) as never)

    await expect(unfollowUser(USER_A, USER_B)).rejects.toThrow('Failed to unfollow user')
  })
})

// ── getFollowers ───────────────────────────────────────────────────────

describe('getFollowers', () => {
  it('returns paginated follower list', async () => {
    const fromMock = vi.mocked(supabase.from)
    const mockFollowers = [
      { follower_id: 'f1', created_at: '2025-01-01', users: { id: 'f1', display_name: 'F1' } },
      { follower_id: 'f2', created_at: '2025-01-02', users: { id: 'f2', display_name: 'F2' } },
    ]
    fromMock.mockReturnValueOnce(mockChain(mockFollowers) as never)

    const result = await getFollowers(USER_A, null, 20)
    expect(result.items).toHaveLength(2)
    expect(result.next_cursor).toBeNull()
  })

  it('returns next_cursor when more items exist', async () => {
    const fromMock = vi.mocked(supabase.from)
    // Return 3 items when limit is 2 → hasMore = true
    const mockFollowers = [
      { follower_id: 'f1', created_at: '2025-01-03', users: { id: 'f1' } },
      { follower_id: 'f2', created_at: '2025-01-02', users: { id: 'f2' } },
      { follower_id: 'f3', created_at: '2025-01-01', users: { id: 'f3' } },
    ]
    fromMock.mockReturnValueOnce(mockChain(mockFollowers) as never)

    const result = await getFollowers(USER_A, null, 2)
    expect(result.items).toHaveLength(2)
    expect(result.next_cursor).toBe('2025-01-02')
  })

  it('throws db-error on query failure', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'query error' }) as never)

    await expect(getFollowers(USER_A, null, 20)).rejects.toThrow('Failed to fetch followers')
  })
})

// ── getFollowing ───────────────────────────────────────────────────────

describe('getFollowing', () => {
  it('returns paginated following list', async () => {
    const fromMock = vi.mocked(supabase.from)
    const mockFollowing = [
      { following_id: 'f1', created_at: '2025-01-01', users: { id: 'f1', display_name: 'F1' } },
    ]
    fromMock.mockReturnValueOnce(mockChain(mockFollowing) as never)

    const result = await getFollowing(USER_A, null, 20)
    expect(result.items).toHaveLength(1)
    expect(result.next_cursor).toBeNull()
  })
})

// ── likeContent ────────────────────────────────────────────────────────

describe('likeContent', () => {
  it('returns already_liked=true if already liked', async () => {
    const fromMock = vi.mocked(supabase.from)
    // 1. content exists and is published
    fromMock.mockReturnValueOnce(mockChain({ id: CONTENT_ID, status: 'published' }) as never)
    // 2. already liked
    fromMock.mockReturnValueOnce(mockChain({ user_id: USER_A }) as never)

    const result = await likeContent(USER_A, CONTENT_ID)
    expect(result).toEqual({ already_liked: true })
  })

  it('creates like and increments count', async () => {
    const fromMock = vi.mocked(supabase.from)
    const rpcMock = vi.mocked(supabase.rpc)
    // 1. content exists and is published
    fromMock.mockReturnValueOnce(mockChain({ id: CONTENT_ID, status: 'published' }) as never)
    // 2. not already liked
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    // 3. insert like
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    // 4. increment
    rpcMock.mockResolvedValue({ data: null, error: null } as never)

    const result = await likeContent(USER_A, CONTENT_ID)
    expect(result).toEqual({ already_liked: false })
    expect(rpcMock).toHaveBeenCalledWith('increment_count', expect.objectContaining({
      column_name: 'like_count',
      amount: 1,
    }))
  })

  it('throws not-found when content does not exist', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(likeContent(USER_A, CONTENT_ID)).rejects.toThrow('Content not found')
  })

  it('throws not-found when content is not published', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ id: CONTENT_ID, status: 'draft' }) as never)

    await expect(likeContent(USER_A, CONTENT_ID)).rejects.toThrow('Content not found')
  })
})

// ── unlikeContent ──────────────────────────────────────────────────────

describe('unlikeContent', () => {
  it('decrements count when like was deleted', async () => {
    const fromMock = vi.mocked(supabase.from)
    const rpcMock = vi.mocked(supabase.rpc)
    fromMock.mockReturnValueOnce(mockChain([{ user_id: USER_A }]) as never)
    rpcMock.mockResolvedValue({ data: null, error: null } as never)

    await unlikeContent(USER_A, CONTENT_ID)
    expect(rpcMock).toHaveBeenCalledWith('increment_count', expect.objectContaining({
      column_name: 'like_count',
      amount: -1,
    }))
  })

  it('does not decrement when no like existed', async () => {
    const fromMock = vi.mocked(supabase.from)
    const rpcMock = vi.mocked(supabase.rpc)
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    await unlikeContent(USER_A, CONTENT_ID)
    expect(rpcMock).not.toHaveBeenCalled()
  })
})

// ── recordShare ────────────────────────────────────────────────────────

describe('recordShare', () => {
  it('records share for authenticated user', async () => {
    const fromMock = vi.mocked(supabase.from)
    // 1. content exists
    fromMock.mockReturnValueOnce(mockChain({ id: CONTENT_ID }) as never)
    // 2. insert share
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await recordShare(USER_A, CONTENT_ID, 'whatsapp')
    expect(fromMock).toHaveBeenCalledWith('shares')
  })

  it('records share for guest (null userId)', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ id: CONTENT_ID }) as never)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await recordShare(null, CONTENT_ID, 'copy_link')
    expect(fromMock).toHaveBeenCalledWith('shares')
  })

  it('throws validation error for invalid platform', async () => {
    await expect(recordShare(USER_A, CONTENT_ID, 'tiktok')).rejects.toThrow('Invalid platform')
  })

  it('throws not-found when content does not exist', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(recordShare(USER_A, CONTENT_ID, 'whatsapp')).rejects.toThrow('Content not found')
  })
})
