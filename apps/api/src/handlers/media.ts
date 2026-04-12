import type { Context } from 'hono'
import {
  generateSignedUrl,
  addMedia,
  removeMedia,
  reorderMedia,
} from '../services/media.service.js'
import type { SignedUrlInput, AddMediaInput, ReorderMediaInput } from '@creatorhub/shared'

/**
 * POST /api/v1/media/signed-url
 * Generate a signed upload URL for Firebase Storage.
 */
export async function handleSignedUrl(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const body = c.get('validatedBody') as SignedUrlInput

  const result = await generateSignedUrl(userId, body)

  return c.json({ success: true, data: result })
}

/**
 * POST /api/v1/media/content/:contentId
 * Add media to a content item.
 */
export async function handleAddMedia(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('contentId')!
  const body = c.get('validatedBody') as AddMediaInput

  const media = await addMedia(contentId, userId, body)

  return c.json({ success: true, data: media }, 201)
}

/**
 * DELETE /api/v1/media/:mediaId
 * Remove media from a content item.
 */
export async function handleRemoveMedia(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const mediaId = c.req.param('mediaId')!

  await removeMedia(mediaId, userId)

  return c.body(null, 204)
}

/**
 * PUT /api/v1/media/content/:contentId/reorder
 * Reorder media items for a content item.
 */
export async function handleReorderMedia(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('contentId')!
  const body = c.get('validatedBody') as ReorderMediaInput

  await reorderMedia(contentId, userId, body.media_ids)

  return c.json({ success: true, data: { reordered: true } })
}
