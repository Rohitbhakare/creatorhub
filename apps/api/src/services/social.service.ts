import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import { sendPush } from './push.service.js'

// ─── Follow / Unfollow ────────────────────────────────────────

export async function followUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    throw new AppError('validation-failed', 400, 'Cannot follow yourself')
  }

  // Verify target user exists
  const { data: target, error: targetError } = await supabase
    .from('users')
    .select('id')
    .eq('id', followingId)
    .maybeSingle()

  if (targetError || !target) {
    throw new AppError('not-found', 404, 'User not found')
  }

  // Check if already following
  const { data: existing } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle()

  if (existing) {
    return { already_following: true }
  }

  const { error } = await supabase
    .from('follows')
    .insert({ follower_id: followerId, following_id: followingId })

  if (error) throw new AppError('db-error', 500, 'Failed to follow user')

  // Update counts in parallel
  await Promise.all([
    supabase.rpc('increment_count', {
      table_name: 'users',
      column_name: 'follower_count',
      row_id: followingId,
      amount: 1,
    }),
    supabase.rpc('increment_count', {
      table_name: 'users',
      column_name: 'following_count',
      row_id: followerId,
      amount: 1,
    }),
  ])

  // Fire-and-forget push notification to the person being followed
  void sendPush(followingId, {
    type: 'new_follower',
    title: 'New follower',
    body: 'Someone started following you',
    category: 'activity_own_content',
    data: { targetRoute: `/profile/${followerId}` },
  }).catch(() => {}) // never fail the follow operation

  return { already_following: false }
}

export async function unfollowUser(followerId: string, followingId: string) {
  if (followerId === followingId) {
    return // self-unfollow is a no-op
  }

  const { data, error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .select('follower_id')

  if (error) throw new AppError('db-error', 500, 'Failed to unfollow user')

  // Only decrement if a row was actually deleted
  if (data && data.length > 0) {
    await Promise.all([
      supabase.rpc('increment_count', {
        table_name: 'users',
        column_name: 'follower_count',
        row_id: followingId,
        amount: -1,
      }),
      supabase.rpc('increment_count', {
        table_name: 'users',
        column_name: 'following_count',
        row_id: followerId,
        amount: -1,
      }),
    ])
  }
}

export async function getFollowers(
  userId: string,
  cursor: string | null,
  limit: number,
) {
  let query = supabase
    .from('follows')
    .select('follower_id, created_at, users!follows_follower_id_fkey(id, display_name, username, avatar_url)')
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error } = await query

  if (error) throw new AppError('db-error', 500, 'Failed to fetch followers')

  const hasMore = (data?.length ?? 0) > limit
  const items = (data ?? []).slice(0, limit)
  const nextCursor = hasMore ? items[items.length - 1]!.created_at : null

  return {
    items: items.map((f) => ({
      user: f.users,
      followed_at: f.created_at,
    })),
    next_cursor: nextCursor,
  }
}

export async function getFollowing(
  userId: string,
  cursor: string | null,
  limit: number,
) {
  let query = supabase
    .from('follows')
    .select('following_id, created_at, users!follows_following_id_fkey(id, display_name, username, avatar_url)')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit + 1)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data, error } = await query

  if (error) throw new AppError('db-error', 500, 'Failed to fetch following')

  const hasMore = (data?.length ?? 0) > limit
  const items = (data ?? []).slice(0, limit)
  const nextCursor = hasMore ? items[items.length - 1]!.created_at : null

  return {
    items: items.map((f) => ({
      user: f.users,
      followed_at: f.created_at,
    })),
    next_cursor: nextCursor,
  }
}

// ─── Like / Unlike ───────────────────────────────────────────

export async function likeContent(userId: string, contentId: string) {
  // Verify content exists and is published
  const { data: content, error: contentError } = await supabase
    .from('content')
    .select('id, status')
    .eq('id', contentId)
    .maybeSingle()

  if (contentError || !content) {
    throw new AppError('not-found', 404, 'Content not found')
  }

  if (content.status !== 'published') {
    throw new AppError('not-found', 404, 'Content not found')
  }

  // Check if already liked
  const { data: existing } = await supabase
    .from('likes')
    .select('user_id')
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .maybeSingle()

  if (existing) {
    return { already_liked: true }
  }

  const { error } = await supabase
    .from('likes')
    .insert({ user_id: userId, content_id: contentId })

  if (error) throw new AppError('db-error', 500, 'Failed to like content')

  await supabase.rpc('increment_count', {
    table_name: 'content',
    column_name: 'like_count',
    row_id: contentId,
    amount: 1,
  })

  return { already_liked: false }
}

export async function unlikeContent(userId: string, contentId: string) {
  const { data, error } = await supabase
    .from('likes')
    .delete()
    .eq('user_id', userId)
    .eq('content_id', contentId)
    .select('user_id')

  if (error) throw new AppError('db-error', 500, 'Failed to unlike content')

  if (data && data.length > 0) {
    await supabase.rpc('increment_count', {
      table_name: 'content',
      column_name: 'like_count',
      row_id: contentId,
      amount: -1,
    })
  }
}

// ─── Share Tracking ──────────────────────────────────────────

const VALID_PLATFORMS = ['whatsapp', 'instagram', 'twitter', 'copy_link', 'other'] as const

export async function recordShare(
  userId: string | null,
  contentId: string,
  platform: string,
) {
  if (!VALID_PLATFORMS.includes(platform as typeof VALID_PLATFORMS[number])) {
    throw new AppError('validation-failed', 400, `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}`)
  }

  // Verify content exists
  const { data: content } = await supabase
    .from('content')
    .select('id')
    .eq('id', contentId)
    .maybeSingle()

  if (!content) {
    throw new AppError('not-found', 404, 'Content not found')
  }

  const { error } = await supabase
    .from('shares')
    .insert({
      user_id: userId,
      content_id: contentId,
      platform,
    })

  if (error) throw new AppError('db-error', 500, 'Failed to record share')
}
