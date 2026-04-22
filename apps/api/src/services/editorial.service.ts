// Editorial collections service (E4.1, T9 · ADM-FR-009).
//
// Manual admin CRUD over the `editorial_collections` row created in
// migration 007. The row holds an ordered `content_ids uuid[]` — all
// item operations (append / remove / reorder) are in-place array
// mutations on that column.
//
// Guarantees:
//   - Slug uniqueness is enforced by the DB (`editorial_collections.slug
//     UNIQUE`) — we translate 23505 into 409.
//   - `refreshed_at` is bumped on every mutation so downstream caches
//     can use it as an invalidator.
//   - `appendCollectionItem` verifies the target content exists and is
//     published before adding — admins should never link to draft or
//     removed content.

import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import type {
  CreateCollectionInput,
  UpdateCollectionInput,
} from '@creatorhub/shared'

const COLLECTION_COLUMNS =
  'id, slug, title, subtitle, cover_image_url, content_ids, is_active, priority, source, scheduled_start, scheduled_end, created_by, created_at, refreshed_at'

export interface EditorialCollection {
  id: string
  slug: string
  title: string
  subtitle: string | null
  cover_image_url: string | null
  content_ids: string[]
  is_active: boolean
  priority: number
  source: 'algorithmic' | 'manual'
  scheduled_start: string | null
  scheduled_end: string | null
  created_by: string | null
  created_at: string
  refreshed_at: string
}

export interface CollectionContentItem {
  id: string
  type: string
  title: string
  cover_image_url: string | null
  creator_id: string
  status: string
}

export interface CollectionDetail extends EditorialCollection {
  items: CollectionContentItem[]
}

const DUPLICATE_KEY = '23505'

// ─── List ──────────────────────────────────────────────────────

export async function listCollections(): Promise<EditorialCollection[]> {
  const { data, error } = await supabase
    .from('editorial_collections')
    .select(COLLECTION_COLUMNS)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[editorial.list] supabase error:', error.message)
    throw new AppError('db-error', 500, 'Failed to list collections')
  }
  return data as EditorialCollection[]
}

// ─── Create ────────────────────────────────────────────────────

export async function createCollection(
  input: CreateCollectionInput,
  createdBy: string,
): Promise<EditorialCollection> {
  const insertRow = {
    slug: input.slug,
    title: input.title,
    subtitle: input.subtitle ?? null,
    cover_image_url: input.cover_image_url ?? null,
    content_ids: input.content_ids,
    priority: input.priority,
    source: input.source,
    is_active: true,
    created_by: createdBy,
  }

  const { data, error } = await supabase
    .from('editorial_collections')
    .insert(insertRow)
    .select(COLLECTION_COLUMNS)
    .single()

  if (error) {
    if ((error as { code?: string }).code === DUPLICATE_KEY) {
      throw new AppError('conflict', 409, 'A collection with this slug already exists')
    }
    console.error('[editorial.create] supabase error:', error.message)
    throw new AppError('db-error', 500, 'Failed to create collection')
  }
  return data as EditorialCollection
}

// ─── Get (with resolved content) ───────────────────────────────

export async function getCollectionDetail(
  id: string,
): Promise<CollectionDetail> {
  const { data: row, error } = await supabase
    .from('editorial_collections')
    .select(COLLECTION_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[editorial.get] supabase error:', error.message)
    throw new AppError('db-error', 500, 'Failed to fetch collection')
  }
  if (!row) throw new AppError('not-found', 404, 'Collection not found')

  const collection = row as EditorialCollection
  const items = await resolveContentItems(collection.content_ids)
  return { ...collection, items }
}

/**
 * Fetch the subset of content rows whose ids appear in `ids`, then
 * reorder them to match the array. Missing ids (deleted content) are
 * silently dropped — admin UI surfaces the gap via item count.
 */
async function resolveContentItems(
  ids: string[],
): Promise<CollectionContentItem[]> {
  if (ids.length === 0) return []

  const { data, error } = await supabase
    .from('content')
    .select('id, type, title, cover_image_url, creator_id, status')
    .in('id', ids)

  if (error) {
    console.error('[editorial.resolveItems] supabase error:', error.message)
    throw new AppError('db-error', 500, 'Failed to resolve collection content')
  }

  const rows = (data as CollectionContentItem[] | null) ?? []
  const byId = new Map(rows.map((r) => [r.id, r]))
  const ordered: CollectionContentItem[] = []
  for (const id of ids) {
    const item = byId.get(id)
    if (item) ordered.push(item)
  }
  return ordered
}

// ─── Update ────────────────────────────────────────────────────

