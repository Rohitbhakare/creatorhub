import { firebaseAuth } from '../lib/firebase.js'
import { supabase } from '../lib/supabase.js'
import {
  signAccessToken,
  signRefreshToken,
  hashToken,
  generateDeviceId,
  verifyRefreshToken,
  type Platform,
} from '../utils/tokens.js'
import { logAuditEvent } from './audit.service.js'
import type { AuthResult, TokenPair, UserProfile } from '@creatorhub/shared'
import { AppError } from '../errors/AppError.js'

type DeviceInfo = {
  platform: Platform
  device_id?: string | undefined
  app_version?: string | undefined
}

/**
 * Register or sign in a user using a Firebase ID token.
 * - Verifies the Firebase token server-side
 * - Upserts user record in DB
 * - Issues app session tokens (access + refresh)
 * - Logs device and audit event
 */
export async function registerOrSignIn(
  firebaseToken: string,
  deviceInfo?: DeviceInfo,
  ip?: string | null,
  userAgent?: string | null,
): Promise<{ result: AuthResult; isNew: boolean }> {
  // 1. Verify Firebase ID token
  const decoded = await firebaseAuth.verifyIdToken(firebaseToken).catch(() => {
    throw new AppError('invalid-token', 401, 'Invalid or expired Firebase token')
  })

  const firebaseUid = decoded.uid
  const phone = decoded.phone_number ?? null
  const email = decoded.email ?? null
  const displayName = decoded.name ?? decoded.display_name ?? null

  // 2. Upsert user — INSERT ON CONFLICT UPDATE
  const { data: user, error: upsertError } = await supabase
    .from('users')
    .upsert(
      {
        firebase_uid: firebaseUid,
        phone: phone ?? `social:${firebaseUid}`, // social logins might not have phone
        email,
        display_name: displayName,
        last_login_at: new Date().toISOString(),
      },
      { onConflict: 'firebase_uid' },
    )
    .select('*')
    .single()

  if (upsertError || !user) {
    throw new AppError('db-error', 500, 'Failed to create or update user record')
  }

  // Detect if this is a new user (created_at ~ now, no onboarding)
  const createdAt = new Date(user.created_at as string)
  const isNew = Date.now() - createdAt.getTime() < 5000 // created within last 5 seconds

  // 3. Generate device ID and tokens
  const platform = deviceInfo?.platform ?? 'android'
  const deviceId = deviceInfo?.device_id ?? generateDeviceId()

  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(user.id as string),
    signRefreshToken(user.id as string, deviceId, platform),
  ])

  // 4. Store device + refresh token hash
  await supabase.from('user_devices').upsert(
    {
      user_id: user.id,
      device_id: deviceId,
      platform,
      app_version: deviceInfo?.app_version ?? null,
      refresh_token_hash: hashToken(refreshToken),
      last_active_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,device_id', ignoreDuplicates: false },
  )

  // 5. Log audit event (fire-and-forget)
  void logAuditEvent(
    user.id as string,
    isNew ? 'sign_up' : 'sign_in',
    { provider: decoded.firebase?.sign_in_provider ?? 'phone', device_id: deviceId },
    ip,
    userAgent,
  )

  // 6. Build response
  const profile = await getUserProfile(user.id as string)
  const tokens: TokenPair = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 3600, // 1 hour in seconds
  }

  return {
    result: { user: profile, tokens, is_new_user: isNew },
    isNew,
  }
}

/**
 * Refresh an app session — rotates both tokens.
 * Old refresh token is revoked, new pair issued.
 */
export async function refreshSession(
  refreshTokenRaw: string,
  ip?: string | null,
  userAgent?: string | null,
): Promise<TokenPair> {
  // 1. Verify the refresh token JWT
  const payload = await verifyRefreshToken(refreshTokenRaw).catch(() => {
    throw new AppError('token-expired', 401, 'Refresh token is invalid or expired')
  })

  const userId = payload.sub!
  const deviceId = payload.device_id

  // 2. Check that the hash matches a stored device record
  const tokenHash = hashToken(refreshTokenRaw)
  const { data: device } = await supabase
    .from('user_devices')
    .select('id, platform')
    .eq('user_id', userId)
    .eq('refresh_token_hash', tokenHash)
    .single()

  if (!device) {
    // Token reuse or revoked — log security event
    void logAuditEvent(userId, 'token_refresh', { error: 'token_reuse', device_id: deviceId }, ip, userAgent)
    throw new AppError('invalid-token', 401, 'Refresh token has been revoked')
  }

  const platform = (device.platform as Platform) ?? 'android'

  // 3. Issue new token pair
  const [newAccess, newRefresh] = await Promise.all([
    signAccessToken(userId),
    signRefreshToken(userId, deviceId, platform),
  ])

  // 4. Rotate: update the stored hash to the new refresh token
  await supabase
    .from('user_devices')
    .update({
      refresh_token_hash: hashToken(newRefresh),
      last_active_at: new Date().toISOString(),
    })
    .eq('id', device.id)

  // 5. Update last_login_at
  await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId)

  void logAuditEvent(userId, 'token_refresh', { device_id: deviceId }, ip, userAgent)

  return {
    access_token: newAccess,
    refresh_token: newRefresh,
    expires_in: 3600,
  }
}

/**
 * Sign out — revokes the refresh token for the current device.
 * Idempotent: no error if already signed out.
 */
export async function signOut(
  userId: string,
  refreshTokenRaw?: string,
  ip?: string | null,
  userAgent?: string | null,
): Promise<void> {
  if (refreshTokenRaw) {
    const tokenHash = hashToken(refreshTokenRaw)
    await supabase
      .from('user_devices')
      .update({ refresh_token_hash: null })
      .eq('user_id', userId)
      .eq('refresh_token_hash', tokenHash)
  }

  void logAuditEvent(userId, 'sign_out', {}, ip, userAgent)
}

/**
 * Fetch the full user profile with active verticals and city.
 */
export async function getUserProfile(userId: string): Promise<UserProfile> {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !user) {
    throw new AppError('not-found', 404, 'User not found')
  }

  // Fetch active verticals
  const { data: verticals } = await supabase
    .from('user_active_verticals')
    .select('vertical')
    .eq('user_id', userId)

  // Fetch city if set
  let currentCity = null
  if (user.current_city_id) {
    const { data: city } = await supabase
      .from('cities')
      .select('id, name, state, country')
      .eq('id', user.current_city_id)
      .single()

    if (city) {
      currentCity = {
        id: city.id as string,
        name: city.name as string,
        state: city.state as string,
        country: city.country as string,
      }
    }
  }

  return {
    id: user.id as string,
    phone: user.phone as string,
    display_name: (user.display_name as string) ?? null,
    username: (user.username as string) ?? null,
    bio: (user.bio as string) ?? null,
    email: (user.email as string) ?? null,
    avatar_url: (user.avatar_url as string) ?? null,
    is_creator: user.is_creator as boolean,
    kyc_status: user.kyc_status as UserProfile['kyc_status'],
    current_city: currentCity,
    active_verticals: (verticals ?? []).map((v) => v.vertical as UserProfile['active_verticals'][number]),
    onboarding_completed_at: (user.onboarding_completed_at as string) ?? null,
    username_changed_at: (user.username_changed_at as string) ?? null,
    follower_count: user.follower_count as number,
    following_count: user.following_count as number,
    content_count: user.content_count as number,
    created_at: user.created_at as string,
  }
}
