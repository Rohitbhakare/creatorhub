import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────────────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn(), rpc: vi.fn() }
  return { supabase: mockSupabase }
})

import {
  getUserLists,
  createList,
  renameList,
  deleteList,
  getListItems,
  saveToLists,
  removeFromLists,
  getSaveStatus,
} from './saved.service.js'
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
    upsert: vi.fn().mockReturnThis(),
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

const USER_ID = 'aaa-111'
const LIST_ID = 'bbb-222'
const CONTENT_ID = 'ccc-333'
const ANOTHER_LIST_ID = 'ddd-444'

const mockList = {
  id: LIST_ID,
  name: 'My Trips',
  cover_content_id: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

// Use resetAllMocks to clear both call records AND mockReturnValueOnce queues
beforeEach(() => {
  vi.resetAllMocks()
})

// ── getUserLists ───────────────────────────────────────────────────────

describe('getUserLists', () => {
  it('returns lists with item counts', async () => {
    const fromMock = vi.mocked(supabase.from)
    // 1. saved_lists
    fromMock.mockReturnValueOnce(mockChain([mockList]) as never)
    // 2. saved_list_items (count) — listIds=[LIST_ID], so query runs
    fromMock.mockReturnValueOnce(mockChain([{ list_id: LIST_ID }, { list_id: LIST_ID }]) as never)
    // cover_content_id is null → covers query skipped

    const result = await getUserLists(USER_ID)
    expect(result).toHaveLength(1)
    expect(result[0]!.item_count).toBe(2)
    expect(result[0]!.cover_url).toBeNull()
  })

  it('includes cover_url when list has a cover content', async () => {
    const fromMock = vi.mocked(supabase.from)
    const listWithCover = { ...mockList, cover_content_id: CONTENT_ID }
    // 1. saved_lists
    fromMock.mockReturnValueOnce(mockChain([listWithCover]) as never)
    // 2. saved_list_items (count)
    fromMock.mockReturnValueOnce(mockChain([]) as never)
    // 3. content covers (cover_content_id is set, so runs)
    fromMock.mockReturnValueOnce(
      mockChain([{ id: CONTENT_ID, cover_image_url: 'https://example.com/cover.jpg' }]) as never,
    )

    const result = await getUserLists(USER_ID)
    expect(result[0]!.cover_url).toBe('https://example.com/cover.jpg')
  })

  it('returns empty array when user has no lists', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    const result = await getUserLists(USER_ID)
    expect(result).toHaveLength(0)
  })

  it('throws db-error when query fails', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'db error' }) as never)

    await expect(getUserLists(USER_ID)).rejects.toThrow('Failed to fetch saved lists')
  })
})

// ── createList ────────────────────────────────────────────────────────

describe('createList', () => {
  it('creates a new list', async () => {
    const fromMock = vi.mocked(supabase.from)
    const created = { id: LIST_ID, name: 'My Trips', created_at: '2025-01-01' }
    fromMock.mockReturnValueOnce(mockChain(created) as never)

    const result = await createList(USER_ID, 'My Trips')
    expect(result.name).toBe('My Trips')
    expect(result.id).toBe(LIST_ID)
  })

  it('trims whitespace from list name', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ id: LIST_ID, name: 'My Trips', created_at: '2025-01-01' }) as never)

    await createList(USER_ID, '  My Trips  ')
    const chain = fromMock.mock.results[0]?.value as Record<string, ReturnType<typeof vi.fn>>
    expect(chain.insert).toHaveBeenCalledWith(expect.objectContaining({ name: 'My Trips' }))
  })

  it('rejects empty name', async () => {
    await expect(createList(USER_ID, '')).rejects.toThrow('List name cannot be empty')
  })

  it('rejects whitespace-only name', async () => {
    await expect(createList(USER_ID, '   ')).rejects.toThrow('List name cannot be empty')
  })

  it('rejects name exceeding 100 characters', async () => {
    await expect(createList(USER_ID, 'a'.repeat(101))).rejects.toThrow('cannot exceed 100 characters')
  })
})

