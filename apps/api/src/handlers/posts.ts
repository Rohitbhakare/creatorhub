import type { Context } from 'hono'
import {
  createPostDraft,
  getPostDetail,
  updatePost,
  publishPost,
  listPosts,
} from '../services/post.service.js'
import { recordConsent } from '../services/tnc.service.js'
import { extractIp } from '../services/audit.service.js'
import type {
  CreateContentInput,
  UpdatePostInput,
  PublishContentInput,
  ContentListQueryInput,
} from '@creatorhub/shared'

/**
 * POST /api/v1/posts
 * Create a new post draft.
 */
export async function handleCreatePostDraft(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const body = c.get('validatedBody') as CreateContentInput

  const content = await createPostDraft(userId, { vertical: body.vertical })

  c.header('Location', `/api/v1/posts/${content.id as string}`)
  return c.json({ success: true, data: content }, 201)
}

/**
 * GET /api/v1/posts/:id
 * Get post detail with media, creator profile, and interaction state.
 */
export async function handleGetPostDetail(c: Context): Promise<Response> {
  const contentId = c.req.param('id')!
  const requesterId = (c.get('userId') as string | null) ?? undefined

  const result = await getPostDetail(contentId, requesterId)

  return c.json({
    success: true,
    data: {
      ...result.content,
      media: result.media,
      creator: result.creator,
      is_liked: result.is_liked,
      is_saved: result.is_saved,
    },
  })
}

/**
 * PUT /api/v1/posts/:id
 * Update a post draft.
 */
export async function handleUpdatePost(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const body = c.get('validatedBody') as UpdatePostInput

  const content = await updatePost(contentId, userId, body)

  return c.json({ success: true, data: content })
}

/**
 * POST /api/v1/posts/:id/publish
 * Publish a post draft.
 */
export async function handlePublishPost(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const body = c.get('validatedBody') as PublishContentInput
  const ip = extractIp(c.req.raw.headers)
  const userAgent = c.req.header('User-Agent') ?? null

  // Record T&C consent
  void recordConsent(userId, contentId, ip, userAgent)

  const content = await publishPost(contentId, userId, body.tnc_accepted)

  return c.json({ success: true, data: content })
}

/**
 * GET /api/v1/posts
 * List published posts with cursor pagination.
 */
export async function handleListPosts(c: Context): Promise<Response> {
  const query = c.get('validatedQuery') as ContentListQueryInput

  const { items, next_cursor } = await listPosts(query)

  return c.json({
    success: true,
    data: items,
    meta: {
      next_cursor,
      has_more: next_cursor != null,
      per_page: query.limit ?? 20,
    },
  })
}
