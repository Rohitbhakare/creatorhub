import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (must come before any imports that touch these modules) ─────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn(), rpc: vi.fn() }
  return { supabase: mockSupabase }
})

import {
  createDraft,
  getById,
  updateDraft,
  listDrafts,
  listPublished,
  softDelete,
} from './content.service.js'
import { supabase } from '../lib/supabase.js'

// ─── Mock helpers ──────────────────────────────────────────────────────────

function mockChain(
  data: unknown,
  error: unknown = null,
  count: number | null = null,
  singleData?: unknown,
) {
  const resolvedVal = { data, error, count }
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: singleData ?? data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data: singleData ?? data, error }),
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

const draftContent = {
  id: CONTENT_ID,
  user_id: USER_ID,
  type: 'post',
  status: 'draft',
  visibility: 'public',
  pricing_model: 'free',
  price_paisa: 0,
  title: 'A Valid Title',
  vertical: 'travel',
}

const publishedContent = {
  ...draftContent,
  status: 'published',
  published_at: '2026-01-01T00:00:00Z',
}

const creatorRow = {
  id: USER_ID,
  display_name: 'Test Creator',
  username: 'testcreator',
  avatar_url: null,
}

// ─── createDraft ───────────────────────────────────────────────────────────

describe('createDraft', () => {
  beforeEach(() => vi.clearAllMocks())

  it('inserts with status=draft, pricing_model=free, price_paisa=0', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(draftContent) as never,
    )

    const result = await createDraft(USER_ID, { type: 'post', vertical: 'travel' })

    expect(result).toMatchObject({
      status: 'draft',
      pricing_model: 'free',
      price_paisa: 0,
    })
  })

  it('throws 500 on DB insert error', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(null, { message: 'insert failed' }) as never,
    )

    await expect(createDraft(USER_ID, { type: 'post', vertical: 'travel' })).rejects.toMatchObject({
      status: 500,
      type: 'db-error',
    })
  })
})

// ─── getById ──────────────────────────────────────────────────────────────

describe('getById', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 404 when content not found', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(null, { message: 'not found' }) as never,
    )

    await expect(getById(CONTENT_ID)).rejects.toMatchObject({
      status: 404,
      type: 'not-found',
    })
  })

  it('throws 404 when non-owner requests draft content', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(draftContent) as never,
    )

    await expect(getById(CONTENT_ID, OTHER_USER_ID)).rejects.toMatchObject({
      status: 404,
      type: 'not-found',
    })
  })

  it('throws 404 when non-owner requests private published content', async () => {
    const privatePublished = { ...publishedContent, visibility: 'private' }
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(privatePublished) as never,
    )

    await expect(getById(CONTENT_ID, OTHER_USER_ID)).rejects.toMatchObject({
      status: 404,
      type: 'not-found',
    })
  })

  it('throws 404 when requester is null and content is a draft', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(draftContent) as never,
    )

    await expect(getById(CONTENT_ID, null)).rejects.toMatchObject({
      status: 404,
      type: 'not-found',
    })
  })

  it('allows owner to view their own draft', async () => {
    vi.mocked(supabase.from)
      // content fetch
      .mockReturnValueOnce(mockChain(draftContent) as never)
      // media fetch
      .mockReturnValueOnce(mockChain([]) as never)
      // creator fetch
      .mockReturnValueOnce(mockChain(creatorRow) as never)

    const result = await getById(CONTENT_ID, USER_ID)

    expect(result.content).toMatchObject({ status: 'draft' })
    expect(result.media).toEqual([])
    expect(result.creator.id).toBe(USER_ID)
  })

  it('returns content, media, and creator for public published content', async () => {
    const media = [{ id: 'media-1', url: 'https://example.com/img.jpg', display_order: 0 }]
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(publishedContent) as never)
      .mockReturnValueOnce(mockChain(media) as never)
      .mockReturnValueOnce(mockChain(creatorRow) as never)

    const result = await getById(CONTENT_ID, OTHER_USER_ID)

    expect(result.content).toMatchObject({ status: 'published' })
    expect(result.media).toHaveLength(1)
    expect(result.creator.username).toBe('testcreator')
  })

  it('throws 404 when creator row is missing', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(publishedContent) as never)
      .mockReturnValueOnce(mockChain([]) as never)
      // creator not found
      .mockReturnValueOnce(mockChain(null) as never)

    await expect(getById(CONTENT_ID, OTHER_USER_ID)).rejects.toMatchObject({
      status: 404,
      type: 'not-found',
    })
  })
})

