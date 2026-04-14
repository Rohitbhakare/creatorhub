import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock Supabase before any imports that touch it ───────────
// The service imports supabase from '../lib/supabase.js' which reads env.ts.
// We mock the entire module so no real DB calls are made.
vi.mock('../lib/supabase.js', () => {
  const mockSupabase = {
    from: vi.fn(),
    rpc: vi.fn(),
  }
  return { supabase: mockSupabase }
})

import { publish, unpublish, archive } from './content-state.service.js'
import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'

// Helper: build a chainable Supabase mock that resolves to { data, error }
function mockChain(data: unknown, error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    in: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    count: vi.fn().mockReturnThis(),
  }
  return chain
}

const CREATOR_ID = 'user-001'
const CONTENT_ID = 'content-001'

const draftPost = {
  id: CONTENT_ID,
  user_id: CREATOR_ID,
  type: 'post',
  status: 'draft',
  title: 'My Post',
  body: 'Post body content here',
  pricing_model: 'free',
}

const publishedPost = { ...draftPost, status: 'published' }
const unpublishedPost = { ...draftPost, status: 'unpublished' }

const draftItinerary = {
  id: CONTENT_ID,
  user_id: CREATOR_ID,
  type: 'self_paced_itinerary',
  status: 'draft',
  title: 'Bali in 5 Days',
  pricing_model: 'free',
}

// ─── publish() ────────────────────────────────────────────────

describe('publish', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('T&C validation', () => {
    it('throws 400 when tnc_accepted is false', async () => {
      await expect(publish(CONTENT_ID, CREATOR_ID, false)).rejects.toMatchObject({
        status: 400,
        type: 'validation-failed',
      })
    })
  })

  describe('ownership checks', () => {
    it('throws 404 when content not found', async () => {
      vi.mocked(supabase.from).mockReturnValue(mockChain(null, { message: 'not found' }) as never)

      await expect(publish(CONTENT_ID, CREATOR_ID, true)).rejects.toMatchObject({
        status: 404,
        type: 'not-found',
      })
    })

    it('throws 403 when user does not own content', async () => {
      const otherUserContent = { ...draftPost, user_id: 'other-user' }
      vi.mocked(supabase.from).mockReturnValue(mockChain(otherUserContent) as never)

      await expect(publish(CONTENT_ID, CREATOR_ID, true)).rejects.toMatchObject({
        status: 403,
        type: 'forbidden',
      })
    })
  })

  describe('state machine transitions', () => {
    it('throws 422 when content is already published (not a draft)', async () => {
      vi.mocked(supabase.from).mockReturnValue(mockChain(publishedPost) as never)

      await expect(publish(CONTENT_ID, CREATOR_ID, true)).rejects.toMatchObject({
        status: 422,
        type: 'unprocessable',
      })
    })

    it('throws 422 when content is archived', async () => {
      const archivedPost = { ...draftPost, status: 'archived' }
      vi.mocked(supabase.from).mockReturnValue(mockChain(archivedPost) as never)

      await expect(publish(CONTENT_ID, CREATOR_ID, true)).rejects.toMatchObject({
        status: 422,
        type: 'unprocessable',
      })
    })
  })

  describe('per-type field validation', () => {
    it('throws 400 when post has no title', async () => {
      const noTitle = { ...draftPost, title: '' }
      vi.mocked(supabase.from).mockReturnValue(mockChain(noTitle) as never)

      await expect(publish(CONTENT_ID, CREATOR_ID, true)).rejects.toMatchObject({
        status: 400,
        type: 'validation-failed',
      })
    })

    it('throws 400 when post has no body', async () => {
      const noBody = { ...draftPost, body: '' }
      vi.mocked(supabase.from).mockReturnValue(mockChain(noBody) as never)

      await expect(publish(CONTENT_ID, CREATOR_ID, true)).rejects.toMatchObject({
        status: 400,
        type: 'validation-failed',
      })
    })

    it('throws 400 when itinerary has no title', async () => {
      const noTitle = { ...draftItinerary, title: '' }
      vi.mocked(supabase.from).mockReturnValue(mockChain(noTitle) as never)

      await expect(publish(CONTENT_ID, CREATOR_ID, true)).rejects.toMatchObject({
        status: 400,
        type: 'validation-failed',
      })
    })
  })

  describe('KYC check for paid content', () => {
    it('throws 403 when user has not completed KYC for paid content', async () => {
      const paidDraft = { ...draftPost, pricing_model: 'paid' }

      // First call: fetch content
      // Second call: fetch user KYC status
      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockChain(paidDraft) as never)
        .mockReturnValueOnce(mockChain({ kyc_status: 'pending' }) as never)

      await expect(publish(CONTENT_ID, CREATOR_ID, true)).rejects.toMatchObject({
        status: 403,
        type: 'forbidden',
      })
    })

    it('throws 403 when user kyc_status is null (never submitted)', async () => {
      const paidDraft = { ...draftPost, pricing_model: 'paid' }

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockChain(paidDraft) as never)
        .mockReturnValueOnce(mockChain({ kyc_status: null }) as never)

      await expect(publish(CONTENT_ID, CREATOR_ID, true)).rejects.toMatchObject({
        status: 403,
        type: 'forbidden',
      })
    })
  })

  describe('unknown content type guard', () => {
    it('throws 422 for unknown content type', async () => {
      const unknownType = { ...draftPost, type: 'mystery_type' }
      vi.mocked(supabase.from).mockReturnValue(mockChain(unknownType) as never)

      await expect(publish(CONTENT_ID, CREATOR_ID, true)).rejects.toMatchObject({
        status: 422,
        type: 'unprocessable',
      })
    })
  })
})

