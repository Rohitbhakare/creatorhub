import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (must come before any imports that touch these modules) ─────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn() }
  return { supabase: mockSupabase }
})

import {
  requestDeletion,
  cancelDeletion,
  getDeletionStatus,
  exportUserData,
  recordConsent,
  getConsentStatus,
} from './dpdpa.service.js'
import { supabase } from '../lib/supabase.js'

// ─── Mock helpers ──────────────────────────────────────────────────────────

function mockChain(data: unknown, error: unknown = null, count: number | null = null) {
  const resolvedVal = { data, error, count }
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: (
      onFulfilled: (val: typeof resolvedVal) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolvedVal).then(onFulfilled, onRejected),
  }
  return chain
}

// ─── Fixtures ──────────────────────────────────────────────────────────────

const USER_ID = 'user-dpdpa-001'

// ─── requestDeletion ─────────────────────────────────────────────────────

describe('requestDeletion', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a new deletion request and returns scheduledFor', async () => {
    // First call: check existing (none found)
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(null) as never)
      // Second call: insert
      .mockReturnValueOnce(mockChain(null) as never)

    const result = await requestDeletion(USER_ID)
    expect(result.scheduledFor).toBeDefined()
    // Scheduled ~30 days from now (within 1 minute tolerance)
    const diff = new Date(result.scheduledFor).getTime() - Date.now()
    expect(diff).toBeGreaterThan(29 * 24 * 60 * 60 * 1000)
    expect(diff).toBeLessThan(31 * 24 * 60 * 60 * 1000)
  })

  it('returns existing scheduledFor if request already pending', async () => {
    const existing = {
      id: 'req-001',
      status: 'pending',
      scheduled_for: '2026-05-15T00:00:00.000Z',
    }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(existing) as never)

    const result = await requestDeletion(USER_ID)
    expect(result.scheduledFor).toBe(existing.scheduled_for)
  })

  it('throws unprocessable if account already executed', async () => {
    const existing = { id: 'req-001', status: 'executed', scheduled_for: '2026-01-01T00:00:00Z' }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(existing) as never)

    await expect(requestDeletion(USER_ID)).rejects.toMatchObject({
      status: 422,
      type: 'unprocessable',
    })
  })

  it('throws db-error if insert fails', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(null) as never)
      .mockReturnValueOnce(mockChain(null, { message: 'insert error' }) as never)

    await expect(requestDeletion(USER_ID)).rejects.toMatchObject({
      status: 500,
      type: 'db-error',
    })
  })
})

// ─── cancelDeletion ──────────────────────────────────────────────────────

describe('cancelDeletion', () => {
  beforeEach(() => vi.clearAllMocks())

  it('cancels a pending deletion request', async () => {
    const pending = { id: 'req-001', status: 'pending' }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(pending) as never)
      .mockReturnValueOnce(mockChain(null) as never)

    await expect(cancelDeletion(USER_ID)).resolves.toBeUndefined()
  })

  it('throws not-found if no pending request exists', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(null) as never)

    await expect(cancelDeletion(USER_ID)).rejects.toMatchObject({
      status: 404,
      type: 'not-found',
    })
  })

  it('throws not-found if request is already cancelled', async () => {
    const cancelled = { id: 'req-001', status: 'cancelled' }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(cancelled) as never)

    await expect(cancelDeletion(USER_ID)).rejects.toMatchObject({
      status: 404,
      type: 'not-found',
    })
  })
})

// ─── getDeletionStatus ───────────────────────────────────────────────────

describe('getDeletionStatus', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns status none when no request exists', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(null) as never)

    const result = await getDeletionStatus(USER_ID)
    expect(result).toEqual({ status: 'none' })
  })

  it('returns pending status with scheduledFor and requestedAt', async () => {
    const row = {
      status: 'pending',
      scheduled_for: '2026-05-15T00:00:00.000Z',
      requested_at: '2026-04-15T00:00:00.000Z',
    }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(row) as never)

    const result = await getDeletionStatus(USER_ID)
    expect(result.status).toBe('pending')
    expect(result.scheduledFor).toBe(row.scheduled_for)
    expect(result.requestedAt).toBe(row.requested_at)
  })

  it('throws db-error on database failure', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(null, { message: 'connection error' }) as never,
    )

    await expect(getDeletionStatus(USER_ID)).rejects.toMatchObject({
      status: 500,
      type: 'db-error',
    })
  })
})

