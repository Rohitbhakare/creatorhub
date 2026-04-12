import type { Context } from 'hono'
import {
  createDraft,
  getById,
  updateDraft,
  listDrafts,
  listPublished,
  softDelete,
} from '../services/content.service.js'
import { publish, unpublish, archive } from '../services/content-state.service.js'
import { recordConsent } from '../services/tnc.service.js'
import { extractIp } from '../services/audit.service.js'
import type {
  CreateContentInput,
  PublishContentInput,
  ContentListQueryInput,
  ContentType,
} from '@creatorhub/shared'

/**
 * POST /api/v1/content
 * Create a new content draft.
 */
export async function handleCreateDraft(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const body = c.get('validatedBody') as CreateContentInput

  const content = await createDraft(userId, body)

  c.header('Location', `/api/v1/content/${content.id as string}`)
  return c.json({ success: true, data: content }, 201)
}

/**
 * GET /api/v1/content/:id
 * Get content by ID with media and creator profile.
 */
export async function handleGetContent(c: Context): Promise<Response> {
  const contentId = c.req.param('id')!
  const requesterId = c.get('userId') as string | null

  const result = await getById(contentId, requesterId)

  return c.json({
    success: true,
    data: {
      ...result.content,
      media: result.media,
      creator: result.creator,
    },
  })
}

/**
 * PUT /api/v1/content/:id
 * Update a draft content item.
 */
export async function handleUpdateDraft(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const body = await c.req.json() as Record<string, unknown>

  const content = await updateDraft(contentId, userId, body)

  return c.json({ success: true, data: content })
}

/**
 * GET /api/v1/content/me/drafts
 * List current user's draft content.
 */
export async function handleListDrafts(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const type = (c.req.query('type') as ContentType | undefined) ?? undefined

  const drafts = await listDrafts(userId, type)

  return c.json({ success: true, data: drafts })
}

/**
 * GET /api/v1/content (published listing — used by feed/discovery)
 * Cursor-paginated list of published public content.
 */
export async function handleListPublished(c: Context): Promise<Response> {
  const query = c.get('validatedQuery') as ContentListQueryInput

  const { items, next_cursor } = await listPublished(query)

  // Fetch creator summary for each item
  const userIds = [...new Set(items.map((i) => i.user_id as string))]
  const creators = await fetchCreatorSummaries(userIds)

  const data = items.map((item) => ({
    ...item,
    creator: creators.get(item.user_id as string) ?? null,
  }))

  return c.json({
    success: true,
    data,
    meta: {
      next_cursor,
      has_more: next_cursor != null,
      per_page: query.limit ?? 20,
    },
  })
}

/**
 * DELETE /api/v1/content/:id
 * Soft-delete content.
 */
export async function handleSoftDelete(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!

  await softDelete(contentId, userId)

  return c.body(null, 204)
}

/**
 * POST /api/v1/content/:id/publish
 * Publish a draft.
 */
export async function handlePublish(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const body = c.get('validatedBody') as PublishContentInput
  const ip = extractIp(c.req.raw.headers)
  const userAgent = c.req.header('User-Agent') ?? null

  // Record T&C consent
  void recordConsent(userId, contentId, ip, userAgent)

  const content = await publish(contentId, userId, body.tnc_accepted)

  return c.json({ success: true, data: content })
}

/**
 * POST /api/v1/content/:id/unpublish
 * Unpublish published content.
 */
export async function handleUnpublish(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!

  const content = await unpublish(contentId, userId)

  return c.json({ success: true, data: content })
}

/**
 * POST /api/v1/content/:id/archive
 * Archive published or unpublished content.
 */
export async function handleArchive(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!

  const content = await archive(contentId, userId)

  return c.json({ success: true, data: content })
}

// ─── Helpers ────────────────────────────────────────────────────

import { supabase } from '../lib/supabase.js'

type CreatorSummary = {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
}

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