// ─── unpublish() ──────────────────────────────────────────────

describe('unpublish', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws 404 when content not found', async () => {
    vi.mocked(supabase.from).mockReturnValue(mockChain(null, { message: 'not found' }) as never)

    await expect(unpublish(CONTENT_ID, CREATOR_ID)).rejects.toMatchObject({
      status: 404,
    })
  })

  it('throws 403 when user does not own content', async () => {
    const otherUserContent = { ...publishedPost, user_id: 'other-user' }
    vi.mocked(supabase.from).mockReturnValue(mockChain(otherUserContent) as never)

    await expect(unpublish(CONTENT_ID, CREATOR_ID)).rejects.toMatchObject({
      status: 403,
    })
  })

  it('throws 422 when trying to unpublish a draft', async () => {
    vi.mocked(supabase.from).mockReturnValue(mockChain(draftPost) as never)

    await expect(unpublish(CONTENT_ID, CREATOR_ID)).rejects.toMatchObject({
      status: 422,
      type: 'unprocessable',
    })
  })

  it('throws 422 when trying to unpublish an archived item', async () => {
    const archived = { ...draftPost, status: 'archived' }
    vi.mocked(supabase.from).mockReturnValue(mockChain(archived) as never)

    await expect(unpublish(CONTENT_ID, CREATOR_ID)).rejects.toMatchObject({
      status: 422,
    })
  })
})

// ─── archive() ────────────────────────────────────────────────

describe('archive', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws 404 when content not found', async () => {
    vi.mocked(supabase.from).mockReturnValue(mockChain(null, { message: 'not found' }) as never)

    await expect(archive(CONTENT_ID, CREATOR_ID)).rejects.toMatchObject({
      status: 404,
    })
  })

  it('throws 403 when user does not own content', async () => {
    const otherUserContent = { ...publishedPost, user_id: 'other-user' }
    vi.mocked(supabase.from).mockReturnValue(mockChain(otherUserContent) as never)

    await expect(archive(CONTENT_ID, CREATOR_ID)).rejects.toMatchObject({
      status: 403,
    })
  })

  it('throws 422 when trying to archive a draft', async () => {
    vi.mocked(supabase.from).mockReturnValue(mockChain(draftPost) as never)

    await expect(archive(CONTENT_ID, CREATOR_ID)).rejects.toMatchObject({
      status: 422,
      type: 'unprocessable',
    })
  })

  it('allows archiving a published item', async () => {
    // First call: fetch content → published
    // Second call: update → archived
    // Third call: rpc decrement (fire-and-forget, we don't assert this)
    const archivedResult = { ...publishedPost, status: 'archived' }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ id: CONTENT_ID, user_id: CREATOR_ID, status: 'published' }) as never)
      .mockReturnValueOnce(mockChain(archivedResult) as never)

    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    const result = await archive(CONTENT_ID, CREATOR_ID)
    expect((result as Record<string, unknown>).status).toBe('archived')
  })

  it('allows archiving an unpublished item', async () => {
    const archivedResult = { ...unpublishedPost, status: 'archived' }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain({ id: CONTENT_ID, user_id: CREATOR_ID, status: 'unpublished' }) as never)
      .mockReturnValueOnce(mockChain(archivedResult) as never)

    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)

    const result = await archive(CONTENT_ID, CREATOR_ID)
    expect((result as Record<string, unknown>).status).toBe('archived')
  })
})