// ─── exportUserData ──────────────────────────────────────────────────────

describe('exportUserData', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns structured export with all sections', async () => {
    const profileData = {
      id: USER_ID,
      username: 'traveller',
      display_name: 'Test User',
    }

    // Mock all 6 concurrent DB calls
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(profileData) as never) // profile
      .mockReturnValueOnce(mockChain([]) as never) // content
      .mockReturnValueOnce(mockChain([]) as never) // bookings
      .mockReturnValueOnce(mockChain([]) as never) // reviews
      .mockReturnValueOnce(mockChain([]) as never) // saved lists
      .mockReturnValueOnce(mockChain([]) as never) // notif prefs

    const result = await exportUserData(USER_ID)

    expect(result.exportedAt).toBeDefined()
    expect(result.profile).toEqual(profileData)
    expect(Array.isArray(result.content)).toBe(true)
    expect(Array.isArray(result.bookings)).toBe(true)
    expect(Array.isArray(result.reviewsWritten)).toBe(true)
    expect(Array.isArray(result.savedLists)).toBe(true)
    expect(Array.isArray(result.notificationPreferences)).toBe(true)
  })

  it('returns empty arrays on partial DB failures (graceful degradation)', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(null, { message: 'error' }) as never) // profile error
      .mockReturnValueOnce(mockChain([{ id: 'c1' }]) as never) // content ok
      .mockReturnValueOnce(mockChain([]) as never)
      .mockReturnValueOnce(mockChain([]) as never)
      .mockReturnValueOnce(mockChain([]) as never)
      .mockReturnValueOnce(mockChain([]) as never)

    const result = await exportUserData(USER_ID)
    expect(result.profile).toEqual({})
    expect(result.content).toEqual([{ id: 'c1' }])
  })
})

// ─── recordConsent ───────────────────────────────────────────────────────

describe('recordConsent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts consent record and resolves void', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(null) as never)

    await expect(
      recordConsent(USER_ID, 'terms_of_service', 'v1.0', '1.2.3.4', 'Mozilla/5.0'),
    ).resolves.toBeUndefined()
  })

  it('throws db-error on insert failure', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(null, { message: 'insert failed' }) as never,
    )

    await expect(
      recordConsent(USER_ID, 'privacy_policy', 'v1.0', null, null),
    ).rejects.toMatchObject({ status: 500, type: 'db-error' })
  })
})

// ─── getConsentStatus ────────────────────────────────────────────────────

describe('getConsentStatus', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null for all types when no consents exist', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain([]) as never)

    const result = await getConsentStatus(USER_ID)
    expect(result).toEqual({
      terms_of_service: null,
      privacy_policy: null,
      content_tnc: null,
    })
  })

  it('returns latest version for each consent type', async () => {
    const rows = [
      { consent_type: 'terms_of_service', version: 'v1.2', consented_at: '2026-04-15' },
      { consent_type: 'privacy_policy', version: 'v2.0', consented_at: '2026-04-14' },
      { consent_type: 'terms_of_service', version: 'v1.1', consented_at: '2026-03-01' }, // older — ignored
    ]
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(rows) as never)

    const result = await getConsentStatus(USER_ID)
    expect(result.terms_of_service).toBe('v1.2') // latest first
    expect(result.privacy_policy).toBe('v2.0')
    expect(result.content_tnc).toBeNull()
  })

  it('throws db-error on database failure', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(null, { message: 'query failed' }) as never,
    )

    await expect(getConsentStatus(USER_ID)).rejects.toMatchObject({
      status: 500,
      type: 'db-error',
    })
  })
})