// ── renameList ────────────────────────────────────────────────────────

describe('renameList', () => {
  it('renames list when owned by user', async () => {
    const fromMock = vi.mocked(supabase.from)
    // 1. fetch list for ownership check
    fromMock.mockReturnValueOnce(mockChain({ id: LIST_ID, user_id: USER_ID }) as never)
    // 2. update
    fromMock.mockReturnValueOnce(mockChain({ id: LIST_ID, name: 'New Name', updated_at: '2025-01-02' }) as never)

    const result = await renameList(USER_ID, LIST_ID, 'New Name')
    expect(result.name).toBe('New Name')
  })

  it('throws not-found when list does not exist', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(renameList(USER_ID, LIST_ID, 'New Name')).rejects.toThrow('List not found')
  })

  it('throws forbidden when list belongs to another user', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ id: LIST_ID, user_id: 'other-user' }) as never)

    await expect(renameList(USER_ID, LIST_ID, 'Hacked')).rejects.toThrow('You can only rename your own lists')
  })

  it('rejects empty name', async () => {
    await expect(renameList(USER_ID, LIST_ID, '')).rejects.toThrow('List name cannot be empty')
  })
})

// ── deleteList ────────────────────────────────────────────────────────

describe('deleteList', () => {
  it('deletes list when owned by user', async () => {
    const fromMock = vi.mocked(supabase.from)
    // 1. fetch list
    fromMock.mockReturnValueOnce(mockChain({ id: LIST_ID, user_id: USER_ID }) as never)
    // 2. delete
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(deleteList(USER_ID, LIST_ID)).resolves.toBeUndefined()
  })

  it('throws not-found when list does not exist', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(deleteList(USER_ID, LIST_ID)).rejects.toThrow('List not found')
  })

  it('throws forbidden when list belongs to another user', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ id: LIST_ID, user_id: 'other-user' }) as never)

    await expect(deleteList(USER_ID, LIST_ID)).rejects.toThrow('You can only delete your own lists')
  })
})

// ── getListItems ──────────────────────────────────────────────────────

describe('getListItems', () => {
  const mockItemRow = {
    content_id: CONTENT_ID,
    added_at: '2025-01-01T00:00:00Z',
  }
  const mockContentRow = {
    id: CONTENT_ID,
    title: 'Test',
    content_type: 'post',
    cover_image_url: null,
    price_paisa: 0,
    status: 'published',
    user_id: USER_ID,
    users: [],
  }

  it('returns list items for the owner', async () => {
    const fromMock = vi.mocked(supabase.from)
    // 1. list ownership (saved_lists)
    fromMock.mockReturnValueOnce(mockChain({ id: LIST_ID, user_id: USER_ID, name: 'My List' }) as never)
    // 2. saved_list_items rows
    fromMock.mockReturnValueOnce(mockChain([mockItemRow]) as never)
    // 3. content rows for those IDs
    fromMock.mockReturnValueOnce(mockChain([mockContentRow]) as never)

    const result = await getListItems(USER_ID, LIST_ID, 'recently_added', null, null, 20)
    expect(result.list_name).toBe('My List')
    expect(result.items).toHaveLength(1)
  })

  it('throws not-found when list does not exist', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(getListItems(USER_ID, LIST_ID, 'recently_added', null, null, 20)).rejects.toThrow('List not found')
  })

  it('throws forbidden when list belongs to another user', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ id: LIST_ID, user_id: 'other-user', name: 'Other List' }) as never)

    await expect(getListItems(USER_ID, LIST_ID, 'recently_added', null, null, 20)).rejects.toThrow(
      'You can only view your own lists',
    )
  })

  it('returns next_cursor when more items exist', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ id: LIST_ID, user_id: USER_ID, name: 'My List' }) as never)
    const items = [
      { ...mockItemRow, added_at: '2025-01-03' },
      { ...mockItemRow, added_at: '2025-01-02' },
      { ...mockItemRow, added_at: '2025-01-01' },
    ]
    fromMock.mockReturnValueOnce(mockChain(items) as never)
    // content rows for the page (only first 2 — service trims itemRows to limit before content fetch)
    fromMock.mockReturnValueOnce(mockChain([mockContentRow]) as never)

    const result = await getListItems(USER_ID, LIST_ID, 'recently_added', null, null, 2)
    expect(result.items).toHaveLength(2)
    expect(result.next_cursor).toBe('2025-01-02')
  })
})

