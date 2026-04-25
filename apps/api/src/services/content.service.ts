import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import type {
  CreateContentInput,
  ContentListQueryInput,
  ContentType,
} from '@creatorhub/shared'

// ─── Types ──────────────────────────────────────────────────────

type ContentRow = Record<string, unknown>

type CreatorSummary = {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
}

// ─── createDraft ────────────────────────────────────────────────

export async function createDraft(
  userId: string,
  input: CreateContentInput,
): Promise<ContentRow> {
  const { data, error } = await supabase
    .from('content')
    .insert({
      user_id: userId,
      type: input.type,
      vertical: input.vertical,
      status: 'draft',
      visibility: 'public',
      pricing_model: 'free',
      price_paisa: 0,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new AppError('db-error', 500, 'Failed to create content draft')
  }

  return data
}

// ─── getById ────────────────────────────────────────────────────

export async function getById(
  contentId: string,
  requesterId?: string | null,
): Promise<{ content: ContentRow; media: ContentRow[]; creator: CreatorSummary }> {
  const { data: content, error } = await supabase
    .from('content')
    .select('*')
    .eq('id', contentId)
    .is('deleted_at', null)
    .single()

  if (error || !content) {
    throw new AppError('not-found', 404, 'Content not found')
  }

  // Visibility check: non-owners can only see published + public content
  const isOwner = requesterId != null && content.user_id === requesterId
  if (!isOwner) {
    if (content.status !== 'published' || content.visibility === 'private') {
      throw new AppError('not-found', 404, 'Content not found')
    }
  }

  // Fetch media
  const { data: media } = await supabase
    .from('content_media')
    .select('*')
    .eq('content_id', contentId)
    .order('display_order', { ascending: true })

  // Fetch creator profile
  const { data: creator } = await supabase
    .from('users')
    .select('id, display_name, username, avatar_url')
    .eq('id', content.user_id as string)
    .single()

  if (!creator) {
    throw new AppError('not-found', 404, 'Creator not found')
  }

  return {
    content,
    media: media ?? [],
    creator: {
      id: creator.id as string,
      display_name: (creator.display_name as string) ?? null,
      username: (creator.username as string) ?? null,
      avatar_url: (creator.avatar_url as string) ?? null,
    },
  }
}

// ─── updateDraft ────────────────────────────────────────────────

export async function updateDraft(
  contentId: string,
  userId: string,
  updates: Record<string, unknown>,
): Promise<ContentRow> {
  // Verify ownership and draft status
  const { data: existing, error: fetchError } = await supabase
    .from('content')
    .select('id, user_id, status')
    .eq('id', contentId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existing) {
    throw new AppError('not-found', 404, 'Content not found')
  }

  if (existing.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You do not own this content')
  }

  if (existing.status !== 'draft') {
    throw new AppError('unprocessable', 422, 'Only draft content can be edited')
  }

  // Strip enum fields that are empty strings — they fail DB CHECK constraints
  // and signal "not set yet" rather than an intentional clear.
  if (updates.vertical === '') delete (updates as Record<string, unknown>).vertical

  const { data, error } = await supabase
    .from('content')
    .update(updates)
    .eq('id', contentId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error || !data) {
    throw new AppError('db-error', 500, 'Failed to update content')
  }

  return data
}

// ─── listDrafts ─────────────────────────────────────────────────

export async function listDrafts(
  userId: string,
  type?: ContentType,
): Promise<ContentRow[]> {
  let query = supabase
    .from('content')
    .select('id, type, title, updated_at')
    .eq('user_id', userId)
    .eq('status', 'draft')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    throw new AppError('db-error', 500, 'Failed to fetch drafts')
  }

  return data ?? []
}

// ─── listPublished ──────────────────────────────────────────────

export async function listPublished(
  filters: ContentListQueryInput,
): Promise<{ items: ContentRow[]; next_cursor: string | null }> {
  const limit = filters.limit ?? 20

  let query = supabase
    .from('content')
    .select(`
      id, user_id, type, vertical, status, visibility, pricing_model,
      title, description, cover_image_url, starting_city_id, tags,
      like_count, comment_count, save_count, view_count,
      price_paisa, duration_minutes,
      published_at, created_at
    `)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1) // fetch one extra to detect has_more

  if (filters.type) {
    query = query.eq('type', filters.type)
  }

  if (filters.vertical) {
    query = query.eq('vertical', filters.vertical)
  }

  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id)
  }

  // Cursor-based pagination: cursor = base64(published_at|id)
  if (filters.cursor) {
    const decoded = decodeCursor(filters.cursor)
    if (decoded) {
      query = query.or(
        `published_at.lt.${decoded.published_at},and(published_at.eq.${decoded.published_at},id.lt.${decoded.id})`,
      )
    }
  }

  const { data, error } = await query

  if (error) {
    throw new AppError('db-error', 500, 'Failed to fetch content')
  }

  const items = data ?? []
  const hasMore = items.length > limit
  const resultItems = hasMore ? items.slice(0, limit) : items

  let nextCursor: string | null = null
  if (hasMore && resultItems.length > 0) {
    const last = resultItems[resultItems.length - 1]!
    nextCursor = encodeCursor(last.published_at as string, last.id as string)
  }

  return { items: resultItems, next_cursor: nextCursor }
}

// ─── softDelete ─────────────────────────────────────────────────

export async function softDelete(
  contentId: string,
  userId: string,
): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from('content')
    .select('id, user_id')
    .eq('id', contentId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existing) {
    throw new AppError('not-found', 404, 'Content not found')
  }

  if (existing.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You do not own this content')
  }

  const { error } = await supabase
    .from('content')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', contentId)
    .eq('user_id', userId)

  if (error) {
    throw new AppError('db-error', 500, 'Failed to delete content')
  }
}

// ─── Cursor helpers ─────────────────────────────────────────────

function encodeCursor(publishedAt: string, id: string): string {
  return Buffer.from(`${publishedAt}|${id}`).toString('base64url')
}

function decodeCursor(cursor: string): { published_at: string; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf-8')
    const [publishedAt, id] = decoded.split('|')
    if (!publishedAt || !id) return null
    return { published_at: publishedAt, id }
  } catch {
    return null
  }
}
