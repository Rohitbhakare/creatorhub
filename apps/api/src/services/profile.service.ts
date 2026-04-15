import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import { USERNAME_CHANGE_COOLDOWN_DAYS } from '@creatorhub/shared'

const RESERVED_USERNAMES = [
  'admin', 'api', 'www', 'help', 'support', 'about', 'terms', 'privacy',
  'settings', 'search', 'explore', 'studio', 'creator', 'creatorhub',
  'login', 'signup', 'signin', 'register', 'profile', 'null', 'undefined',
]

// ─── Public Profile ────────────────────────────────────────────

export async function getPublicProfile(userId: string, viewerId?: string | null) {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, display_name, username, bio, avatar_url, is_creator, current_city_id, follower_count, following_count, content_count, created_at')
    .eq('id', userId)
    .single()

  if (error || !user) {
    throw new AppError('not-found', 404, 'User not found')
  }

  // Fetch verticals, city, and is_following in parallel
  const [verticalsResult, cityResult, followResult] = await Promise.all([
    supabase
      .from('user_active_verticals')
      .select('vertical')
      .eq('user_id', userId),
    user.current_city_id
      ? supabase
          .from('cities')
          .select('id, name, state')
          .eq('id', user.current_city_id)
          .single()
      : Promise.resolve({ data: null }),
    viewerId && viewerId !== userId
      ? supabase
          .from('follows')
          .select('follower_id')
          .eq('follower_id', viewerId)
          .eq('following_id', userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const city = cityResult.data
    ? { id: cityResult.data.id, name: cityResult.data.name, state: cityResult.data.state }
    : null

  return {
    id: user.id,
    display_name: user.display_name ?? null,
    username: user.username ?? null,
    bio: user.bio ?? null,
    avatar_url: user.avatar_url ?? null,
    is_creator: user.is_creator,
    current_city: city,
    active_verticals: (verticalsResult.data ?? []).map((v) => v.vertical),
    follower_count: user.follower_count ?? 0,
    following_count: user.following_count ?? 0,
    content_count: user.content_count ?? 0,
    is_following: followResult.data !== null,
    created_at: user.created_at,
  }
}

// ─── Update Profile ────────────────────────────────────────────

export async function updateProfile(
  userId: string,
  data: { display_name?: string; bio?: string; email?: string; avatar_url?: string },
) {
  const { data: updated, error } = await supabase
    .from('users')
    .update(data)
    .eq('id', userId)
    .select('id, display_name, username, bio, email, avatar_url')
    .single()

  if (error || !updated) {
    throw new AppError('db-error', 500, 'Failed to update profile')
  }

  return updated
}

// ─── Update Username ───────────────────────────────────────────

export async function updateUsername(userId: string, username: string) {
  // Check reserved words
  if (RESERVED_USERNAMES.includes(username)) {
    throw new AppError('validation-failed', 422, 'This username is not available')
  }

  // Check cooldown + uniqueness in parallel
  const [{ data: user }, { data: existing }] = await Promise.all([
    supabase
      .from('users')
      .select('username_changed_at')
      .eq('id', userId)
      .single(),
    supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .neq('id', userId)
      .maybeSingle(),
  ])

  if (user?.username_changed_at) {
    const lastChanged = new Date(user.username_changed_at as string)
    const cooldownEnd = new Date(lastChanged.getTime() + USERNAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
    if (new Date() < cooldownEnd) {
      throw new AppError(
        'rate-limited',
        429,
        `Username can be changed again after ${cooldownEnd.toISOString().split('T')[0]}`,
      )
    }
  }

  if (existing) {
    throw new AppError('conflict', 409, 'Username is already taken')
  }

  // Update
  const { data: updated, error } = await supabase
    .from('users')
    .update({ username, username_changed_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id, username, username_changed_at')
    .single()

  if (error || !updated) {
    throw new AppError('db-error', 500, 'Failed to update username')
  }

  return updated
}

// ─── Profile Completion ────────────────────────────────────────

export async function getProfileCompletion(userId: string) {
  const [{ data: user, error }, { count }] = await Promise.all([
    supabase
      .from('users')
      .select('display_name, avatar_url, bio, current_city_id')
      .eq('id', userId)
      .single(),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId),
  ])

  if (error || !user) {
    throw new AppError('not-found', 404, 'User not found')
  }

  const followCount = count ?? 0

  const items = [
    { key: 'avatar', label: 'Add a profile photo', done: !!user.avatar_url },
    { key: 'name', label: 'Add your name', done: !!user.display_name },
    { key: 'bio', label: 'Write a short bio', done: !!user.bio },
    { key: 'city', label: 'Set your location', done: !!user.current_city_id },
    { key: 'follows', label: 'Follow 3 creators', done: followCount >= 3 },
  ]

  const completed = items.filter((i) => i.done).length
  const total = items.length
  const percentage = Math.round((completed / total) * 100)

  return { percentage, completed, total, items }
}
