import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (must be declared before importing the service) ─────────────────

vi.mock('../lib/firebase.js', () => ({
  firebaseAuth: { verifyIdToken: vi.fn() },
}))

vi.mock('../lib/supabase.js', () => ({
  supabase: { from: vi.fn() },
}))

vi.mock('../utils/tokens.js', () => ({
  signAccessToken: vi.fn().mockResolvedValue('access.jwt.value'),
  signRefreshToken: vi.fn().mockResolvedValue('refresh.jwt.value'),
  verifyRefreshToken: vi.fn(),
  hashToken: vi.fn((t: string) => `hash-of-${t}`),
  generateDeviceId: vi.fn(() => 'generated-device-id'),
}))

vi.mock('./audit.service.js', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}))

import { registerOrSignIn, refreshSession, signOut, getUserProfile } from './auth.service.js'
import { firebaseAuth } from '../lib/firebase.js'
import { supabase } from '../lib/supabase.js'
import { verifyRefreshToken } from '../utils/tokens.js'
import { logAuditEvent } from './audit.service.js'

// ─── Chainable Supabase mock helper ────────────────────────────────────────

function mockChain(data: unknown, error: unknown = null) {
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: (onFulfilled: (v: unknown) => unknown, onRejected?: (r: unknown) => unknown) =>
      Promise.resolve({ data, error }).then(onFulfilled, onRejected),
  }
  return chain
}

// ─── Fixtures ──────────────────────────────────────────────────────────────

const FIREBASE_TOKEN = 'firebase.id.token'
const USER_ID = 'user-001'
const FIREBASE_UID = 'firebase-uid-001'
const PHONE = '+919999999999'

const decodedFirebase = {
  uid: FIREBASE_UID,
  phone_number: PHONE,
  email: null,
  name: null,
  firebase: { sign_in_provider: 'phone' },
} as never

const existingUser = {
  id: USER_ID,
  firebase_uid: FIREBASE_UID,
  phone: PHONE,
  email: null,
  display_name: null,
  username: 'tester',
  bio: null,
  avatar_url: null,
  is_creator: false,
  kyc_status: 'not_started',
  current_city_id: null,
  onboarding_completed_at: null,
  username_changed_at: null,
  follower_count: 0,
  following_count: 0,
  content_count: 0,
  created_at: '2026-04-01T00:00:00Z',
}

// ─── registerOrSignIn ──────────────────────────────────────────────────────