export async function updateCollection(
  id: string,
  patch: UpdateCollectionInput,
): Promise<EditorialCollection> {
  const updates: Record<string, unknown> = {
    refreshed_at: new Date().toISOString(),
  }
  if (patch.slug !== undefined) updates['slug'] = patch.slug
  if (patch.title !== undefined) updates['title'] = patch.title
  if (patch.subtitle !== undefined) updates['subtitle'] = patch.subtitle
  if (patch.cover_image_url !== undefined) {
    updates['cover_image_url'] = patch.cover_image_url
  }
  if (patch.is_active !== undefined) updates['is_active'] = patch.is_active
  if (patch.priority !== undefined) updates['priority'] = patch.priority
  if (patch.content_ids !== undefined) updates['content_ids'] = patch.content_ids

  const { data, error } = await supabase
    .from('editorial_collections')
    .update(updates)
    .eq('id', id)
    .select(COLLECTION_COLUMNS)
    .maybeSingle()

  if (error) {
    if ((error as { code?: string }).code === DUPLICATE_KEY) {
      throw new AppError('conflict', 409, 'A collection with this slug already exists')
    }
    console.error('[editorial.update] supabase error:', error.message)
    throw new AppError('db-error', 500, 'Failed to update collection')
  }
  if (!data) throw new AppError('not-found', 404, 'Collection not found')
  return data as EditorialCollection
}

// ─── Delete ────────────────────────────────────────────────────

export async function deleteCollection(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('editorial_collections')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[editorial.delete] supabase error:', error.message)
    throw new AppError('db-error', 500, 'Failed to delete collection')
  }
  if (!data) throw new AppError('not-found', 404, 'Collection not found')
}

// ─── Items ─────────────────────────────────────────────────────

const MAX_ITEMS = 200

/**
 * Append a content id to the collection's `content_ids` array. No-op
 * if the id is already present (idempotent). Refuses if the content
 * does not exist or is not published (409) — admins should never link
 * to draft or removed posts.
 */
export async function appendCollectionItem(
  collectionId: string,
  contentId: string,
): Promise<EditorialCollection> {
  await assertContentPublished(contentId)
  const current = await loadContentIds(collectionId)

  if (current.includes(contentId)) {
    // Already present — return the current row without bumping
    // refreshed_at, so repeated clicks are cheap.
    return (await fetchCollection(collectionId))
  }

  if (current.length >= MAX_ITEMS) {
    throw new AppError(
      'conflict',
      409,
      `Collection already has the maximum of ${MAX_ITEMS} items`,
    )
  }

  const next = [...current, contentId]
  return updateContentIds(collectionId, next)
}

export async function removeCollectionItem(
  collectionId: string,
  contentId: string,
): Promise<EditorialCollection> {
  const current = await loadContentIds(collectionId)
  if (!current.includes(contentId)) {
    // Be permissive — removing something not there is already the
    // desired state.
    return (await fetchCollection(collectionId))
  }

  const next = current.filter((id) => id !== contentId)
  return updateContentIds(collectionId, next)
}

// ─── Helpers ───────────────────────────────────────────────────

async function loadContentIds(collectionId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('editorial_collections')
    .select('id, content_ids')
    .eq('id', collectionId)
    .maybeSingle()

  if (error) {
    console.error('[editorial.loadIds] supabase error:', error.message)
    throw new AppError('db-error', 500, 'Failed to load collection')
  }
  if (!data) throw new AppError('not-found', 404, 'Collection not found')
  return ((data as { content_ids?: string[] }).content_ids ?? []).slice()
}

async function fetchCollection(id: string): Promise<EditorialCollection> {
  const { data, error } = await supabase
    .from('editorial_collections')
    .select(COLLECTION_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[editorial.fetch] supabase error:', error.message)
    throw new AppError('db-error', 500, 'Failed to fetch collection')
  }
  if (!data) throw new AppError('not-found', 404, 'Collection not found')
  return data as EditorialCollection
}

async function updateContentIds(
  collectionId: string,
  nextIds: string[],
): Promise<EditorialCollection> {
  const { data, error } = await supabase
    .from('editorial_collections')
    .update({
      content_ids: nextIds,
      refreshed_at: new Date().toISOString(),
    })
    .eq('id', collectionId)
    .select(COLLECTION_COLUMNS)
    .maybeSingle()

  if (error) {
    console.error('[editorial.updateIds] supabase error:', error.message)
    throw new AppError('db-error', 500, 'Failed to update collection items')
  }
  if (!data) throw new AppError('not-found', 404, 'Collection not found')
  return data as EditorialCollection
}

async function assertContentPublished(contentId: string): Promise<void> {
  const { data, error } = await supabase
    .from('content')
    .select('id, status')
    .eq('id', contentId)
    .maybeSingle()

  if (error) {
    console.error('[editorial.assertPublished] supabase error:', error.message)
    throw new AppError('db-error', 500, 'Failed to look up content')
  }
  if (!data) throw new AppError('not-found', 404, 'Content not found')
  const status = (data as { status?: string }).status
  if (status !== 'published') {
    throw new AppError(
      'conflict',
      409,
      'Only published content can be added to a collection',
    )
  }
}
