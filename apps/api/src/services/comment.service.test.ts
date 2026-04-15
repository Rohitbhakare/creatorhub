import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────────────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn(), rpc: vi.fn() }
  return { supabase: mockSupabase }
})

import {
  addComment,
  editComment,
  deleteComment,
  listComments,
} from './comment.service.js'
import { supabase } from '../lib/supabase.js'

// ─── Mock helpers ──────────────────────────────────────────────────────

function mockChain(data: unknown, error: unknown = null) {
  const resolvedVal = { data, error }
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: (
      onFulfilled: (val: typeof resolvedVal) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolvedVal).then(onFulfilled, onRejected),
  }
  return chain
}

// ─── Fixtures ──────────────────────────────────────────────────────────

const USER_A = 'aaa-111'
const USER_B = 'bbb-222'
const CONTENT_ID = 'ccc-333'
const COMMENT_ID = 'ddd-444'
const PARENT_COMMENT_ID = 'eee-555'

const mockComment = {
  id: COMMENT_ID,
  content_id: CONTENT_ID,
  user_id: USER_A,
  parent_id: null,
  body: 'Great post!',
  is_edited: false,
  created_at: '2025-01-01T00:00:00Z',
}

beforeEach(() => {
  vi.resetAllMocks()
})

// ── addComment ─────────────────────────────────────────────────────────

describe('addComment', () => {
  it('creates a top-level comment', async () => {
    const fromMock = vi.mocked(supabase.from)
    const rpcMock = vi.mocked(supabase.rpc)
    // 1. content exists + published
    fromMock.mockReturnValueOnce(mockChain({ id: CONTENT_ID, status: 'published' }) as never)
    // 2. insert comment
    fromMock.mockReturnValueOnce(mockChain(mockComment) as never)
    // 3. increment count
    rpcMock.mockResolvedValue({ data: null, error: null } as never)

    const result = await addComment(USER_A, CONTENT_ID, 'Great post!')
    expect(result).toEqual(mockComment)
    expect(rpcMock).toHaveBeenCalledWith('increment_count', expect.objectContaining({
      column_name: 'comment_count',
      amount: 1,
    }))
  })

  it('creates a reply to a top-level comment', async () => {
    const fromMock = vi.mocked(supabase.from)
    const rpcMock = vi.mocked(supabase.rpc)
    // 1. content exists + published
    fromMock.mockReturnValueOnce(mockChain({ id: CONTENT_ID, status: 'published' }) as never)
    // 2. parent comment exists, belongs to same content, is top-level
    fromMock.mockReturnValueOnce(
      mockChain({ id: PARENT_COMMENT_ID, content_id: CONTENT_ID, parent_id: null, deleted_at: null }) as never,
    )
    // 3. insert reply
    const reply = { ...mockComment, parent_id: PARENT_COMMENT_ID }
    fromMock.mockReturnValueOnce(mockChain(reply) as never)
    rpcMock.mockResolvedValue({ data: null, error: null } as never)

    const result = await addComment(USER_A, CONTENT_ID, 'Nice!', PARENT_COMMENT_ID)
    expect(result.parent_id).toBe(PARENT_COMMENT_ID)
  })

  it('rejects empty comment body', async () => {
    await expect(addComment(USER_A, CONTENT_ID, '')).rejects.toThrow('Comment body cannot be empty')
  })

  it('rejects whitespace-only comment body', async () => {
    await expect(addComment(USER_A, CONTENT_ID, '   ')).rejects.toThrow('Comment body cannot be empty')
  })

  it('rejects comment exceeding 500 characters', async () => {
    const longBody = 'a'.repeat(501)
    await expect(addComment(USER_A, CONTENT_ID, longBody)).rejects.toThrow('cannot exceed 500 characters')
  })

  it('throws not-found when content does not exist', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(addComment(USER_A, CONTENT_ID, 'test')).rejects.toThrow('Content not found')
  })

  it('throws not-found when content is not published', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ id: CONTENT_ID, status: 'draft' }) as never)

    await expect(addComment(USER_A, CONTENT_ID, 'test')).rejects.toThrow('Content not found')
  })

  it('throws not-found when parent comment does not exist', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ id: CONTENT_ID, status: 'published' }) as never)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(addComment(USER_A, CONTENT_ID, 'reply', 'bad-parent-id')).rejects.toThrow(
      'Parent comment not found',
    )
  })

  it('throws when parent belongs to different content', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ id: CONTENT_ID, status: 'published' }) as never)
    fromMock.mockReturnValueOnce(
      mockChain({ id: PARENT_COMMENT_ID, content_id: 'other-content', parent_id: null, deleted_at: null }) as never,
    )

    await expect(addComment(USER_A, CONTENT_ID, 'reply', PARENT_COMMENT_ID)).rejects.toThrow(
      'Parent comment belongs to a different content',
    )
  })

  it('rejects nested reply (only one level of threading)', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ id: CONTENT_ID, status: 'published' }) as never)
    // Parent itself has a parent_id (is already a reply)
    fromMock.mockReturnValueOnce(
      mockChain({
        id: PARENT_COMMENT_ID,
        content_id: CONTENT_ID,
        parent_id: 'grandparent-id',
        deleted_at: null,
      }) as never,
    )

    await expect(addComment(USER_A, CONTENT_ID, 'nested', PARENT_COMMENT_ID)).rejects.toThrow(
      'Only one level of threading allowed',
    )
  })
})