describe('registerOrSignIn', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when Firebase verifyIdToken rejects', async () => {
    vi.mocked(firebaseAuth.verifyIdToken).mockRejectedValueOnce(new Error('bad token'))

    await expect(registerOrSignIn(FIREBASE_TOKEN)).rejects.toMatchObject({
      status: 401,
      type: 'invalid-token',
    })
  })

  it('inserts a new user when none exists and returns isNew=true', async () => {
    vi.mocked(firebaseAuth.verifyIdToken).mockResolvedValueOnce(decodedFirebase)

    const lookup = mockChain(null) // no existing user
    const insert = mockChain(existingUser) // new user row returned
    const deviceInsert = mockChain(null) // device insert succeeds
    const profileFetch = mockChain(existingUser)
    const verticalsFetch = mockChain([])

    vi.mocked(supabase.from)
      .mockReturnValueOnce(lookup as never)
      .mockReturnValueOnce(insert as never)
      .mockReturnValueOnce(deviceInsert as never)
      .mockReturnValueOnce(profileFetch as never)
      .mockReturnValueOnce(verticalsFetch as never)

    const { result, isNew } = await registerOrSignIn(FIREBASE_TOKEN)

    expect(isNew).toBe(true)
    expect(result.is_new_user).toBe(true)
    expect(result.user.id).toBe(USER_ID)
    expect(result.tokens.access_token).toBe('access.jwt.value')
    expect(result.tokens.refresh_token).toBe('refresh.jwt.value')
    expect(result.tokens.expires_in).toBe(3600)
    expect(logAuditEvent).toHaveBeenCalledWith(
      USER_ID,
      'sign_up',
      expect.objectContaining({ provider: 'phone' }),
      undefined,
      undefined,
    )
  })

  it('updates existing user when lookup finds one and returns isNew=false', async () => {
    vi.mocked(firebaseAuth.verifyIdToken).mockResolvedValueOnce(decodedFirebase)

    const lookup = mockChain(existingUser)
    const update = mockChain(existingUser)
    const deviceInsert = mockChain(null)
    const profileFetch = mockChain(existingUser)
    const verticalsFetch = mockChain([])

    vi.mocked(supabase.from)
      .mockReturnValueOnce(lookup as never)
      .mockReturnValueOnce(update as never)
      .mockReturnValueOnce(deviceInsert as never)
      .mockReturnValueOnce(profileFetch as never)
      .mockReturnValueOnce(verticalsFetch as never)

    const { isNew } = await registerOrSignIn(FIREBASE_TOKEN)

    expect(isNew).toBe(false)
    expect(logAuditEvent).toHaveBeenCalledWith(
      USER_ID,
      'sign_in',
      expect.any(Object),
      undefined,
      undefined,
    )
  })

  it('throws 500 when new user insert fails', async () => {
    vi.mocked(firebaseAuth.verifyIdToken).mockResolvedValueOnce(decodedFirebase)

    const lookup = mockChain(null)
    const failedInsert = mockChain(null, { message: 'constraint violation' })

    vi.mocked(supabase.from)
      .mockReturnValueOnce(lookup as never)
      .mockReturnValueOnce(failedInsert as never)

    await expect(registerOrSignIn(FIREBASE_TOKEN)).rejects.toMatchObject({
      status: 500,
      type: 'db-error',
    })
  })

  it('throws 500 when existing user update fails', async () => {
    vi.mocked(firebaseAuth.verifyIdToken).mockResolvedValueOnce(decodedFirebase)

    const lookup = mockChain(existingUser)
    const failedUpdate = mockChain(null, { message: 'update failed' })

    vi.mocked(supabase.from)
      .mockReturnValueOnce(lookup as never)
      .mockReturnValueOnce(failedUpdate as never)

    await expect(registerOrSignIn(FIREBASE_TOKEN)).rejects.toMatchObject({
      status: 500,
      type: 'db-error',
    })
  })

  it('falls back to device update when device insert returns an error (existing device)', async () => {
    vi.mocked(firebaseAuth.verifyIdToken).mockResolvedValueOnce(decodedFirebase)

    const lookup = mockChain(existingUser)
    const update = mockChain(existingUser)
    const deviceInsertFail = mockChain(null, { message: 'unique violation' })
    const deviceUpdate = mockChain(null)
    const profileFetch = mockChain(existingUser)
    const verticalsFetch = mockChain([])

    vi.mocked(supabase.from)
      .mockReturnValueOnce(lookup as never)
      .mockReturnValueOnce(update as never)
      .mockReturnValueOnce(deviceInsertFail as never)
      .mockReturnValueOnce(deviceUpdate as never)
      .mockReturnValueOnce(profileFetch as never)
      .mockReturnValueOnce(verticalsFetch as never)

    const { result } = await registerOrSignIn(FIREBASE_TOKEN, {
      platform: 'ios',
      device_id: 'existing-device',
    })

    expect(result.user.id).toBe(USER_ID)
    // Fallback update branch hit — deviceUpdate chain was used
    expect(deviceUpdate.update).toHaveBeenCalled()
  })

  it('uses social:<uid> as phone fallback when Firebase token has no phone_number', async () => {
    vi.mocked(firebaseAuth.verifyIdToken).mockResolvedValueOnce({
      uid: FIREBASE_UID,
      phone_number: null,
      email: 'user@example.com',
      name: 'OAuth User',
      firebase: { sign_in_provider: 'google.com' },
    } as never)

    const lookup = mockChain(null)
    const insert = mockChain({ ...existingUser, phone: `social:${FIREBASE_UID}` })
    const deviceInsert = mockChain(null)
    const profileFetch = mockChain({ ...existingUser, phone: `social:${FIREBASE_UID}` })
    const verticalsFetch = mockChain([])

    vi.mocked(supabase.from)
      .mockReturnValueOnce(lookup as never)
      .mockReturnValueOnce(insert as never)
      .mockReturnValueOnce(deviceInsert as never)
      .mockReturnValueOnce(profileFetch as never)
      .mockReturnValueOnce(verticalsFetch as never)

    const { result } = await registerOrSignIn(FIREBASE_TOKEN)

    // Insert called with social fallback phone
    expect(insert.insert).toHaveBeenCalledWith(
      expect.objectContaining({ phone: `social:${FIREBASE_UID}` }),
    )
    expect(result.user.phone).toBe(`social:${FIREBASE_UID}`)
  })

  it('passes ip and userAgent through to logAuditEvent', async () => {
    vi.mocked(firebaseAuth.verifyIdToken).mockResolvedValueOnce(decodedFirebase)

    const lookup = mockChain(null)
    const insert = mockChain(existingUser)
    const deviceInsert = mockChain(null)
    const profileFetch = mockChain(existingUser)
    const verticalsFetch = mockChain([])

    vi.mocked(supabase.from)
      .mockReturnValueOnce(lookup as never)
      .mockReturnValueOnce(insert as never)
      .mockReturnValueOnce(deviceInsert as never)
      .mockReturnValueOnce(profileFetch as never)
      .mockReturnValueOnce(verticalsFetch as never)

    await registerOrSignIn(FIREBASE_TOKEN, undefined, '10.0.0.1', 'Mozilla/Test')

    expect(logAuditEvent).toHaveBeenCalledWith(
      USER_ID,
      'sign_up',
      expect.any(Object),
      '10.0.0.1',
      'Mozilla/Test',
    )
  })
})

