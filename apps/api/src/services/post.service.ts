import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import {
  createDraft,
  getById,
  updateDraft,
  listPublished,
} from './content.service.js'
import { publish } from './content-state.service.js'
import {
  MAX_POST_TEXT_LENGTH,
  MAX_IMAGES_PER_POST,
} from '@creatorhub/shared'
import type {
  CreateContentInput,
  UpdatePostInput,
  ContentListQueryInput,
} from '@creatorhub/shared'

// ─── Types ──────────────────────────────────────────────────────

type ContentRow = Record<string, unknown>

type CreatorSummary = {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
}

type PostDetailResult = {
  content: ContentRow
  media: ContentRow[]
  creator: CreatorSummary & { follower_count: number; post_count: number; joined_at: string | null }
  is_liked: boolean
  is_saved: boolean
}

type PostListResult = {
  items: Array<ContentRow & { creator: CreatorSummary | null }>
  next_cursor: string | null
}

// ─── createPostDraft ────────────────────────────────────────────

export async function createPostDraft(
  userId: string,
  input: { vertical: CreateContentInput['vertical'] },
): Promise<ContentRow> {
  return createDraft(userId, {
    type: 'post',
    vertical: input.vertical,
  })
}

// ─── getPostDetail ──────────────────────────────────────────────

export async function getPostDetail(
  contentId: string,
  requesterId?: string | null,
): Promise<PostDetailResult> {
  const result = await getById(contentId, requesterId)

  // Verify it's actually a post
  if (result.content.type !== 'post') {
    throw new AppError('not-found', 404, 'Post not found')
  }

  // Fetch creator stats in parallel
  const [creatorFullRes, postCountRes] = await Promise.all([
    supabase
      .from('users')
      .select('follower_count, created_at')
      .eq('id', result.creator.id)
      .single(),
    supabase
      .from('content')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', result.creator.id)
      .eq('status', 'published'),
  ])

  // Determine is_liked and is_saved for the requester
  let isLiked = false
  let isSaved = false

  // TODO: implement when social epic adds likes/saves tables
  // For now, always return false
  if (requesterId) {
    isLiked = false
    isSaved = false
  }

  return {
    content: result.content,
    media: result.media,
    creator: {
      ...result.creator,
      follower_count: (creatorFullRes.data?.follower_count as number) ?? 0,
      post_count: postCountRes.count ?? 0,
      joined_at: (creatorFullRes.data?.created_at as string | null) ?? null,
    },
    is_liked: isLiked,
    is_saved: isSaved,
  }
}

// ─── updatePost ─────────────────────────────────────────────────

export async function updatePost(
  contentId: string,
  userId: string,
  updates: UpdatePostInput,
): Promise<ContentRow> {
  // Validate post-specific body length
  if (updates.body !== undefined && updates.body.length > MAX_POST_TEXT_LENGTH) {
    throw new AppError(
      'validation-failed',
      400,
      `Post body must not exceed ${MAX_POST_TEXT_LENGTH.toString()} characters`,
    )
  }

  return updateDraft(contentId, userId, updates as Record<string, unknown>)
}

// ─── publishPost ────────────────────────────────────────────────

export async function publishPost(
  contentId: string,
  userId: string,
  tncAccepted: boolean,
): Promise<ContentRow> {
  // Pre-validate post-specific requirements before delegating to state machine
  const { data: content, error: fetchError } = await supabase
    .from('content')
    .select('*')
    .eq('id', contentId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !content) {
    throw new AppError('not-found', 404, 'Post not found')
  }

  if (content.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You do not own this post')
  }

  if (content.type !== 'post') {
    throw new AppError('unprocessable', 422, 'This endpoint is for posts only')
  }

  // Validate title
  const title = (content.title as string) ?? ''
  if (title.trim().length < 5 || title.trim().length > 100) {
    throw new AppError('validation-failed', 400, 'Post title must be between 5 and 100 characters')
  }

  // Validate body
  const body = (content.body as string) ?? ''
  if (body.trim().length === 0) {
    throw new AppError('validation-failed', 400, 'Post body is required')
  }
  if (body.trim().length > MAX_POST_TEXT_LENGTH) {
    throw new AppError(
      'validation-failed',
      400,
      `Post body must not exceed ${MAX_POST_TEXT_LENGTH.toString()} characters`,
    )
  }

  // Validate at least 1 media image
  const { count: mediaCount, error: mediaError } = await supabase
    .from('content_media')
    .select('id', { count: 'exact', head: true })
    .eq('content_id', contentId)
    .eq('media_type', 'image')

  if (mediaError || (mediaCount ?? 0) === 0) {
    throw new AppError('validation-failed', 400, 'Posts require at least 1 image')
  }

  if ((mediaCount ?? 0) > MAX_IMAGES_PER_POST) {
    throw new AppError(
      'validation-failed',
      400,
      `Posts can have at most ${MAX_IMAGES_PER_POST.toString()} images`,
    )
  }

  // Validate vertical is set
  if (!content.vertical) {
    throw new AppError('validation-failed', 400, 'Post vertical is required')
  }

  // Force pricing_model='free' and price_paisa=0 before publishing
  await supabase
    .from('content')
    .update({ pricing_model: 'free', price_paisa: 0 })
    .eq('id', contentId)
    .eq('user_id', userId)

  // No KYC check for posts — explicitly skipped

  // Delegate to state machine for the actual status transition
  return publish(contentId, userId, tncAccepted)
}

// ─── listPosts ──────────────────────────────────────────────────

export async function listPosts(
  filters: ContentListQueryInput,
): Promise<PostListResult> {
  // Force type to 'post'
  const postFilters: ContentListQueryInput = {
    ...filters,
    type: 'post',
  }

  const { items, next_cursor } = await listPublished(postFilters)

  // Fetch creator summaries for all items
  const userIds = [...new Set(items.map((i) => i.user_id as string))]
  const creators = await fetchCreatorSummaries(userIds)

  const enrichedItems = items.map((item) => ({
    ...item,
    creator: creators.get(item.user_id as string) ?? null,
  }))

  return { items: enrichedItems, next_cursor }
}

// ─── Helpers ────────────────────────────────────────────────────

async function fetchCreatorSummaries(
  userIds: string[],
): Promise<Map<string, CreatorSummary>> {
  if (userIds.length === 0) return new Map()

  const { data } = await supabase
    .from('users')
    .select('id, display_name, username, avatar_url')
    .in('id', userIds)

  const map = new Map<string, CreatorSummary>()
  for (const u of data ?? []) {
    map.set(u.id as string, {
      id: u.id as string,
      display_name: (u.display_name as string) ?? null,
      username: (u.username as string) ?? null,
      avatar_url: (u.avatar_url as string) ?? null,
    })
  }
  return map
}
