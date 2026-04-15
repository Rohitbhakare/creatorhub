import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────────────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn() }
  return { supabase: mockSupabase }
})

import {
  getPublicProfile,
  updateProfile,
  updateUsername,
  getProfileCompletion,
} from './profile.service.js'
import { supabase } from '../lib/supabase.js'

// ─── Mock helpers ──────────────────────────────────────────────────────

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
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
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

const USER_ID = 'aaa-111'
const VIEWER_ID = 'bbb-222'

const mockUser = {
  id: USER_ID,
  display_name: 'Test User',
  username: 'testuser',
  bio: 'Hello world',
  avatar_url: 'https://example.com/avatar.jpg',
  is_creator: false,
  current_city_id: 'city-001',
  follower_count: 10,
  following_count: 5,
  content_count: 3,
  created_at: '2025-01-01T00:00:00Z',
}

const mockCity = { id: 'city-001', name: 'Mumbai', state: 'Maharashtra' }

// ─── Tests ────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

// ── getPublicProfile ──────────────────────────────────────────────

describe('getPublicProfile', () => {
  it('returns profile with city, verticals, and is_following=false when no viewer', async () => {
    const fromMock = vi.mocked(supabase.from)

    // Call 1: users table
    fromMock.mockReturnValueOnce(mockChain(mockUser) as never)
    // Call 2: user_active_verticals
    fromMock.mockReturnValueOnce(mockChain([{ vertical: 'travel' }]) as never)
    // Call 3: cities
    fromMock.mockReturnValueOnce(mockChain(mockCity) as never)

    const result = await getPublicProfile(USER_ID)

    expect(result.id).toBe(USER_ID)
    expect(result.display_name).toBe('Test User')
    expect(result.current_city).toEqual({ id: 'city-001', name: 'Mumbai', state: 'Maharashtra' })
    expect(result.is_following).toBe(false)
    expect(result.follower_count).toBe(10)
  })

  it('throws 404 when user not found', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(null, { code: 'PGRST116' }) as never)

    await expect(getPublicProfile('nonexistent')).rejects.toMatchObject({
      status: 404,
    })
  })

  it('returns is_following=true when viewer follows the user', async () => {
    const fromMock = vi.mocked(supabase.from)

    fromMock.mockReturnValueOnce(mockChain(mockUser) as never)
    fromMock.mockReturnValueOnce(mockChain([{ vertical: 'travel' }]) as never)
    fromMock.mockReturnValueOnce(mockChain(mockCity) as never)
    // follows check returns a row
    fromMock.mockReturnValueOnce(mockChain({ follower_id: VIEWER_ID }) as never)

    const result = await getPublicProfile(USER_ID, VIEWER_ID)

    expect(result.is_following).toBe(true)
  })

  it('returns is_following=false when viewer is self', async () => {
    const fromMock = vi.mocked(supabase.from)

    fromMock.mockReturnValueOnce(mockChain(mockUser) as never)
    fromMock.mockReturnValueOnce(mockChain([]) as never)
    fromMock.mockReturnValueOnce(mockChain(mockCity) as never)

    const result = await getPublicProfile(USER_ID, USER_ID)

    expect(result.is_following).toBe(false)
  })

  it('returns null city when no current_city_id', async () => {
    const fromMock = vi.mocked(supabase.from)
    const userNoCityId = { ...mockUser, current_city_id: null }

    fromMock.mockReturnValueOnce(mockChain(userNoCityId) as never)
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    const result = await getPublicProfile(USER_ID)

    expect(result.current_city).toBeNull()
  })
})

// ── updateProfile ────────────────────────────────────────────────

describe('updateProfile', () => {
  it('updates and returns the profile fields', async () => {
    const updated = { id: USER_ID, display_name: 'New Name', username: 'testuser', bio: 'New bio', email: null, avatar_url: null }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(updated) as never)

    const result = await updateProfile(USER_ID, { display_name: 'New Name', bio: 'New bio' })

    expect(result.display_name).toBe('New Name')
    expect(result.bio).toBe('New bio')
  })

  it('throws 500 on db error', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(null, { message: 'db error' }) as never)

    await expect(updateProfile(USER_ID, { display_name: 'X' })).rejects.toMatchObject({
      status: 500,
    })
  })
})

// ── updateUsername ────────────────────────────────────────────────

