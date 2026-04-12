import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'

export interface SuggestedCreator {
  id: string
  display_name: string
  username: string
  avatar_url: string | null
  bio: string | null
  verticals: string[]
  follower_count: number
  is_following: boolean
  featured: boolean
}

export async function getSuggestedCreators(
  userId: string,
  limit: number = 20,
): Promise<SuggestedCreator[]> {
  // Get user's selected verticals
  const { data: userVerticals } = await supabase
    .from('user_active_verticals')
    .select('vertical')
    .eq('user_id', userId)

  const verticals = userVerticals?.map((v) => v.vertical) ?? []
  if (verticals.length === 0) return []

  // Get creators who have published content in user's verticals
  // Exclude already-followed and self
  const { data, error } = await supabase
    .from('users')
    .select('id, display_name, username, avatar_url, bio, follower_count, featured')
    .eq('is_creator', true)
    .not('id', 'eq', userId)
    .order('featured', { ascending: false })
    .order('follower_count', { ascending: false })
    .limit(limit)

  if (error) throw new AppError('db-error', 500, 'Failed to fetch suggested creators')

  // Get already-followed IDs
  const { data: followedData } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  const followedIds = new Set(followedData?.map((f) => f.following_id) ?? [])

  // Get each creator's verticals from their content
  const creators: SuggestedCreator[] = (data ?? [])
    .filter((u) => !followedIds.has(u.id))
    .map((u) => ({
      id: u.id,
      display_name: u.display_name ?? 'Creator',
      username: u.username ?? '',
      avatar_url: u.avatar_url,
      bio: u.bio,
      verticals: [], // simplified — would need join in production
      follower_count: u.follower_count ?? 0,
      is_following: false,
      featured: u.featured ?? false,
    }))

  return creators
}

export async function followCreator(
  followerId: string,
  followingId: string,
): Promise<void> {
  if (followerId === followingId) {
    throw new AppError('validation-failed', 422, 'Cannot follow yourself')
  }

  const { error } = await supabase
    .from('follows')
    .upsert({ follower_id: followerId, following_id: followingId })

  if (error) throw new AppError('db-error', 500, 'Failed to follow creator')

  // Increment follower count
  await supabase.rpc('increment_count', {
    table_name: 'users',
    column_name: 'follower_count',
    row_id: followingId,
    amount: 1,
  })
}

export async function unfollowCreator(
  followerId: string,
  followingId: string,
): Promise<void> {
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)

  if (error) throw new AppError('db-error', 500, 'Failed to unfollow creator')

  await supabase.rpc('increment_count', {
    table_name: 'users',
    column_name: 'follower_count',
    row_id: followingId,
    amount: -1,
  })
}

export async function completeOnboarding(userId: string): Promise<void> {
  // Validate prerequisites
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('current_city_id, onboarding_completed_at')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    throw new AppError('not-found', 404, 'User not found')
  }

  if (user.onboarding_completed_at) {
    return // Already completed — idempotent
  }

  if (!user.current_city_id) {
    throw new AppError('unprocessable', 422, 'City must be set before completing onboarding')
  }

  // Check verticals count
  const { count } = await supabase
    .from('user_active_verticals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if ((count ?? 0) < 3) {
    throw new AppError('unprocessable', 422, 'At least 3 verticals must be selected')
  }

  // Set completion timestamp
  const { error: updateError } = await supabase
    .from('users')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('id', userId)

  if (updateError) {
    throw new AppError('db-error', 500, 'Failed to complete onboarding')
  }
}

export async function setUserCity(userId: string, cityId: string): Promise<void> {
  // Verify city exists
  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('id, name, state')
    .eq('id', cityId)
    .eq('active', true)
    .single()

  if (cityError || !city) {
    throw new AppError('not-found', 404, 'City not found')
  }

  const { error } = await supabase
    .from('users')
    .update({ current_city_id: cityId })
    .eq('id', userId)

  if (error) throw new AppError('db-error', 500, 'Failed to set city')
}
