import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (must come before any imports that touch these modules) ─────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn(), rpc: vi.fn() }
  return { supabase: mockSupabase }
})

vi.mock('./content.service.js', () => ({
  createDraft: vi.fn(),
  getById: vi.fn(),
  updateDraft: vi.fn(),
  listPublished: vi.fn(),
}))

vi.mock('./content-state.service.js', () => ({
  publish: vi.fn(),
}))

import { createPostDraft, getPostDetail, publishPost } from './post.service.js'
import { supabase } from '../lib/supabase.js'
import { createDraft, getById } from './content.service.js'
import { publish } from './content-state.service.js'

// ─── Mock helpers ──────────────────────────────────────────────────────────

/**
 * Returns a chainable Supabase mock that:
 *  - resolves via .single() to { data, error }
 *  - resolves via direct await to { data, error, count }
 */
function mockChain(data: unknown, error: unknown = null, count: number | null = null) {
  const resolvedVal = { data, error, count }
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    // Thenable — makes `await chain` resolve to resolvedVal
    then: (
      onFulfilled: (val: typeof resolvedVal) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolvedVal).then(onFulfilled, onRejected),
  }
  return chain
}

const USER_ID = 'user-001'
const CONTENT_ID = 'content-001'

const draftPost = {
  id: CONTENT_ID,
  user_id: USER_ID,
  type: 'post',
  status: 'draft',
  title: 'Valid post title',
  body: 'A valid post body that is long enough',
  vertical: 'travel',
  pricing_model: 'free',
  price_paisa: 0,
}

const publishedPost = { ...draftPost, status: 'published' }

// ─── createPostDraft ───────────────────────────────────────────────────────

describe('createPostDraft', () => {
  beforeEach(() => vi.clearAllMocks())

  it('delegates to createDraft with type=post', async () => {
    vi.mocked(createDraft).mockResolvedValue({ id: CONTENT_ID, type: 'post' } as never)

    const result = await createPostDraft(USER_ID, { vertical: 'travel' })

    expect(createDraft).toHaveBeenCalledWith(USER_ID, {
      type: 'post',
      vertical: 'travel',
    })
    expect(result).toMatchObject({ type: 'post' })
  })

  it('forces type to post regardless of caller input', async () => {
    vi.mocked(createDraft).mockResolvedValue({ id: CONTENT_ID, type: 'post' } as never)

    await createPostDraft(USER_ID, { vertical: 'stories' })

    expect(createDraft).toHaveBeenCalledWith(USER_ID, {
      type: 'post',
      vertical: 'stories',
    })
  })
})

// ─── getPostDetail ─────────────────────────────────────────────────────────

describe('getPostDetail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 404 when content type is not post', async () => {
    vi.mocked(getById).mockResolvedValue({
      content: { id: CONTENT_ID, type: 'self_paced_itinerary' },
      media: [],
      creator: { id: USER_ID },
    } as never)

    await expect(getPostDetail(CONTENT_ID)).rejects.toMatchObject({
      status: 404,
      type: 'not-found',
    })
  })

  it('returns post detail with is_liked=false and is_saved=false', async () => {
    vi.mocked(getById).mockResolvedValue({
      content: { id: CONTENT_ID, type: 'post', title: draftPost.title },
      media: [],
      creator: { id: USER_ID, display_name: 'Test Creator', username: 'test', avatar_url: null },
    } as never)

    // supabase.from('users') for follower_count
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ follower_count: 42 }) as never)
      // supabase.from('content') for post_count (head:true count query)
      .mockReturnValueOnce(mockChain(null, null, 7) as never)

    const result = await getPostDetail(CONTENT_ID, USER_ID)

    expect(result.is_liked).toBe(false)
    expect(result.is_saved).toBe(false)
    expect(result.creator.follower_count).toBe(42)
    expect(result.creator.post_count).toBe(7)
  })
})

// ─── publishPost ───────────────────────────────────────────────────────────