// ─── refreshSession ────────────────────────────────────────────────────────

describe('refreshSession', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 401 when refresh token JWT is invalid', async () => {
    vi.mocked(verifyRefreshToken).mockRejectedValueOnce(new Error('expired'))

    await expect(refreshSession('bad.token')).rejects.toMatchObject({
      status: 401,
      type: 'token-expired',
    })
  })

  it('throws 401 and logs token_reuse when hash not found in DB', async () => {
    vi.mocked(verifyRefreshToken).mockResolvedValueOnce({
      sub: USER_ID,
      type: 'refresh',
      device_id: 'device-1',
    } as never)

    const deviceLookup = mockChain(null) // no device row matches
    vi.mocked(supabase.from).mockReturnValueOnce(deviceLookup as never)

    await expect(refreshSession('valid.but.revoked')).rejects.toMatchObject({
      status: 401,
      type: 'invalid-token',
    })

    expect(logAuditEvent).toHaveBeenCalledWith(
      USER_ID,
      'token_refresh',
      expect.objectContaining({ error: 'token_reuse' }),
      undefined,
      undefined,
    )
  })

  it('rotates tokens, updates stored hash and last_login_at on success', async () => {
    vi.mocked(verifyRefreshToken).mockResolvedValueOnce({
      sub: USER_ID,
      type: 'refresh',
      device_id: 'device-1',
    } as never)

    const deviceLookup = mockChain({ id: 'device-row-1', platform: 'ios' })
    const deviceUpdate = mockChain(null)
    const userUpdate = mockChain(null)

    vi.mocked(supabase.from)
      .mockReturnValueOnce(deviceLookup as never)
      .mockReturnValueOnce(deviceUpdate as never)
      .mockReturnValueOnce(userUpdate as never)

    const tokens = await refreshSession('valid.token')

    expect(tokens.access_token).toBe('access.jwt.value')
    expect(tokens.refresh_token).toBe('refresh.jwt.value')
    expect(tokens.expires_in).toBe(3600)
    expect(deviceUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({ refresh_token_hash: 'hash-of-refresh.jwt.value' }),
    )
    expect(userUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({ last_login_at: expect.any(String) }),
    )
    expect(logAuditEvent).toHaveBeenCalledWith(
      USER_ID,
      'token_refresh',
      expect.objectContaining({ device_id: 'device-1' }),
      undefined,
      undefined,
    )
  })

  it('defaults platform to android when stored device has no platform', async () => {
    vi.mocked(verifyRefreshToken).mockResolvedValueOnce({
      sub: USER_ID,
      type: 'refresh',
      device_id: 'device-1',
    } as never)

    const deviceLookup = mockChain({ id: 'device-row-1', platform: null })
    const deviceUpdate = mockChain(null)
    const userUpdate = mockChain(null)

    vi.mocked(supabase.from)
      .mockReturnValueOnce(deviceLookup as never)
      .mockReturnValueOnce(deviceUpdate as never)
      .mockReturnValueOnce(userUpdate as never)

    await expect(refreshSession('valid.token')).resolves.toBeDefined()
  })
})

