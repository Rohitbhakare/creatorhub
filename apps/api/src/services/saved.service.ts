import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'

const DEFAULT_LIST_NAME = 'My saved trips'

// ─── Get User Lists ──────────────────────────────────────────

export async function getUserLists(userId: string) {
  const { data, error } = await supabase
    .from('saved_lists')
    .select('id, name, cover_content_id, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw new AppError('db-error', 500, 'Failed to fetch saved lists')

  // Get item counts for each list
  const listIds = (data ?? []).map((l) => l.id)
  const counts = new Map<string, number>()

  if (listIds.length > 0) {
    const { data: countData, error: countError } = await supabase
      .from('saved_list_items')
      .select('list_id')
      .in('list_id', listIds)

    if (!countError && countData) {
      for (const item of countData) {
        counts.set(item.list_id, (counts.get(item.list_id) ?? 0) + 1)
      }
    }
  }

  // Get cover images
  const coverIds = (data ?? [])
    .map((l) => l.cover_content_id)
    .filter((id): id is string => id !== null)

  const covers = new Map<string, string>()
  if (coverIds.length > 0) {
    const { data: coverData } = await supabase
      .from('content')
      .select('id, cover_image_url')
      .in('id', coverIds)

    if (coverData) {
      for (const c of coverData) {
        if (c.cover_image_url) covers.set(c.id, c.cover_image_url)
      }
    }
  }

  return (data ?? []).map((list) => ({
    id: list.id,
    name: list.name,
    item_count: counts.get(list.id) ?? 0,
    cover_url: list.cover_content_id ? covers.get(list.cover_content_id) ?? null : null,
    updated_at: list.updated_at,
  }))
}

// ─── Create List ─────────────────────────────────────────────

export async function createList(userId: string, name: string) {
  if (!name || name.trim().length === 0) {
    throw new AppError('validation-failed', 400, 'List name cannot be empty')
  }

  if (name.trim().length > 100) {
    throw new AppError('validation-failed', 400, 'List name cannot exceed 100 characters')
  }

  const { data, error } = await supabase
    .from('saved_lists')
    .insert({ user_id: userId, name: name.trim() })
    .select('id, name, created_at')
    .single()

  if (error || !data) {
    throw new AppError('db-error', 500, 'Failed to create list')
  }

  return data
}

// ─── Rename List ─────────────────────────────────────────────

export async function renameList(userId: string, listId: string, name: string) {
  if (!name || name.trim().length === 0) {
    throw new AppError('validation-failed', 400, 'List name cannot be empty')
  }

  // Verify ownership
  const { data: list, error: fetchError } = await supabase
    .from('saved_lists')
    .select('id, user_id')
    .eq('id', listId)
    .maybeSingle()

  if (fetchError || !list) {
    throw new AppError('not-found', 404, 'List not found')
  }

  if (list.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You can only rename your own lists')
  }

  const { data, error } = await supabase
    .from('saved_lists')
    .update({ name: name.trim() })
    .eq('id', listId)
    .select('id, name, updated_at')
    .single()

  if (error || !data) {
    throw new AppError('db-error', 500, 'Failed to rename list')
  }

  return data
}

// ─── Delete List ─────────────────────────────────────────────

export async function deleteList(userId: string, listId: string) {
  const { data: list, error: fetchError } = await supabase
    .from('saved_lists')
    .select('id, user_id')
    .eq('id', listId)
    .maybeSingle()

  if (fetchError || !list) {
    throw new AppError('not-found', 404, 'List not found')
  }

  if (list.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You can only delete your own lists')
  }

  // CASCADE deletes saved_list_items automatically
  const { error } = await supabase
    .from('saved_lists')
    .delete()
    .eq('id', listId)

  if (error) throw new AppError('db-error', 500, 'Failed to delete list')
}

// ─── Get List Items ──────────────────────────────────────────

type SortOption = 'recently_added' | 'oldest' | 'a_z' | 'price_asc' | 'price_desc'

export async function getListItems(
  userId: string,
  listId: string,
  sort: SortOption = 'recently_added',
  typeFilter: string | null,
  cursor: string | null,
  limit: number,
) {
  // Verify ownership
  const { data: list, error: listError } = await supabase
    .from('saved_lists')
    .select('id, user_id, name')
    .eq('id', listId)
    .maybeSingle()

  if (listError || !list) {
    throw new AppError('not-found', 404, 'List not found')
  }

  if (list.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You can only view your own lists')
  }

  // Get items with content join
  let query = supabase
    .from('saved_list_items')
    .select(`
      list_id, content_id, added_at,
      content!saved_list_items_content_id_fkey(id, title, content_type, cover_image_url, price_paisa, status, user_id,
        users!content_user_id_fkey(id, display_name, username, avatar_url))
    `)
    .eq('list_id', listId)

  if (typeFilter) {
    query = query.eq('content.content_type', typeFilter)
  }

  // Apply sort
  switch (sort) {
    case 'recently_added':
      query = query.order('added_at', { ascending: false })
      break
    case 'oldest':
      query = query.order('added_at', { ascending: true })
      break
    default:
      query = query.order('added_at', { ascending: false })
      break
  }

  query = query.limit(limit + 1)

  if (cursor) {
    if (sort === 'oldest') {
      query = query.gt('added_at', cursor)
    } else {
      query = query.lt('added_at', cursor)
    }
  }

  const { data, error } = await query

  if (error) throw new AppError('db-error', 500, 'Failed to fetch list items')

  const hasMore = (data?.length ?? 0) > limit
  const items = (data ?? []).slice(0, limit)
  const nextCursor = hasMore ? items[items.length - 1]!.added_at : null

  // Supabase returns FK joins as arrays — unwrap to single object
  type ListItemRow = { content_id: string; added_at: string; content: Record<string, unknown> | Record<string, unknown>[] | null }
  const unwrap = (row: ListItemRow) => {
    const c = Array.isArray(row.content) ? row.content[0] : row.content
    return { content_id: row.content_id, added_at: row.added_at, content: c ?? null }
  }

  let formatted = items
    .map(unwrap)
    .filter((item) => item.content !== null)

  if (sort === 'a_z') {
    formatted.sort((a, b) =>
      ((a.content?.['title'] as string | null) ?? '').localeCompare(
        (b.content?.['title'] as string | null) ?? '',
      ),
    )
  } else if (sort === 'price_asc') {
    formatted.sort(
      (a, b) =>
        ((a.content?.['price_paisa'] as number | null) ?? 0) -
        ((b.content?.['price_paisa'] as number | null) ?? 0),
    )
  } else if (sort === 'price_desc') {
    formatted.sort(
      (a, b) =>
        ((b.content?.['price_paisa'] as number | null) ?? 0) -
        ((a.content?.['price_paisa'] as number | null) ?? 0),
    )
  }

  return {
    list_name: list.name,
    items: formatted,
    next_cursor: nextCursor,
  }
}

// ─── Save Content to Lists ──────────────────────────────────

export async function saveToLists(
  userId: string,
  contentId: string,
  listIds: string[],
) {
  // Verify content exists
  const { data: content } = await supabase
    .from('content')
    .select('id')
    .eq('id', contentId)
    .maybeSingle()

  if (!content) {
    throw new AppError('not-found', 404, 'Content not found')
  }

  // Auto-create default list if user has no lists
  if (listIds.length === 0) {
    // Check if user has any lists
    const { data: existingLists } = await supabase
      .from('saved_lists')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (!existingLists || existingLists.length === 0) {
      const newList = await createList(userId, DEFAULT_LIST_NAME)
      listIds = [newList.id]
    }
  }

  // Verify all lists belong to user
  if (listIds.length > 0) {
    const { data: userLists, error: listError } = await supabase
      .from('saved_lists')
      .select('id')
      .eq('user_id', userId)
      .in('id', listIds)

    if (listError) throw new AppError('db-error', 500, 'Failed to verify lists')

    const validIds = new Set((userLists ?? []).map((l) => l.id))
    for (const lid of listIds) {
      if (!validIds.has(lid)) {
        throw new AppError('forbidden', 403, `List ${lid} not found or not owned by you`)
      }
    }
  }

  // Check if content was already saved to ANY list by this user (for save_count)
  const { data: existingSaves } = await supabase
    .from('saved_list_items')
    .select('list_id')
    .in('list_id', await getUserListIds(userId))
    .eq('content_id', contentId)

  const wasAlreadySaved = (existingSaves?.length ?? 0) > 0

  // Upsert into all lists in parallel (idempotent)
  await Promise.all(
    listIds.map((listId) =>
      supabase.from('saved_list_items').upsert({ list_id: listId, content_id: contentId }),
    ),
  )

  // Find lists that have no cover yet, then batch-update them
  const coverChecks = await Promise.all(
    listIds.map((listId) =>
      supabase.from('saved_lists').select('id, cover_content_id').eq('id', listId).single(),
    ),
  )
  const listsNeedingCover = coverChecks
    .map((r) => r.data as { id: string; cover_content_id: string | null } | null)
    .filter((d): d is { id: string; cover_content_id: null } => d !== null && !d.cover_content_id)
    .map((d) => d.id)

  if (listsNeedingCover.length > 0) {
    await supabase
      .from('saved_lists')
      .update({ cover_content_id: contentId })
      .in('id', listsNeedingCover)
  }

  // Increment save_count only if user wasn't already saving this content
  if (!wasAlreadySaved) {
    await supabase.rpc('increment_count', {
      table_name: 'content',
      column_name: 'save_count',
      row_id: contentId,
      amount: 1,
    })
  }

  return { saved: true, list_ids: listIds }
}

// ─── Remove Content from Lists ──────────────────────────────

export async function removeFromLists(
  userId: string,
  contentId: string,
  listIds: string[],
) {
  // Verify lists belong to user
  const { data: userLists } = await supabase
    .from('saved_lists')
    .select('id')
    .eq('user_id', userId)
    .in('id', listIds)

  const validIds = new Set((userLists ?? []).map((l) => l.id))

  // No valid lists to remove from — nothing to do
  if (validIds.size === 0) return

  for (const listId of listIds) {
    if (!validIds.has(listId)) continue

    await supabase
      .from('saved_list_items')
      .delete()
      .eq('list_id', listId)
      .eq('content_id', contentId)
  }

  // Check if content is still saved to any of user's lists
  const allListIds = await getUserListIds(userId)
  const { data: remaining } = await supabase
    .from('saved_list_items')
    .select('list_id')
    .in('list_id', allListIds)
    .eq('content_id', contentId)

  // If removed from ALL lists, decrement save_count
  if (!remaining || remaining.length === 0) {
    await supabase.rpc('increment_count', {
      table_name: 'content',
      column_name: 'save_count',
      row_id: contentId,
      amount: -1,
    })
  }
}

// ─── Get Save Status ─────────────────────────────────────────

export async function getSaveStatus(userId: string, contentId: string) {
  const listIds = await getUserListIds(userId)

  if (listIds.length === 0) {
    return { is_saved: false, list_ids: [] }
  }

  const { data, error } = await supabase
    .from('saved_list_items')
    .select('list_id')
    .in('list_id', listIds)
    .eq('content_id', contentId)

  if (error) throw new AppError('db-error', 500, 'Failed to check save status')

  const savedListIds = (data ?? []).map((d) => d.list_id)

  return {
    is_saved: savedListIds.length > 0,
    list_ids: savedListIds,
  }
}

// ─── Helper ──────────────────────────────────────────────────

async function getUserListIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('saved_lists')
    .select('id')
    .eq('user_id', userId)

  return (data ?? []).map((l) => l.id)
}
