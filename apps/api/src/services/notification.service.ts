import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'

// ─── Constants ────────────────────────────────────────────────

export const CATEGORIES = [
  'bookings_trips',
  'messages_creators',
  'new_content_followed',
  'activity_own_content',
  'platform_updates',
  'promotions',
] as const

export const CHANNELS = ['push', 'whatsapp', 'email'] as const

export type NotificationCategory = (typeof CATEGORIES)[number]
export type NotificationChannel = (typeof CHANNELS)[number]

// Default preferences per NOT-FR-005
// bookings_trips: push=ON, whatsapp=ON(locked), email=ON
// messages_creators: push=ON, whatsapp=OFF, email=ON
// new_content_followed: push=ON, whatsapp=OFF, email=ON
// activity_own_content: push=ON, whatsapp=OFF, email=ON
// platform_updates: push=ON, whatsapp=OFF, email=ON
// promotions: push=OFF, whatsapp=OFF, email=OFF

const DEFAULTS: Record<NotificationCategory, Record<NotificationChannel, boolean>> = {
  bookings_trips: { push: true, whatsapp: true, email: true },
  messages_creators: { push: true, whatsapp: false, email: true },
  new_content_followed: { push: true, whatsapp: false, email: true },
  activity_own_content: { push: true, whatsapp: false, email: true },
  platform_updates: { push: true, whatsapp: false, email: true },
  promotions: { push: false, whatsapp: false, email: false },
}

// ─── Types ────────────────────────────────────────────────────

export interface NotificationPreference {
  category: string
  channel: string
  enabled: boolean
}

// ─── Get Preferences ─────────────────────────────────────────

export async function getPreferences(userId: string): Promise<NotificationPreference[]> {
  const { data, error } = await supabase
    .from('user_notification_preferences')
    .select('category, channel, enabled')
    .eq('user_id', userId)

  if (error) throw new AppError('db-error', 500, 'Failed to fetch notification preferences')

  return (data ?? []).map((row) => ({
    category: row.category as string,
    channel: row.channel as string,
    enabled: row.enabled as boolean,
  }))
}

// ─── Update Preferences ──────────────────────────────────────

export async function updatePreferences(
  userId: string,
  updates: { category: string; channel: string; enabled: boolean }[],
): Promise<void> {
  // Validate: bookings_trips + whatsapp cannot be disabled
  for (const update of updates) {
    if (update.category === 'bookings_trips' && update.channel === 'whatsapp' && !update.enabled) {
      throw new AppError(
        'validation-failed',
        400,
        'Booking WhatsApp notifications cannot be disabled',
      )
    }
  }

  const rows = updates.map((u) => ({
    user_id: userId,
    category: u.category,
    channel: u.channel,
    enabled: u.enabled,
  }))

  const { error } = await supabase
    .from('user_notification_preferences')
    .upsert(rows, { onConflict: 'user_id,category,channel' })

  if (error) throw new AppError('db-error', 500, 'Failed to update notification preferences')
}

// ─── Insert Default Preferences ─────────────────────────────

export async function insertDefaultPreferences(userId: string): Promise<void> {
  const rows: { user_id: string; category: string; channel: string; enabled: boolean }[] = []

  for (const category of CATEGORIES) {
    for (const channel of CHANNELS) {
      rows.push({
        user_id: userId,
        category,
        channel,
        enabled: DEFAULTS[category][channel],
      })
    }
  }

  const { error } = await supabase
    .from('user_notification_preferences')
    .upsert(rows, { onConflict: 'user_id,category,channel', ignoreDuplicates: true })

  if (error) throw new AppError('db-error', 500, 'Failed to insert default preferences')
}

// ─── DND Status ───────────────────────────────────────────────

export async function getDndStatus(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('dnd_enabled')
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) return false

  return data.dnd_enabled === true
}

export async function setDndStatus(userId: string, enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ dnd_enabled: enabled })
    .eq('id', userId)

  if (error) throw new AppError('db-error', 500, 'Failed to update DND status')
}