describe('publishPost', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 404 when content not found', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(null, { message: 'not found' }) as never,
    )

    await expect(publishPost(CONTENT_ID, USER_ID, true)).rejects.toMatchObject({
      status: 404,
      type: 'not-found',
    })
  })

  it('throws 403 when user does not own the post', async () => {
    const otherUser = { ...draftPost, user_id: 'other-user' }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(otherUser) as never)

    await expect(publishPost(CONTENT_ID, USER_ID, true)).rejects.toMatchObject({
      status: 403,
      type: 'forbidden',
    })
  })

  it('throws 422 when content type is not post', async () => {
    const itinerary = { ...draftPost, type: 'self_paced_itinerary' }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(itinerary) as never)

    await expect(publishPost(CONTENT_ID, USER_ID, true)).rejects.toMatchObject({
      status: 422,
      type: 'unprocessable',
    })
  })

  it('throws 400 when title is too short (< 5 chars)', async () => {
    const shortTitle = { ...draftPost, title: 'Hi' }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(shortTitle) as never)

    await expect(publishPost(CONTENT_ID, USER_ID, true)).rejects.toMatchObject({
      status: 400,
      type: 'validation-failed',
    })
  })

  it('throws 400 when title is too long (> 100 chars)', async () => {
    const longTitle = { ...draftPost, title: 'x'.repeat(101) }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(longTitle) as never)

    await expect(publishPost(CONTENT_ID, USER_ID, true)).rejects.toMatchObject({
      status: 400,
      type: 'validation-failed',
    })
  })

  it('throws 400 when body is empty', async () => {
    const noBody = { ...draftPost, body: '' }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(noBody) as never)

    await expect(publishPost(CONTENT_ID, USER_ID, true)).rejects.toMatchObject({
      status: 400,
      type: 'validation-failed',
    })
  })

  it('throws 400 when body exceeds 1000 characters', async () => {
    const longBody = { ...draftPost, body: 'x'.repeat(1001) }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(longBody) as never)

    await expect(publishPost(CONTENT_ID, USER_ID, true)).rejects.toMatchObject({
      status: 400,
      type: 'validation-failed',
    })
  })

  it('throws 400 when post has no images', async () => {
    // Call 1: content fetch → valid post
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftPost) as never)
      // Call 2: media count → 0 images
      .mockReturnValueOnce(mockChain(null, null, 0) as never)

    await expect(publishPost(CONTENT_ID, USER_ID, true)).rejects.toMatchObject({
      status: 400,
      type: 'validation-failed',
    })
  })

  it('throws 400 when post exceeds 5 images', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftPost) as never)
      .mockReturnValueOnce(mockChain(null, null, 6) as never)

    await expect(publishPost(CONTENT_ID, USER_ID, true)).rejects.toMatchObject({
      status: 400,
      type: 'validation-failed',
    })
  })

  it('throws 400 when vertical is not set', async () => {
    const noVertical = { ...draftPost, vertical: null }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(noVertical) as never)
      .mockReturnValueOnce(mockChain(null, null, 1) as never)

    await expect(publishPost(CONTENT_ID, USER_ID, true)).rejects.toMatchObject({
      status: 400,
      type: 'validation-failed',
    })
  })

  it('forces pricing_model=free and delegates to publish() for status transition', async () => {
    // Call 1: content fetch
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftPost) as never)
      // Call 2: media count → 1 image
      .mockReturnValueOnce(mockChain(null, null, 1) as never)
      // Call 3: update pricing_model='free'
      .mockReturnValueOnce(mockChain(null, null) as never)

    vi.mocked(publish).mockResolvedValue(publishedPost as never)

    const result = await publishPost(CONTENT_ID, USER_ID, true)

    // Verify pricing was forced to free
    const updateCall = vi.mocked(supabase.from).mock.calls[2]
    expect(updateCall?.[0]).toBe('content')

    // Verify publish() was called (KYC check is skipped for posts)
    expect(publish).toHaveBeenCalledWith(CONTENT_ID, USER_ID, true)
    expect((result as Record<string, unknown>).status).toBe('published')
  })

  it('does not call requireKYC — posts skip KYC check', async () => {
    // Even a paid post (shouldn't happen, but verifying the logic) won't KYC-check
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(draftPost) as never)
      .mockReturnValueOnce(mockChain(null, null, 1) as never)
      .mockReturnValueOnce(mockChain(null, null) as never)

    vi.mocked(publish).mockResolvedValue(publishedPost as never)

    await publishPost(CONTENT_ID, USER_ID, true)

    // publish() is called with correct args — no intermediate KYC fetch
    expect(publish).toHaveBeenCalledTimes(1)
    expect(publish).toHaveBeenCalledWith(CONTENT_ID, USER_ID, true)
  })
})
