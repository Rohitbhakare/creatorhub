import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'

// ─── Register Device ──────────────────────────────────────────

export async function registerDevice(
  userId: string,
  fcmToken: string,
  platform: 'ios' | 'android' | 'web',
  deviceInfo?: Record<string, unknown>,
): Promise<void> {
  const row: Record<string, unknown> = {
    user_id: userId,
    fcm_token: fcmToken,
    platform,
    last_active_at: new Date().toISOString(),
  }

  if (deviceInfo !== undefined) {
    row.device_info = deviceInfo
  }

  const { error } = await supabase
    .from('devices')
    .upsert(row, { onConflict: 'fcm_token' })

  if (error) throw new AppError('db-error', 500, 'Failed to register device')
}

// ─── Unregister Device ────────────────────────────────────────

export async function unregisterDevice(userId: string, tokenId: string): Promise<void> {
  const { data, error } = await supabase
    .from('devices')
    .delete()
    .eq('id', tokenId)
    .eq('user_id', userId)
    .select('id')

  if (error) throw new AppError('db-error', 500, 'Failed to unregister device')

  if (!data || data.length === 0) {
    throw new AppError('not-found', 404, 'Device token not found')
  }
}

// ─── Get User Device Tokens ───────────────────────────────────

export async function getUserDeviceTokens(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('devices')
    .select('fcm_token')
    .eq('user_id', userId)

  if (error) throw new AppError('db-error', 500, 'Failed to fetch device tokens')

  return (data ?? []).map((d) => d.fcm_token as string)
}
