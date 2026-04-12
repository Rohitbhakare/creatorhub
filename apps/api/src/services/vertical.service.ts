import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'

const VERTICALS = [
  'travel', 'stories', 'food', 'fitness',
  'education', 'photography', 'music', 'wellness',
] as const

export type VerticalType = typeof VERTICALS[number]

export interface VerticalInfo {
  slug: string
  name: string
  creator_count: number
}

const VERTICAL_NAMES: Record<string, string> = {
  travel: 'Travel',
  stories: 'Stories',
  food: 'Food',
  fitness: 'Fitness',
  education: 'Education',
  photography: 'Photography',
  music: 'Music',
  wellness: 'Wellness',
}

export async function getVerticalsWithCounts(): Promise<VerticalInfo[]> {
  // Get creator counts per vertical from published content
  const { data, error } = await supabase.rpc('get_vertical_creator_counts')

  const countMap = new Map<string, number>()
  if (!error && data) {
    for (const row of data) {
      countMap.set(row.vertical, Number(row.creator_count))
    }
  }

  return VERTICALS.map((slug) => ({
    slug,
    name: VERTICAL_NAMES[slug] ?? slug,
    creator_count: countMap.get(slug) ?? 0,
  }))
}

const WAITLIST_THRESHOLD = 10

export async function saveUserVerticals(
  userId: string,
  verticals: string[],
): Promise<void> {
  // Validate verticals
  const valid = verticals.filter((v) => VERTICALS.includes(v as VerticalType))
  if (valid.length < 3) {
    throw new AppError('validation-failed', 422, 'At least 3 verticals required')
  }

  // Delete existing and insert new (idempotent)
  const { error: deleteError } = await supabase
    .from('user_active_verticals')
    .delete()
    .eq('user_id', userId)

  if (deleteError) throw new AppError('db-error', 500, 'Failed to update verticals')

  const rows = valid.map((v) => ({ user_id: userId, vertical: v }))
  const { error: insertError } = await supabase
    .from('user_active_verticals')
    .insert(rows)

  if (insertError) throw new AppError('db-error', 500, 'Failed to save verticals')

  // Auto-waitlist verticals with low creator counts
  const counts = await getVerticalsWithCounts()
  const waitlisted = valid.filter((v) => {
    const info = counts.find((c) => c.slug === v)
    return info && info.creator_count <= WAITLIST_THRESHOLD
  })

  if (waitlisted.length > 0) {
    // Delete existing waitlist entries for this user
    await supabase
      .from('user_waitlisted_verticals')
      .delete()
      .eq('user_id', userId)

    const waitlistRows = waitlisted.map((v) => ({ user_id: userId, vertical: v }))
    await supabase
      .from('user_waitlisted_verticals')
      .insert(waitlistRows)
  }
}
