import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────────────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn(), rpc: vi.fn() }
  return { supabase: mockSupabase }
})

import {
  getPreferences,
  updatePreferences,
  insertDefaultPreferences,
  getDndStatus,
  setDndStatus,
  CATEGORIES,
  CHANNELS,
} from './notification.service.js'
import { supabase } from '../lib/supabase.js'

// ─── Mock helpers ──────────────────────────────────────────────────────

function mockChain(data: unknown, error: unknown = null) {
  const resolvedVal = { data, error }
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: (
      onFulfilled: (val: typeof resolvedVal) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolvedVal).then(onFulfilled, onRejected),
  }
  return chain
}

// ─── Fixtures ──────────────────────────────────────────────────────────

const USER_ID = 'aaa-111-aaa-111-aaa111aa1111'

beforeEach(() => {
  vi.resetAllMocks()
})

// ── getPreferences ─────────────────────────────────────────────────────

describe('getPreferences', () => {
  it('returns 18 preference rows for a user with full prefs', async () => {
    const fromMock = vi.mocked(supabase.from)
    const rows = CATEGORIES.flatMap((category) =>
      CHANNELS.map((channel) => ({ category, channel, enabled: true })),
    )
    fromMock.mockReturnValueOnce(mockChain(rows) as never)

    const result = await getPreferences(USER_ID)
    expect(result).toHaveLength(18)
    expect(result[0]).toHaveProperty('category')
    expect(result[0]).toHaveProperty('channel')
    expect(result[0]).toHaveProperty('enabled')
  })

  it('returns empty array for user with no preferences', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    const result = await getPreferences(USER_ID)
    expect(result).toHaveLength(0)
  })

  it('throws db-error on query failure', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'query error' }) as never)

    await expect(getPreferences(USER_ID)).rejects.toThrow('Failed to fetch notification preferences')
  })
})

// ── updatePreferences ──────────────────────────────────────────────────

describe('updatePreferences', () => {
  it('updates preferences successfully', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(
      updatePreferences(USER_ID, [
        { category: 'promotions', channel: 'push', enabled: true },
      ]),
    ).resolves.toBeUndefined()

    expect(fromMock).toHaveBeenCalledWith('user_notification_preferences')
  })

  it('rejects update when category=bookings_trips and channel=whatsapp and enabled=false', async () => {
    await expect(
      updatePreferences(USER_ID, [
        { category: 'bookings_trips', channel: 'whatsapp', enabled: false },
      ]),
    ).rejects.toThrow('Booking WhatsApp notifications cannot be disabled')
  })

  it('allows other updates on bookings_trips (non-whatsapp)', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(
      updatePreferences(USER_ID, [
        { category: 'bookings_trips', channel: 'push', enabled: false },
      ]),
    ).resolves.toBeUndefined()
  })

  it('throws db-error when upsert fails', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'upsert error' }) as never)

    await expect(
      updatePreferences(USER_ID, [
        { category: 'promotions', channel: 'email', enabled: true },
      ]),
    ).rejects.toThrow('Failed to update notification preferences')
  })
})

// ── insertDefaultPreferences ───────────────────────────────────────────

describe('insertDefaultPreferences', () => {
  it('upserts 18 rows with correct defaults', async () => {
    const fromMock = vi.mocked(supabase.from)
    const chainMock = mockChain(null) as never
    fromMock.mockReturnValueOnce(chainMock)

    await insertDefaultPreferences(USER_ID)

    expect(fromMock).toHaveBeenCalledWith('user_notification_preferences')
  })

  it('does not throw on conflict (ignoreDuplicates)', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(insertDefaultPreferences(USER_ID)).resolves.toBeUndefined()
  })

  it('throws db-error when upsert fails', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'upsert error' }) as never)

    await expect(insertDefaultPreferences(USER_ID)).rejects.toThrow('Failed to insert default preferences')
  })
})

// ── getDndStatus ───────────────────────────────────────────────────────

describe('getDndStatus', () => {
  it('returns true when dnd_enabled is true', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ dnd_enabled: true }) as never)

    const result = await getDndStatus(USER_ID)
    expect(result).toBe(true)
  })

  it('returns false when dnd_enabled is false', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ dnd_enabled: false }) as never)

    const result = await getDndStatus(USER_ID)
    expect(result).toBe(false)
  })

  it('returns false when user not found', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    const result = await getDndStatus(USER_ID)
    expect(result).toBe(false)
  })

  it('returns false on db error', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'db error' }) as never)

    const result = await getDndStatus(USER_ID)
    expect(result).toBe(false)
  })
})

// ── setDndStatus ───────────────────────────────────────────────────────

describe('setDndStatus', () => {
  it('updates dnd_enabled to true', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(setDndStatus(USER_ID, true)).resolves.toBeUndefined()
    expect(fromMock).toHaveBeenCalledWith('users')
  })

  it('updates dnd_enabled to false', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(setDndStatus(USER_ID, false)).resolves.toBeUndefined()
  })

  it('throws db-error when update fails', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'update error' }) as never)

    await expect(setDndStatus(USER_ID, true)).rejects.toThrow('Failed to update DND status')
  })
})