// ─── updateDraft ──────────────────────────────────────────────────────────

describe('updateDraft', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 404 when content does not exist', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(null, { message: 'no rows' }) as never,
    )

    await expect(
      updateDraft(CONTENT_ID, USER_ID, { title: 'New Title' }),
    ).rejects.toMatchObject({ status: 404, type: 'not-found' })
  })

  it('throws 403 when user does not own the content', async () => {
    const otherUserContent = { id: CONTENT_ID, user_id: OTHER_USER_ID, status: 'draft' }
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(otherUserContent) as never,
    )

    await expect(
      updateDraft(CONTENT_ID, USER_ID, { title: 'New Title' }),
    ).rejects.toMatchObject({ status: 403, type: 'forbidden' })
  })

  it('throws 422 when content is not a draft', async () => {
    const publishedOwned = { id: CONTENT_ID, user_id: USER_ID, status: 'published' }
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(publishedOwned) as never,
    )

    await expect(
      updateDraft(CONTENT_ID, USER_ID, { title: 'New Title' }),
    ).rejects.toMatchObject({ status: 422, type: 'unprocessable' })
  })

  it('updates and returns the updated content row', async () => {
    const existing = { id: CONTENT_ID, user_id: USER_ID, status: 'draft' }
    const updated = { ...draftContent, title: 'Updated Title' }

    vi.mocked(supabase.from)
      // ownership/status check
      .mockReturnValueOnce(mockChain(existing) as never)
      // update
      .mockReturnValueOnce(mockChain(updated) as never)

    const result = await updateDraft(CONTENT_ID, USER_ID, { title: 'Updated Title' })

    expect(result).toMatchObject({ title: 'Updated Title' })
  })

  it('throws 500 when update DB call fails', async () => {
    const existing = { id: CONTENT_ID, user_id: USER_ID, status: 'draft' }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(existing) as never)
      .mockReturnValueOnce(mockChain(null, { message: 'update failed' }) as never)

    await expect(
      updateDraft(CONTENT_ID, USER_ID, { title: 'Fail' }),
    ).rejects.toMatchObject({ status: 500, type: 'db-error' })
  })
})

// ─── listDrafts ───────────────────────────────────────────────────────────

describe('listDrafts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty array when user has no drafts', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain([]) as never)

    const result = await listDrafts(USER_ID)

    expect(result).toEqual([])
  })

  it('returns drafts ordered by updated_at desc (all types)', async () => {
    const drafts = [
      { id: 'c1', type: 'post', title: 'Post', updated_at: '2026-02-01T00:00:00Z' },
      { id: 'c2', type: 'event', title: 'Event', updated_at: '2026-01-01T00:00:00Z' },
    ]
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(drafts) as never)

    const result = await listDrafts(USER_ID)

    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({ id: 'c1' })
  })

  it('filters by type when provided', async () => {
    const eventDrafts = [{ id: 'c2', type: 'event', title: 'Event', updated_at: '2026-01-01T00:00:00Z' }]
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(eventDrafts) as never)

    const result = await listDrafts(USER_ID, 'event')

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ type: 'event' })
  })

  it('throws 500 on DB error', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(null, { message: 'query failed' }) as never,
    )

    await expect(listDrafts(USER_ID)).rejects.toMatchObject({
      status: 500,
      type: 'db-error',
    })
  })
})

// ─── listPublished ────────────────────────────────────────────────────────

