import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import { sendPush } from './push.service.js'

const MAX_COMMENT_LENGTH = 500

// ─── Add Comment ─────────────────────────────────────────────

export async function addComment(
  userId: string,
  contentId: string,
  body: string,
  parentId?: string | null,
) {
  if (!body || body.trim().length === 0) {
    throw new AppError('validation-failed', 400, 'Comment body cannot be empty')
  }

  if (body.length > MAX_COMMENT_LENGTH) {
    throw new AppError('validation-failed', 400, `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters`)
  }

  // Verify content exists and is published
  const { data: content, error: contentError } = await supabase
    .from('content')
    .select('id, status, user_id')
    .eq('id', contentId)
    .maybeSingle()

  if (contentError || !content) {
    throw new AppError('not-found', 404, 'Content not found')
  }

  if (content.status !== 'published') {
    throw new AppError('not-found', 404, 'Content not found')
  }

  // Validate parent comment if replying
  if (parentId) {
    const { data: parent, error: parentError } = await supabase
      .from('comments')
      .select('id, content_id, parent_id, deleted_at')
      .eq('id', parentId)
      .maybeSingle()

    if (parentError || !parent) {
      throw new AppError('not-found', 404, 'Parent comment not found')
    }

    if (parent.content_id !== contentId) {
      throw new AppError('validation-failed', 400, 'Parent comment belongs to a different content')
    }

    // Only one level of threading allowed
    if (parent.parent_id !== null) {
      throw new AppError('validation-failed', 422, 'Only one level of threading allowed')
    }
  }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      content_id: contentId,
      user_id: userId,
      parent_id: parentId ?? null,
      body: body.trim(),
    })
    .select('id, content_id, user_id, parent_id, body, is_edited, created_at')
    .single()

  if (error || !comment) {
    throw new AppError('db-error', 500, 'Failed to add comment')
  }

  // Increment comment count on content
  await supabase.rpc('increment_count', {
    table_name: 'content',
    column_name: 'comment_count',
    row_id: contentId,
    amount: 1,
  })

  // Fire-and-forget push notification to content owner (skip if commenter is owner)
  const contentOwnerId = content.user_id as string
  if (contentOwnerId !== userId) {
    void sendPush(contentOwnerId, {
      type: 'new_comment',
      title: 'New comment',
      body: 'Someone commented on your content',
      category: 'activity_own_content',
      data: { targetRoute: `/content/${contentId}` },
    }).catch(() => {}) // never fail the comment operation
  }

  return comment
}

// ─── Edit Comment ────────────────────────────────────────────

export async function editComment(
  userId: string,
  commentId: string,
  body: string,
) {
  if (!body || body.trim().length === 0) {
    throw new AppError('validation-failed', 400, 'Comment body cannot be empty')
  }

  if (body.length > MAX_COMMENT_LENGTH) {
    throw new AppError('validation-failed', 400, `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters`)
  }

  // Fetch comment and verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('comments')
    .select('id, user_id, deleted_at')
    .eq('id', commentId)
    .maybeSingle()

  if (fetchError || !existing) {
    throw new AppError('not-found', 404, 'Comment not found')
  }

  if (existing.deleted_at) {
    throw new AppError('not-found', 404, 'Comment not found')
  }

  if (existing.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You can only edit your own comments')
  }

  const { data: updated, error } = await supabase
    .from('comments')
    .update({ body: body.trim(), is_edited: true })
    .eq('id', commentId)
    .select('id, content_id, user_id, parent_id, body, is_edited, created_at, updated_at')
    .single()

  if (error || !updated) {
    throw new AppError('db-error', 500, 'Failed to edit comment')
  }

  return updated
}

// ─── Delete Comment ──────────────────────────────────────────

export async function deleteComment(userId: string, commentId: string) {
  const { data: existing, error: fetchError } = await supabase
    .from('comments')
    .select('id, user_id, content_id, deleted_at')
    .eq('id', commentId)
    .maybeSingle()

  if (fetchError || !existing) {
    throw new AppError('not-found', 404, 'Comment not found')
  }

  if (existing.deleted_at) {
    throw new AppError('not-found', 404, 'Comment not found')
  }

  if (existing.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You can only delete your own comments')
  }

  // Soft delete
  const { error } = await supabase
    .from('comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId)

  if (error) throw new AppError('db-error', 500, 'Failed to delete comment')

  // Decrement comment count
  await supabase.rpc('increment_count', {
    table_name: 'content',
    column_name: 'comment_count',
    row_id: existing.content_id,
    amount: -1,
  })
}

// ─── List Comments ───────────────────────────────────────────

export async function listComments(
  contentId: string,
  cursor: string | null,
  limit: number,
) {
  // Fetch top-level comments (parent_id IS NULL)
  let query = supabase
    .from('comments')
    .select(`
      id, content_id, user_id, parent_id, body, is_edited, deleted_at, created_at,
      users!comments_user_id_fkey(id, display_name, username, avatar_url)
    `)
    .eq('content_id', contentId)
    .is('parent_id', null)
    .order('created_at', { ascending: true })
    .limit(limit + 1)

  if (cursor) {
    query = query.gt('created_at', cursor)
  }

  const { data: topLevel, error } = await query

  if (error) throw new AppError('db-error', 500, 'Failed to fetch comments')

  const hasMore = (topLevel?.length ?? 0) > limit
  const items = (topLevel ?? []).slice(0, limit)
  const nextCursor = hasMore ? items[items.length - 1]!.created_at : null

  // Fetch replies for these top-level comments
  const parentIds = items.map((c) => c.id)
  let replies: typeof items = []

  if (parentIds.length > 0) {
    const { data: replyData, error: replyError } = await supabase
      .from('comments')
      .select(`
        id, content_id, user_id, parent_id, body, is_edited, deleted_at, created_at,
        users!comments_user_id_fkey(id, display_name, username, avatar_url)
      `)
      .eq('content_id', contentId)
      .in('parent_id', parentIds)
      .order('created_at', { ascending: true })

    if (replyError) throw new AppError('db-error', 500, 'Failed to fetch replies')
    replies = replyData ?? []
  }

  // Group replies by parent
  const repliesByParent = new Map<string, typeof replies>()
  for (const reply of replies) {
    const pid = reply.parent_id!
    if (!repliesByParent.has(pid)) repliesByParent.set(pid, [])
    repliesByParent.get(pid)!.push(reply)
  }

  // Format comments with nested replies
  const formatted = items.map((c) => ({
    id: c.id,
    user: c.users,
    body: c.deleted_at ? null : c.body,
    is_edited: c.is_edited,
    is_deleted: !!c.deleted_at,
    created_at: c.created_at,
    replies: (repliesByParent.get(c.id) ?? []).map((r) => ({
      id: r.id,
      user: r.users,
      body: r.deleted_at ? null : r.body,
      is_edited: r.is_edited,
      is_deleted: !!r.deleted_at,
      created_at: r.created_at,
    })),
  }))

  return { items: formatted, next_cursor: nextCursor }
}