describe('updateUsername', () => {
  it('rejects reserved username with 422', async () => {
    await expect(updateUsername(USER_ID, 'admin')).rejects.toMatchObject({
      status: 422,
    })
  })

  it('rejects taken username with 409', async () => {
    const fromMock = vi.mocked(supabase.from)

    // cooldown check — no previous change
    fromMock.mockReturnValueOnce(mockChain({ username_changed_at: null }) as never)
    // uniqueness check — username taken
    fromMock.mockReturnValueOnce(mockChain({ id: 'other-user' }) as never)

    await expect(updateUsername(USER_ID, 'taken_name')).rejects.toMatchObject({
      status: 409,
    })
  })

  it('rejects username change within 30-day cooldown with 429', async () => {
    const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
    const fromMock = vi.mocked(supabase.from)

    fromMock.mockReturnValueOnce(mockChain({ username_changed_at: recentDate }) as never)
    fromMock.mockReturnValueOnce(mockChain(null) as never) // uniqueness check

    await expect(updateUsername(USER_ID, 'newname')).rejects.toMatchObject({
      status: 429,
    })
  })

  it('allows username change after cooldown expires', async () => {
    const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString() // 31 days ago
    const fromMock = vi.mocked(supabase.from)

    // cooldown check — old enough
    fromMock.mockReturnValueOnce(mockChain({ username_changed_at: oldDate }) as never)
    // uniqueness — available
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    // update
    fromMock.mockReturnValueOnce(mockChain({ id: USER_ID, username: 'newname', username_changed_at: new Date().toISOString() }) as never)

    const result = await updateUsername(USER_ID, 'newname')

    expect(result.username).toBe('newname')
  })

  it('allows first-time username set (no previous change)', async () => {
    const fromMock = vi.mocked(supabase.from)

    fromMock.mockReturnValueOnce(mockChain({ username_changed_at: null }) as never)
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    fromMock.mockReturnValueOnce(mockChain({ id: USER_ID, username: 'first_name', username_changed_at: new Date().toISOString() }) as never)

    const result = await updateUsername(USER_ID, 'first_name')

    expect(result.username).toBe('first_name')
  })
})

// ── getProfileCompletion ─────────────────────────────────────────

describe('getProfileCompletion', () => {
  it('returns 100% when all items complete', async () => {
    const fromMock = vi.mocked(supabase.from)
    const completeUser = {
      display_name: 'Test',
      avatar_url: 'https://example.com/a.jpg',
      bio: 'Hello',
      current_city_id: 'city-001',
    }

    fromMock.mockReturnValueOnce(mockChain(completeUser) as never)
    fromMock.mockReturnValueOnce(mockChain(null, null, 5) as never) // 5 follows

    const result = await getProfileCompletion(USER_ID)

    expect(result.percentage).toBe(100)
    expect(result.completed).toBe(5)
    expect(result.total).toBe(5)
    expect(result.items.every((i: { done: boolean }) => i.done)).toBe(true)
  })

  it('returns 0% for empty profile with 0 follows', async () => {
    const fromMock = vi.mocked(supabase.from)
    const emptyUser = {
      display_name: null,
      avatar_url: null,
      bio: null,
      current_city_id: null,
    }

    fromMock.mockReturnValueOnce(mockChain(emptyUser) as never)
    fromMock.mockReturnValueOnce(mockChain(null, null, 0) as never)

    const result = await getProfileCompletion(USER_ID)

    expect(result.percentage).toBe(0)
    expect(result.completed).toBe(0)
    expect(result.items.every((i: { done: boolean }) => !i.done)).toBe(true)
  })

  it('returns 60% with 3 of 5 items done', async () => {
    const fromMock = vi.mocked(supabase.from)
    const partialUser = {
      display_name: 'Test',
      avatar_url: 'https://example.com/a.jpg',
      bio: null,
      current_city_id: 'city-001',
    }

    fromMock.mockReturnValueOnce(mockChain(partialUser) as never)
    fromMock.mockReturnValueOnce(mockChain(null, null, 0) as never) // 0 follows

    const result = await getProfileCompletion(USER_ID)

    expect(result.percentage).toBe(60) // 3/5 = 60%
    expect(result.completed).toBe(3)
    expect(result.items.find((i: { key: string }) => i.key === 'bio')?.done).toBe(false)
    expect(result.items.find((i: { key: string }) => i.key === 'follows')?.done).toBe(false)
  })

  it('follows threshold is exactly 3', async () => {
    const fromMock = vi.mocked(supabase.from)
    const minUser = { display_name: null, avatar_url: null, bio: null, current_city_id: null }

    fromMock.mockReturnValueOnce(mockChain(minUser) as never)
    fromMock.mockReturnValueOnce(mockChain(null, null, 3) as never)

    const result = await getProfileCompletion(USER_ID)

    expect(result.items.find((i: { key: string }) => i.key === 'follows')?.done).toBe(true)
    expect(result.percentage).toBe(20) // 1 of 5
  })

  it('follows threshold: 2 is not enough', async () => {
    const fromMock = vi.mocked(supabase.from)
    const minUser = { display_name: null, avatar_url: null, bio: null, current_city_id: null }

    fromMock.mockReturnValueOnce(mockChain(minUser) as never)
    fromMock.mockReturnValueOnce(mockChain(null, null, 2) as never)

    const result = await getProfileCompletion(USER_ID)

    expect(result.items.find((i: { key: string }) => i.key === 'follows')?.done).toBe(false)
    expect(result.percentage).toBe(0)
  })

  it('throws 404 when user not found', async () => {
    const fromMock = vi.mocked(supabase.from)

    fromMock.mockReturnValueOnce(mockChain(null, { code: 'PGRST116' }) as never)
    fromMock.mockReturnValueOnce(mockChain(null, null, 0) as never)

    await expect(getProfileCompletion('nonexistent')).rejects.toMatchObject({
      status: 404,
    })
  })
})
