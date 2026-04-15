import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────────────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn() }
  return { supabase: mockSupabase }
})

import {
  registerDevice,
  unregisterDevice,
  getUserDeviceTokens,
} from './device.service.js'
import { supabase } from '../lib/supabase.js'

// ─── Mock helpers ──────────────────────────────────────────────────────

function mockChain(data: unknown, error: unknown = null) {
  const resolvedVal = { data, error }
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
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

const USER_A = 'aaa-111-aaa-111-aaa111aa1111'
const TOKEN_ID = 'tok-000-tok-000-tok000to0000'
const FCM_TOKEN = 'fcm_token_abc123'

beforeEach(() => {
  vi.resetAllMocks()
})

// ── registerDevice ─────────────────────────────────────────────────────

describe('registerDevice', () => {
  it('upserts a new device token', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(registerDevice(USER_A, FCM_TOKEN, 'android')).resolves.toBeUndefined()
    expect(fromMock).toHaveBeenCalledWith('devices')
  })

  it('updates last_active_at for an existing token (same user)', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(registerDevice(USER_A, FCM_TOKEN, 'ios', { app_version: '1.0.0' })).resolves.toBeUndefined()
    expect(fromMock).toHaveBeenCalledWith('devices')
  })

  it('throws db-error when upsert fails', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'upsert error' }) as never)

    await expect(registerDevice(USER_A, FCM_TOKEN, 'web')).rejects.toThrow('Failed to register device')
  })
})

// ── unregisterDevice ───────────────────────────────────────────────────

describe('unregisterDevice', () => {
  it('deletes own device token successfully', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain([{ id: TOKEN_ID }]) as never)

    await expect(unregisterDevice(USER_A, TOKEN_ID)).resolves.toBeUndefined()
    expect(fromMock).toHaveBeenCalledWith('devices')
  })

  it('throws 404 when token not found or belongs to different user', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    await expect(unregisterDevice(USER_A, TOKEN_ID)).rejects.toThrow('Device token not found')
  })

  it('throws db-error on delete failure', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'delete error' }) as never)

    await expect(unregisterDevice(USER_A, TOKEN_ID)).rejects.toThrow('Failed to unregister device')
  })
})

// ── getUserDeviceTokens ────────────────────────────────────────────────

describe('getUserDeviceTokens', () => {
  it('returns array of fcm_tokens for user', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain([{ fcm_token: 'token1' }, { fcm_token: 'token2' }]) as never,
    )

    const tokens = await getUserDeviceTokens(USER_A)
    expect(tokens).toEqual(['token1', 'token2'])
  })

  it('returns empty array when user has no registered devices', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    const tokens = await getUserDeviceTokens(USER_A)
    expect(tokens).toEqual([])
  })

  it('throws db-error on query failure', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'query error' }) as never)

    await expect(getUserDeviceTokens(USER_A)).rejects.toThrow('Failed to fetch device tokens')
  })
})