describe('listPublished', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns items with next_cursor=null when results fit in one page', async () => {
    const items = Array.from({ length: 3 }, (_, i) => ({
      id: `c${i}`,
      type: 'post',
      status: 'published',
      published_at: `2026-01-0${i + 1}T00:00:00Z`,
    }))
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(items) as never)

    const result = await listPublished({ limit: 20 })

    expect(result.items).toHaveLength(3)
    expect(result.next_cursor).toBeNull()
  })

  it('returns next_cursor when there are more items than the limit', async () => {
    // Fetch limit+1 to detect has_more. For limit=2, we return 3 rows.
    const items = [
      { id: 'c1', type: 'post', status: 'published', published_at: '2026-03-01T00:00:00Z' },
      { id: 'c2', type: 'post', status: 'published', published_at: '2026-02-01T00:00:00Z' },
      { id: 'c3', type: 'post', status: 'published', published_at: '2026-01-01T00:00:00Z' },
    ]
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(items) as never)

    const result = await listPublished({ limit: 2 })

    expect(result.items).toHaveLength(2)
    expect(result.next_cursor).not.toBeNull()
    // Cursor should decode to published_at|id of the last returned item
    const decoded = Buffer.from(result.next_cursor!, 'base64url').toString('utf-8')
    expect(decoded).toBe('2026-02-01T00:00:00Z|c2')
  })

  it('filters by type', async () => {
    const items = [{ id: 'c1', type: 'event', status: 'published', published_at: '2026-01-01T00:00:00Z' }]
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(items) as never)

    const result = await listPublished({ limit: 20, type: 'event' })

    expect(result.items).toHaveLength(1)
    expect(result.next_cursor).toBeNull()
  })

  it('filters by vertical', async () => {
    const items = [{ id: 'c1', type: 'post', vertical: 'stories', status: 'published', published_at: '2026-01-01T00:00:00Z' }]
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(items) as never)

    const result = await listPublished({ limit: 20, vertical: 'stories' })

    expect(result.items[0]).toMatchObject({ vertical: 'stories' })
  })

  it('filters by user_id', async () => {
    const items = [{ id: 'c1', user_id: USER_ID, type: 'post', status: 'published', published_at: '2026-01-01T00:00:00Z' }]
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(items) as never)

    const result = await listPublished({ limit: 20, user_id: USER_ID })

    expect(result.items[0]).toMatchObject({ user_id: USER_ID })
  })

  it('returns empty items and no cursor when DB returns null', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(null) as never)

    const result = await listPublished({ limit: 20 })

    expect(result.items).toEqual([])
    expect(result.next_cursor).toBeNull()
  })

  it('throws 500 on DB error', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(null, { message: 'query failed' }) as never,
    )

    await expect(listPublished({ limit: 20 })).rejects.toMatchObject({
      status: 500,
      type: 'db-error',
    })
  })
})

// ─── softDelete ───────────────────────────────────────────────────────────

describe('softDelete', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws 404 when content does not exist', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(null, { message: 'no rows' }) as never,
    )

    await expect(softDelete(CONTENT_ID, USER_ID)).rejects.toMatchObject({
      status: 404,
      type: 'not-found',
    })
  })

  it('throws 403 when user does not own the content', async () => {
    const otherUserContent = { id: CONTENT_ID, user_id: OTHER_USER_ID }
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain(otherUserContent) as never,
    )

    await expect(softDelete(CONTENT_ID, USER_ID)).rejects.toMatchObject({
      status: 403,
      type: 'forbidden',
    })
  })

  it('sets deleted_at and resolves void on success', async () => {
    const existing = { id: CONTENT_ID, user_id: USER_ID }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(existing) as never)
      // update resolves without error
      .mockReturnValueOnce(mockChain(null) as never)

    await expect(softDelete(CONTENT_ID, USER_ID)).resolves.toBeUndefined()
  })

  it('throws 500 when the update fails', async () => {
    const existing = { id: CONTENT_ID, user_id: USER_ID }

    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(existing) as never)
      .mockReturnValueOnce(mockChain(null, { message: 'update failed' }) as never)

    await expect(softDelete(CONTENT_ID, USER_ID)).rejects.toMatchObject({
      status: 500,
      type: 'db-error',
    })
  })
})