// ── editComment ────────────────────────────────────────────────────────

describe('editComment', () => {
  it('updates comment body and sets is_edited', async () => {
    const fromMock = vi.mocked(supabase.from)
    // 1. fetch existing
    fromMock.mockReturnValueOnce(
      mockChain({ id: COMMENT_ID, user_id: USER_A, deleted_at: null }) as never,
    )
    // 2. update
    const updated = { ...mockComment, body: 'Updated!', is_edited: true }
    fromMock.mockReturnValueOnce(mockChain(updated) as never)

    const result = await editComment(USER_A, COMMENT_ID, 'Updated!')
    expect(result.body).toBe('Updated!')
    expect(result.is_edited).toBe(true)
  })

  it('rejects empty body', async () => {
    await expect(editComment(USER_A, COMMENT_ID, '')).rejects.toThrow('Comment body cannot be empty')
  })

  it('throws not-found for non-existent comment', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(editComment(USER_A, COMMENT_ID, 'test')).rejects.toThrow('Comment not found')
  })

  it('throws not-found for deleted comment', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain({ id: COMMENT_ID, user_id: USER_A, deleted_at: '2025-01-01' }) as never,
    )

    await expect(editComment(USER_A, COMMENT_ID, 'test')).rejects.toThrow('Comment not found')
  })

  it('throws forbidden when editing another user comment', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain({ id: COMMENT_ID, user_id: USER_B, deleted_at: null }) as never,
    )

    await expect(editComment(USER_A, COMMENT_ID, 'hacked!')).rejects.toThrow(
      'You can only edit your own comments',
    )
  })
})

// ── deleteComment ──────────────────────────────────────────────────────

describe('deleteComment', () => {
  it('soft-deletes comment and decrements count', async () => {
    const fromMock = vi.mocked(supabase.from)
    const rpcMock = vi.mocked(supabase.rpc)
    // 1. fetch existing
    fromMock.mockReturnValueOnce(
      mockChain({ id: COMMENT_ID, user_id: USER_A, content_id: CONTENT_ID, deleted_at: null }) as never,
    )
    // 2. soft delete (update)
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    // 3. decrement
    rpcMock.mockResolvedValue({ data: null, error: null } as never)

    await deleteComment(USER_A, COMMENT_ID)
    expect(rpcMock).toHaveBeenCalledWith('increment_count', expect.objectContaining({
      column_name: 'comment_count',
      amount: -1,
    }))
  })

  it('throws not-found for non-existent comment', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(deleteComment(USER_A, COMMENT_ID)).rejects.toThrow('Comment not found')
  })

  it('throws not-found for already-deleted comment', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain({ id: COMMENT_ID, user_id: USER_A, content_id: CONTENT_ID, deleted_at: '2025-01-01' }) as never,
    )

    await expect(deleteComment(USER_A, COMMENT_ID)).rejects.toThrow('Comment not found')
  })

  it('throws forbidden when deleting another user comment', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain({ id: COMMENT_ID, user_id: USER_B, content_id: CONTENT_ID, deleted_at: null }) as never,
    )

    await expect(deleteComment(USER_A, COMMENT_ID)).rejects.toThrow(
      'You can only delete your own comments',
    )
  })
})

