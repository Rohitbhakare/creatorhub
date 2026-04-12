import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import { MAX_IMAGES_PER_POST, MAX_IMAGES_PER_EXPERIENCE } from '@creatorhub/shared'
import type { SignedUrlInput, AddMediaInput } from '@creatorhub/shared'
import { randomUUID } from 'node:crypto'

// ─── generateSignedUrl ──────────────────────────────────────────

/**
 * Generate a structured upload path for Firebase Storage.
 * For MVP the client uploads via Firebase SDK directly — we return the path pattern.
 */
export async function generateSignedUrl(
  userId: string,
  input: SignedUrlInput,
): Promise<{ upload_url: string; public_url: string; file_path: string }> {
  const ext = extractExtension(input.file_name)
  const uuid = randomUUID()
  const filePath = `${input.purpose}/${userId}/${input.content_id ?? 'general'}/${uuid}.${ext}`

  // For MVP: return a structured path. The client uploads via Firebase SDK.
  // The upload_url is the Firebase Storage path (client constructs the full URL).
  // The public_url is the expected download URL after upload.
  const bucketBase = 'https://firebasestorage.googleapis.com/v0/b'
  const projectId = process.env['FIREBASE_PROJECT_ID'] ?? 'creatorhub'
  const encodedPath = encodeURIComponent(filePath)

  return {
    upload_url: filePath, // Client uses this path with Firebase SDK
    public_url: `${bucketBase}/${projectId}.appspot.com/o/${encodedPath}?alt=media`,
    file_path: filePath,
  }
}

// ─── addMedia ───────────────────────────────────────────────────

export async function addMedia(
  contentId: string,
  userId: string,
  input: AddMediaInput,
): Promise<Record<string, unknown>> {
  // Verify content exists and user is owner
  const { data: content, error: fetchError } = await supabase
    .from('content')
    .select('id, user_id, type')
    .eq('id', contentId)
    .is('deleted_at', null)
    .single()

  if (fetchError || !content) {
    throw new AppError('not-found', 404, 'Content not found')
  }

  if (content.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You do not own this content')
  }

  // Check media count limit
  const maxMedia = content.type === 'post' ? MAX_IMAGES_PER_POST : MAX_IMAGES_PER_EXPERIENCE
  const { count, error: countError } = await supabase
    .from('content_media')
    .select('id', { count: 'exact', head: true })
    .eq('content_id', contentId)

  if (countError) {
    throw new AppError('db-error', 500, 'Failed to check media count')
  }

  if ((count ?? 0) >= maxMedia) {
    throw new AppError(
      'validation-failed',
      400,
      `Maximum ${maxMedia.toString()} media items allowed for ${content.type as string}`,
    )
  }

  const { data, error } = await supabase
    .from('content_media')
    .insert({
      content_id: contentId,
      media_type: input.media_type,
      url: input.url,
      thumbnail_url: input.thumbnail_url ?? null,
      alt_text: input.alt_text ?? null,
      width: input.width ?? null,
      height: input.height ?? null,
      duration_seconds: input.duration_seconds ?? null,
      file_size_bytes: input.file_size_bytes ?? null,
      display_order: input.display_order,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new AppError('db-error', 500, 'Failed to add media')
  }

  return data
}

// ─── removeMedia ────────────────────────────────────────────────

export async function removeMedia(
  mediaId: string,
  userId: string,
): Promise<void> {
  // Fetch the media to get content_id, then verify ownership
  const { data: media, error: fetchError } = await supabase
    .from('content_media')
    .select('id, content_id')
    .eq('id', mediaId)
    .single()

  if (fetchError || !media) {
    throw new AppError('not-found', 404, 'Media not found')
  }

  // Verify user owns the parent content
  const { data: content } = await supabase
    .from('content')
    .select('user_id')
    .eq('id', media.content_id as string)
    .single()

  if (!content || content.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You do not own this content')
  }

  const { error } = await supabase
    .from('content_media')
    .delete()
    .eq('id', mediaId)

  if (error) {
    throw new AppError('db-error', 500, 'Failed to remove media')
  }
}

// ─── reorderMedia ───────────────────────────────────────────────

export async function reorderMedia(
  contentId: string,
  userId: string,
  mediaIds: string[],
): Promise<void> {
  // Verify ownership
  const { data: content } = await supabase
    .from('content')
    .select('user_id')
    .eq('id', contentId)
    .is('deleted_at', null)
    .single()

  if (!content || content.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You do not own this content')
  }

  // Update display_order for each media ID in the given order
  const updates = mediaIds.map((id, index) =>
    supabase
      .from('content_media')
      .update({ display_order: index })
      .eq('id', id)
      .eq('content_id', contentId),
  )

  const results = await Promise.all(updates)
  const hasError = results.some((r) => r.error != null)

  if (hasError) {
    throw new AppError('db-error', 500, 'Failed to reorder media')
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function extractExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1]! : 'bin'
}
