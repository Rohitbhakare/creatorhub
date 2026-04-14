import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (must come before any imports that touch these modules) ─────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn() }
  return { supabase: mockSupabase }
})

import { generateSignedUrl, addMedia, removeMedia, reorderMedia } from './media.service.js'
import { supabase } from '../lib/supabase.js'

// ─── Mock helpers ──────────────────────────────────────────────────────────

function mockChain(
  data: unknown,
  error: unknown = null,
  count: number | null = null,
) {
  const resolvedVal = { data, error, count }
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    head: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: (
      onFulfilled: (val: typeof resolvedVal) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolvedVal).then(onFulfilled, onRejected),
  }
  return chain
}

// ─── Fixtures ──────────────────────────────────────────────────────────────

const USER_ID = 'user-001'
const OTHER_USER_ID = 'user-002'
const CONTENT_ID = 'content-001'
const MEDIA_ID = 'media-001'

const postContent = {
  id: CONTENT_ID,
  user_id: USER_ID,
  type: 'post',
}

const experienceContent = {
  id: CONTENT_ID,
  user_id: USER_ID,
  type: 'self_paced_itinerary',
}

const mediaInput = {
  media_type: 'image' as const,
  url: 'https://firebasestorage.googleapis.com/v0/b/creatorhub.appspot.com/o/img.jpg',
  display_order: 0,
}

// ─── generateSignedUrl ────────────────────────────────────────────────────

describe('generateSignedUrl', () => {
  it('returns upload_url, public_url, and file_path', async () => {
    const result = await generateSignedUrl(USER_ID, {
      file_name: 'photo.jpg',
      purpose: 'content',
      content_id: CONTENT_ID,
    })

    expect(result).toHaveProperty('upload_url')
    expect(result).toHaveProperty('public_url')
    expect(result).toHaveProperty('file_path')
  })

  it('file_path includes purpose, userId, and content_id segments', async () => {
    const result = await generateSignedUrl(USER_ID, {
      file_name: 'photo.jpg',
      purpose: 'content',
      content_id: CONTENT_ID,
    })

    expect(result.file_path).toContain('content/')
    expect(result.file_path).toContain(USER_ID)
    expect(result.file_path).toContain(CONTENT_ID)
  })

  it('preserves the file extension from file_name', async () => {
    const result = await generateSignedUrl(USER_ID, {
      file_name: 'photo.jpg',
      purpose: 'content',
    })

    expect(result.file_path).toMatch(/\.jpg$/)
  })

  it('uses "general" segment when content_id is not provided', async () => {
    const result = await generateSignedUrl(USER_ID, {
      file_name: 'avatar.png',
      purpose: 'avatar',
    })

    expect(result.file_path).toContain('/general/')
  })

  it('falls back to "bin" extension for files with no extension', async () => {
    const result = await generateSignedUrl(USER_ID, {
      file_name: 'noextension',
      purpose: 'content',
    })

    expect(result.file_path).toMatch(/\.bin$/)
  })
})

// ─── addMedia ─────────────────────────────────────────────────────────────

describe('addMedia', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 404 when content does not exist', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(null, { message: 'no rows' }) as never,
    )

    await expect(addMedia(CONTENT_ID, USER_ID, mediaInput)).rejects.toMatchObject({
      status: 404,
      type: 'not-found',
    })
  })

  it('throws 403 when user does not own the content', async () => {
    const otherContent = { ...postContent, user_id: OTHER_USER_ID }
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(otherContent) as never,
    )

    await expect(addMedia(CONTENT_ID, USER_ID, mediaInput)).rejects.toMatchObject({
      status: 403,
      type: 'forbidden',
    })
  })

  it('throws 400 when post already has MAX_IMAGES_PER_POST (5) images', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(postContent) as never)
      // media count = 5 (at limit)
      .mockReturnValueOnce(mockChain(null, null, 5) as never)

    await expect(addMedia(CONTENT_ID, USER_ID, mediaInput)).rejects.toMatchObject({
      status: 400,
      type: 'validation-failed',
    })
  })

  it('throws 400 when experience already has MAX_IMAGES_PER_EXPERIENCE (10) images', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(experienceContent) as never)
      // media count = 10 (at limit)
      .mockReturnValueOnce(mockChain(null, null, 10) as never)

    await expect(addMedia(CONTENT_ID, USER_ID, mediaInput)).rejects.toMatchObject({
      status: 400,
      type: 'validation-failed',
    })
  })

  it('allows post to add image when below MAX_IMAGES_PER_POST (4/5)', async () => {
    const insertedMedia = { id: MEDIA_ID, ...mediaInput, content_id: CONTENT_ID }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(postContent) as never)
      .mockReturnValueOnce(mockChain(null, null, 4) as never)
      .mockReturnValueOnce(mockChain(insertedMedia) as never)

    const result = await addMedia(CONTENT_ID, USER_ID, mediaInput)

    expect(result).toMatchObject({ id: MEDIA_ID })
  })

  it('allows experience to add image at 9/10', async () => {
    const insertedMedia = { id: MEDIA_ID, ...mediaInput, content_id: CONTENT_ID }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(experienceContent) as never)
      .mockReturnValueOnce(mockChain(null, null, 9) as never)
      .mockReturnValueOnce(mockChain(insertedMedia) as never)

    const result = await addMedia(CONTENT_ID, USER_ID, mediaInput)

    expect(result).toMatchObject({ id: MEDIA_ID })
  })

  it('throws 500 when count query fails', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(postContent) as never)
      .mockReturnValueOnce(mockChain(null, { message: 'count failed' }) as never)

    await expect(addMedia(CONTENT_ID, USER_ID, mediaInput)).rejects.toMatchObject({
      status: 500,
      type: 'db-error',
    })
  })

  it('throws 500 when insert fails', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(postContent) as never)
      .mockReturnValueOnce(mockChain(null, null, 2) as never)
      .mockReturnValueOnce(mockChain(null, { message: 'insert failed' }) as never)

    await expect(addMedia(CONTENT_ID, USER_ID, mediaInput)).rejects.toMatchObject({
      status: 500,
      type: 'db-error',
    })
  })
})