// ── listComments ───────────────────────────────────────────────────────

describe('listComments', () => {
  it('returns top-level comments with nested replies', async () => {
    const fromMock = vi.mocked(supabase.from)

    const topLevel = [
      {
        id: 'c1',
        content_id: CONTENT_ID,
        user_id: USER_A,
        parent_id: null,
        body: 'Top comment',
        is_edited: false,
        deleted_at: null,
        created_at: '2025-01-01',
        users: { id: USER_A, display_name: 'User A', username: 'usera', avatar_url: null },
      },
    ]
    // 1. top-level query
    fromMock.mockReturnValueOnce(mockChain(topLevel) as never)
    // 2. replies query
    const replies = [
      {
        id: 'r1',
        content_id: CONTENT_ID,
        user_id: USER_B,
        parent_id: 'c1',
        body: 'Reply!',
        is_edited: false,
        deleted_at: null,
        created_at: '2025-01-02',
        users: { id: USER_B, display_name: 'User B', username: 'userb', avatar_url: null },
      },
    ]
    fromMock.mockReturnValueOnce(mockChain(replies) as never)

    const result = await listComments(CONTENT_ID, null, 20)
    expect(result.items).toHaveLength(1)
    expect(result.items[0]!.replies).toHaveLength(1)
    expect(result.items[0]!.body).toBe('Top comment')
    expect(result.items[0]!.replies[0]!.body).toBe('Reply!')
  })

  it('returns null body for deleted comments', async () => {
    const fromMock = vi.mocked(supabase.from)
    const deletedComment = [
      {
        id: 'c1',
        content_id: CONTENT_ID,
        user_id: USER_A,
        parent_id: null,
        body: 'Original text',
        is_edited: false,
        deleted_at: '2025-01-05',
        created_at: '2025-01-01',
        users: { id: USER_A, display_name: 'User A', username: 'usera', avatar_url: null },
      },
    ]
    fromMock.mockReturnValueOnce(mockChain(deletedComment) as never)
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    const result = await listComments(CONTENT_ID, null, 20)
    expect(result.items[0]!.body).toBeNull()
    expect(result.items[0]!.is_deleted).toBe(true)
  })

  it('returns empty items when no comments exist', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    const result = await listComments(CONTENT_ID, null, 20)
    expect(result.items).toHaveLength(0)
    expect(result.next_cursor).toBeNull()
  })

  it('returns next_cursor when more items exist', async () => {
    const fromMock = vi.mocked(supabase.from)
    const comments = [
      { id: 'c1', parent_id: null, body: 'A', is_edited: false, deleted_at: null, created_at: '2025-01-01', users: {} },
      { id: 'c2', parent_id: null, body: 'B', is_edited: false, deleted_at: null, created_at: '2025-01-02', users: {} },
      { id: 'c3', parent_id: null, body: 'C', is_edited: false, deleted_at: null, created_at: '2025-01-03', users: {} },
    ]
    fromMock.mockReturnValueOnce(mockChain(comments) as never)
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    const result = await listComments(CONTENT_ID, null, 2)
    expect(result.items).toHaveLength(2)
    expect(result.next_cursor).toBe('2025-01-02')
  })
})