// ── saveToLists ───────────────────────────────────────────────────────
//
// IMPORTANT: In saveToLists, JS evaluates method chains left-to-right.
// For `.in('list_id', await getUserListIds(userId))`:
//   1. `from('saved_list_items')` is called FIRST (synchronous)
//   2. `getUserListIds` is awaited SECOND (as argument to .in())
// So mock order is: saved_list_items chain setup BEFORE getUserListIds.

describe('saveToLists', () => {
  it('saves content to specified lists and increments save_count', async () => {
    const fromMock = vi.mocked(supabase.from)
    const rpcMock = vi.mocked(supabase.rpc)
    // 1. content exists
    fromMock.mockReturnValueOnce(mockChain({ id: CONTENT_ID }) as never)
    // 2. ownership check — [LIST_ID] is owned by user
    fromMock.mockReturnValueOnce(mockChain([{ id: LIST_ID }]) as never)
    // 3. from('saved_list_items') — existingSaves chain setup (BEFORE getUserListIds!)
    fromMock.mockReturnValueOnce(mockChain([]) as never)  // not yet saved
    // 4. getUserListIds → from('saved_lists') — inner call in .in() argument
    fromMock.mockReturnValueOnce(mockChain([{ id: LIST_ID }]) as never)
    // 5. parallel upsert into LIST_ID
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    // 6. parallel cover check (single) — no cover yet
    fromMock.mockReturnValueOnce(mockChain({ id: LIST_ID, cover_content_id: null }) as never)
    // 7. batch update cover (lists with no cover)
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    rpcMock.mockResolvedValue({ data: null, error: null } as never)

    const result = await saveToLists(USER_ID, CONTENT_ID, [LIST_ID])
    expect(result.saved).toBe(true)
    expect(result.list_ids).toContain(LIST_ID)
    expect(rpcMock).toHaveBeenCalledWith('increment_count', expect.objectContaining({
      column_name: 'save_count',
      amount: 1,
    }))
  })

  it('does NOT increment save_count if already saved to another list', async () => {
    const fromMock = vi.mocked(supabase.from)
    const rpcMock = vi.mocked(supabase.rpc)
    // 1. content exists
    fromMock.mockReturnValueOnce(mockChain({ id: CONTENT_ID }) as never)
    // 2. ownership check — ANOTHER_LIST_ID owned
    fromMock.mockReturnValueOnce(mockChain([{ id: ANOTHER_LIST_ID }]) as never)
    // 3. from('saved_list_items') — existingSaves chain (already saved in LIST_ID)
    fromMock.mockReturnValueOnce(mockChain([{ list_id: LIST_ID }]) as never)
    // 4. getUserListIds → user has both lists
    fromMock.mockReturnValueOnce(mockChain([{ id: LIST_ID }, { id: ANOTHER_LIST_ID }]) as never)
    // 5. parallel upsert into ANOTHER_LIST_ID
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    // 6. parallel cover check — already has cover (no batch update needed)
    fromMock.mockReturnValueOnce(mockChain({ id: ANOTHER_LIST_ID, cover_content_id: CONTENT_ID }) as never)

    await saveToLists(USER_ID, CONTENT_ID, [ANOTHER_LIST_ID])
    // wasAlreadySaved = true → rpc NOT called
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('throws not-found when content does not exist', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(saveToLists(USER_ID, CONTENT_ID, [LIST_ID])).rejects.toThrow('Content not found')
  })

  it('throws forbidden when list not owned by user', async () => {
    const fromMock = vi.mocked(supabase.from)
    // 1. content exists
    fromMock.mockReturnValueOnce(mockChain({ id: CONTENT_ID }) as never)
    // 2. ownership check — user owns no matching lists
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    await expect(saveToLists(USER_ID, CONTENT_ID, [LIST_ID])).rejects.toThrow('not found or not owned by you')
  })
})

// ── removeFromLists ───────────────────────────────────────────────────

describe('removeFromLists', () => {
  it('decrements save_count when removed from all lists', async () => {
    const fromMock = vi.mocked(supabase.from)
    const rpcMock = vi.mocked(supabase.rpc)
    // 1. verify user owns LIST_ID
    fromMock.mockReturnValueOnce(mockChain([{ id: LIST_ID }]) as never)
    // 2. delete from saved_list_items
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    // 3. getUserListIds (to check remaining saves)
    fromMock.mockReturnValueOnce(mockChain([{ id: LIST_ID }]) as never)
    // 4. check remaining saves — none left
    fromMock.mockReturnValueOnce(mockChain([]) as never)
    rpcMock.mockResolvedValue({ data: null, error: null } as never)

    await removeFromLists(USER_ID, CONTENT_ID, [LIST_ID])
    expect(rpcMock).toHaveBeenCalledWith('increment_count', expect.objectContaining({
      column_name: 'save_count',
      amount: -1,
    }))
  })

  it('does NOT decrement if still saved in another list', async () => {
    const fromMock = vi.mocked(supabase.from)
    const rpcMock = vi.mocked(supabase.rpc)
    // 1. verify user owns LIST_ID
    fromMock.mockReturnValueOnce(mockChain([{ id: LIST_ID }]) as never)
    // 2. delete from saved_list_items
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    // 3. getUserListIds
    fromMock.mockReturnValueOnce(mockChain([{ id: LIST_ID }, { id: ANOTHER_LIST_ID }]) as never)
    // 4. still saved in ANOTHER_LIST_ID
    fromMock.mockReturnValueOnce(mockChain([{ list_id: ANOTHER_LIST_ID }]) as never)

    await removeFromLists(USER_ID, CONTENT_ID, [LIST_ID])
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('skips invalid list IDs silently', async () => {
    const fromMock = vi.mocked(supabase.from)
    const rpcMock = vi.mocked(supabase.rpc)
    // 1. user owns no lists matching 'not-my-list' → validIds is empty → early return
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    await expect(removeFromLists(USER_ID, CONTENT_ID, ['not-my-list'])).resolves.toBeUndefined()
    expect(rpcMock).not.toHaveBeenCalled()
  })
})

// ── getSaveStatus ─────────────────────────────────────────────────────

describe('getSaveStatus', () => {
  it('returns is_saved=false when user has no lists', async () => {
    const fromMock = vi.mocked(supabase.from)
    // getUserListIds → empty
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    const result = await getSaveStatus(USER_ID, CONTENT_ID)
    expect(result.is_saved).toBe(false)
    expect(result.list_ids).toHaveLength(0)
  })

  it('returns is_saved=true with matching list_ids', async () => {
    const fromMock = vi.mocked(supabase.from)
    // 1. getUserListIds
    fromMock.mockReturnValueOnce(mockChain([{ id: LIST_ID }]) as never)
    // 2. saved_list_items check
    fromMock.mockReturnValueOnce(mockChain([{ list_id: LIST_ID }]) as never)

    const result = await getSaveStatus(USER_ID, CONTENT_ID)
    expect(result.is_saved).toBe(true)
    expect(result.list_ids).toContain(LIST_ID)
  })

  it('returns is_saved=false when content not saved in any list', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain([{ id: LIST_ID }]) as never)
    fromMock.mockReturnValueOnce(mockChain([]) as never)

    const result = await getSaveStatus(USER_ID, CONTENT_ID)
    expect(result.is_saved).toBe(false)
  })
})