// ─── removeMedia ──────────────────────────────────────────────────────────

describe('removeMedia', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 404 when media does not exist', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(null, { message: 'no rows' }) as never,
    )

    await expect(removeMedia(MEDIA_ID, USER_ID)).rejects.toMatchObject({
      status: 404,
      type: 'not-found',
    })
  })

  it('throws 403 when user does not own the parent content', async () => {
    const media = { id: MEDIA_ID, content_id: CONTENT_ID }
    const otherContent = { user_id: OTHER_USER_ID }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(media) as never)
      .mockReturnValueOnce(mockChain(otherContent) as never)

    await expect(removeMedia(MEDIA_ID, USER_ID)).rejects.toMatchObject({
      status: 403,
      type: 'forbidden',
    })
  })

  it('throws 403 when parent content is not found (content.user_id check)', async () => {
    const media = { id: MEDIA_ID, content_id: CONTENT_ID }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(media) as never)
      // content not found
      .mockReturnValueOnce(mockChain(null) as never)

    await expect(removeMedia(MEDIA_ID, USER_ID)).rejects.toMatchObject({
      status: 403,
      type: 'forbidden',
    })
  })

  it('deletes the media and resolves void on success', async () => {
    const media = { id: MEDIA_ID, content_id: CONTENT_ID }
    const content = { user_id: USER_ID }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(media) as never)
      .mockReturnValueOnce(mockChain(content) as never)
      .mockReturnValueOnce(mockChain(null) as never)

    await expect(removeMedia(MEDIA_ID, USER_ID)).resolves.toBeUndefined()
  })

  it('throws 500 when delete fails', async () => {
    const media = { id: MEDIA_ID, content_id: CONTENT_ID }
    const content = { user_id: USER_ID }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(media) as never)
      .mockReturnValueOnce(mockChain(content) as never)
      .mockReturnValueOnce(mockChain(null, { message: 'delete failed' }) as never)

    await expect(removeMedia(MEDIA_ID, USER_ID)).rejects.toMatchObject({
      status: 500,
      type: 'db-error',
    })
  })
})

// ─── reorderMedia ─────────────────────────────────────────────────────────

describe('reorderMedia', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 403 when content not found', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(null) as never)

    await expect(
      reorderMedia(CONTENT_ID, USER_ID, ['m1', 'm2']),
    ).rejects.toMatchObject({ status: 403, type: 'forbidden' })
  })

  it('throws 403 when user does not own the content', async () => {
    const otherContent = { user_id: OTHER_USER_ID }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(otherContent) as never)

    await expect(
      reorderMedia(CONTENT_ID, USER_ID, ['m1', 'm2']),
    ).rejects.toMatchObject({ status: 403, type: 'forbidden' })
  })

  it('resolves void when all updates succeed', async () => {
    const content = { user_id: USER_ID }
    vi.mocked(supabase.from)
      // ownership check
      .mockReturnValueOnce(mockChain(content) as never)
      // update for m1 (display_order=0)
      .mockReturnValueOnce(mockChain(null) as never)
      // update for m2 (display_order=1)
      .mockReturnValueOnce(mockChain(null) as never)

    await expect(
      reorderMedia(CONTENT_ID, USER_ID, ['m1', 'm2']),
    ).resolves.toBeUndefined()
  })

  it('throws 500 when any update in the batch fails', async () => {
    const content = { user_id: USER_ID }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(content) as never)
      // first update succeeds
      .mockReturnValueOnce(mockChain(null) as never)
      // second update fails
      .mockReturnValueOnce(mockChain(null, { message: 'update failed' }) as never)

    await expect(
      reorderMedia(CONTENT_ID, USER_ID, ['m1', 'm2']),
    ).rejects.toMatchObject({ status: 500, type: 'db-error' })
  })

  it('resolves immediately with no-op for empty media list', async () => {
    const content = { user_id: USER_ID }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(content) as never)

    await expect(
      reorderMedia(CONTENT_ID, USER_ID, []),
    ).resolves.toBeUndefined()
  })
})