// ─── signOut ───────────────────────────────────────────────────────────────

describe('signOut', () => {
  beforeEach(() => vi.clearAllMocks())

  it('clears the refresh_token_hash when a refresh token is provided', async () => {
    const update = mockChain(null)
    vi.mocked(supabase.from).mockReturnValueOnce(update as never)

    await signOut(USER_ID, 'refresh.token.value')

    expect(update.update).toHaveBeenCalledWith({ refresh_token_hash: null })
    expect(logAuditEvent).toHaveBeenCalledWith(
      USER_ID,
      'sign_out',
      {},
      undefined,
      undefined,
    )
  })

  it('still logs sign_out audit event when no refresh token is provided', async () => {
    await signOut(USER_ID)

    expect(supabase.from).not.toHaveBeenCalled()
    expect(logAuditEvent).toHaveBeenCalledWith(
      USER_ID,
      'sign_out',
      {},
      undefined,
      undefined,
    )
  })

  it('forwards ip and user-agent to logAuditEvent', async () => {
    await signOut(USER_ID, undefined, '1.2.3.4', 'agent')

    expect(logAuditEvent).toHaveBeenCalledWith(
      USER_ID,
      'sign_out',
      {},
      '1.2.3.4',
      'agent',
    )
  })
})

// ─── getUserProfile ────────────────────────────────────────────────────────

describe('getUserProfile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 404 when user does not exist', async () => {
    const userLookup = mockChain(null, { message: 'no rows' })
    vi.mocked(supabase.from).mockReturnValueOnce(userLookup as never)

    await expect(getUserProfile(USER_ID)).rejects.toMatchObject({
      status: 404,
      type: 'not-found',
    })
  })

  it('returns a profile with active verticals and no city when current_city_id is null', async () => {
    const userLookup = mockChain(existingUser)
    const verticalsLookup = mockChain([{ vertical: 'travel' }, { vertical: 'stories' }])

    vi.mocked(supabase.from)
      .mockReturnValueOnce(userLookup as never)
      .mockReturnValueOnce(verticalsLookup as never)

    const profile = await getUserProfile(USER_ID)

    expect(profile.id).toBe(USER_ID)
    expect(profile.active_verticals).toEqual(['travel', 'stories'])
    expect(profile.current_city).toBeNull()
  })

  it('returns a profile with current_city populated when city lookup succeeds', async () => {
    const userWithCity = { ...existingUser, current_city_id: 'city-01' }
    const userLookup = mockChain(userWithCity)
    const verticalsLookup = mockChain([])
    const cityLookup = mockChain({
      id: 'city-01',
      name: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
    })

    vi.mocked(supabase.from)
      .mockReturnValueOnce(userLookup as never)
      .mockReturnValueOnce(verticalsLookup as never)
      .mockReturnValueOnce(cityLookup as never)

    const profile = await getUserProfile(USER_ID)

    expect(profile.current_city).toEqual({
      id: 'city-01',
      name: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
    })
  })

  it('returns null current_city when city_id is set but city row is missing', async () => {
    const userWithCity = { ...existingUser, current_city_id: 'missing-city' }
    const userLookup = mockChain(userWithCity)
    const verticalsLookup = mockChain([])
    const cityLookup = mockChain(null) // city was deleted

    vi.mocked(supabase.from)
      .mockReturnValueOnce(userLookup as never)
      .mockReturnValueOnce(verticalsLookup as never)
      .mockReturnValueOnce(cityLookup as never)

    const profile = await getUserProfile(USER_ID)

    expect(profile.current_city).toBeNull()
  })
})
