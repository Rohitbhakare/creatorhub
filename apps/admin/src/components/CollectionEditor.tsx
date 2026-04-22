'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { apiFetch, ClientApiError } from '../lib/api'

export interface CollectionItem {
  id: string
  type: string
  title: string
  cover_image_url: string | null
  creator_id: string
  status: string
}

export interface CollectionDetail {
  id: string
  slug: string
  title: string
  subtitle: string | null
  cover_image_url: string | null
  content_ids: string[]
  is_active: boolean
  priority: number
  source: 'algorithmic' | 'manual'
  created_at: string
  refreshed_at: string
  items: CollectionItem[]
}

interface ContentSearchRow {
  id: string
  title: string
  type: string
  creator_username: string | null
}

export function CollectionEditor({
  initial,
}: {
  initial: CollectionDetail
}): React.JSX.Element {
  const router = useRouter()
  const [collection, setCollection] = useState<CollectionDetail>(initial)
  const [savingMeta, setSavingMeta] = useState(false)
  const [metaError, setMetaError] = useState<string | null>(null)
  const [itemError, setItemError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Editable meta
  const [title, setTitle] = useState(initial.title)
  const [subtitle, setSubtitle] = useState(initial.subtitle ?? '')
  const [priority, setPriority] = useState(String(initial.priority))
  const [isActive, setIsActive] = useState(initial.is_active)

  const dirty =
    title !== collection.title ||
    (subtitle || null) !== collection.subtitle ||
    Number(priority) !== collection.priority ||
    isActive !== collection.is_active

  async function saveMeta(): Promise<void> {
    setSavingMeta(true)
    setMetaError(null)
    try {
      const patch: Record<string, unknown> = {}
      if (title !== collection.title) patch['title'] = title
      if ((subtitle || null) !== collection.subtitle) {
        patch['subtitle'] = subtitle.trim().length > 0 ? subtitle : null
      }
      if (Number(priority) !== collection.priority) {
        patch['priority'] = Number(priority)
      }
      if (isActive !== collection.is_active) patch['is_active'] = isActive
      const next = await apiFetch<CollectionDetail>(
        `/admin/collections/${collection.id}`,
        { method: 'PATCH', body: patch },
      )
      setCollection({ ...collection, ...next, items: collection.items })
      router.refresh()
    } catch (err) {
      if (err instanceof ClientApiError) setMetaError(err.message)
      else setMetaError('Save failed. Retry.')
    } finally {
      setSavingMeta(false)
    }
  }

  async function removeItem(contentId: string): Promise<void> {
    setItemError(null)
    try {
      await apiFetch(
        `/admin/collections/${collection.id}/items/${contentId}`,
        { method: 'DELETE' },
      )
      setCollection((prev) => ({
        ...prev,
        content_ids: prev.content_ids.filter((x) => x !== contentId),
        items: prev.items.filter((x) => x.id !== contentId),
      }))
    } catch (err) {
      if (err instanceof ClientApiError) setItemError(err.message)
      else setItemError('Remove failed. Retry.')
    }
  }

  async function reorder(contentId: string, direction: -1 | 1): Promise<void> {
    setItemError(null)
    const idx = collection.content_ids.indexOf(contentId)
    if (idx === -1) return
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= collection.content_ids.length) return
    const next = [...collection.content_ids]
    const moved = next[idx]
    const swapped = next[newIdx]
    if (moved === undefined || swapped === undefined) return
    next[idx] = swapped
    next[newIdx] = moved
    try {
      await apiFetch(`/admin/collections/${collection.id}`, {
        method: 'PATCH',
        body: { content_ids: next },
      })
      const itemsById = new Map(collection.items.map((i) => [i.id, i]))
      const orderedItems = next
        .map((id) => itemsById.get(id))
        .filter((x): x is CollectionItem => x !== undefined)
      setCollection((prev) => ({
        ...prev,
        content_ids: next,
        items: orderedItems,
      }))
    } catch (err) {
      if (err instanceof ClientApiError) setItemError(err.message)
      else setItemError('Reorder failed. Retry.')
    }
  }

  async function appendById(contentId: string): Promise<void> {
    setItemError(null)
    try {
      const updated = await apiFetch<CollectionDetail>(
        `/admin/collections/${collection.id}/items`,
        { method: 'POST', body: { content_id: contentId } },
      )
      // Fetch detail again to get hydrated items
      const detail = await apiFetch<CollectionDetail>(
        `/admin/collections/${collection.id}`,
      )
      setCollection({ ...updated, ...detail })
    } catch (err) {
      if (err instanceof ClientApiError) setItemError(err.message)
      else setItemError('Add failed. Retry.')
    }
  }

  async function remove(): Promise<void> {
    if (!window.confirm('Delete this collection? This cannot be undone.')) {
      return
    }
    setDeleting(true)
    try {
      await apiFetch(`/admin/collections/${collection.id}`, {
        method: 'DELETE',
      })
      router.push('/editorial')
    } catch (err) {
      setDeleting(false)
      if (err instanceof ClientApiError) setMetaError(err.message)
      else setMetaError('Delete failed. Retry.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">{collection.title}</h1>
          <span
            className="text-xs font-mono"
            style={{ color: 'var(--color-text-muted)' }}
          >
            /{collection.slug}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            void remove()
          }}
          disabled={deleting}
          className="rounded-md px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: 'var(--color-error)' }}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>

      <section
        className="flex flex-col gap-4 border rounded-lg p-5"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide">
          Metadata
        </h2>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Title</span>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
            }}
            maxLength={100}
            className="border rounded-md px-3 py-2 outline-none"
            style={{ borderColor: 'var(--color-border-strong)' }}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Subtitle</span>
          <input
            value={subtitle}
            onChange={(e) => {
              setSubtitle(e.target.value)
            }}
            maxLength={200}
            className="border rounded-md px-3 py-2 outline-none"
            style={{ borderColor: 'var(--color-border-strong)' }}
          />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Priority (0–1000)</span>
            <input
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value)
              }}
              inputMode="numeric"
              className="border rounded-md px-3 py-2 outline-none"
              style={{ borderColor: 'var(--color-border-strong)' }}
            />
          </label>
          <label className="flex items-center gap-2 text-sm mt-6">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => {
                setIsActive(e.target.checked)
              }}
            />
            <span className="font-medium">Active (visible in feed)</span>
          </label>
        </div>

        {metaError !== null && (
          <p
            role="alert"
            className="text-sm"
            style={{ color: 'var(--color-error)' }}
          >
            {metaError}
          </p>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            disabled={!dirty || savingMeta}
            onClick={() => {
              void saveMeta()
            }}
            className="rounded-md px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-coral)' }}
          >
            {savingMeta ? 'Saving…' : 'Save metadata'}
          </button>
        </div>
      </section>

      <section
        className="flex flex-col gap-4 border rounded-lg p-5"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide">
          Items ({collection.items.length}
          {collection.items.length !== collection.content_ids.length && (
            <span
              className="font-normal ml-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              · {collection.content_ids.length - collection.items.length} removed
            </span>
          )}
          )
        </h2>

        <ContentPicker onPick={appendById} />

        {itemError !== null && (
          <p
            role="alert"
            className="text-sm"
            style={{ color: 'var(--color-error)' }}
          >
            {itemError}
          </p>
        )}

        {collection.items.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No items yet. Use the search above to add published content.
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {collection.items.map((item, idx) => (
              <li
                key={item.id}
                className="flex items-center gap-3 border rounded-md p-3"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <span
                  className="text-xs font-mono w-6 text-right"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {idx + 1}.
                </span>
                {item.cover_image_url !== null && (
                  <img
                    src={item.cover_image_url}
                    alt=""
                    className="w-12 h-12 rounded object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {item.type} · {item.status}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void reorder(item.id, -1)
                  }}
                  disabled={idx === 0}
                  aria-label="Move up"
                  className="rounded-md px-2 py-1 text-sm border disabled:opacity-40"
                  style={{ borderColor: 'var(--color-border-strong)' }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void reorder(item.id, 1)
                  }}
                  disabled={idx === collection.items.length - 1}
                  aria-label="Move down"
                  className="rounded-md px-2 py-1 text-sm border disabled:opacity-40"
                  style={{ borderColor: 'var(--color-border-strong)' }}
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void removeItem(item.id)
                  }}
                  className="rounded-md px-2 py-1 text-xs font-medium border"
                  style={{
                    borderColor: 'var(--color-border-strong)',
                    color: 'var(--color-error)',
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

function ContentPicker({
  onPick,
}: {
  onPick: (id: string) => Promise<void>
}): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ContentSearchRow[]>([])
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function search(): Promise<void> {
    if (query.trim().length === 0) {
      setResults([])
      return
    }
    setSearching(true)
    setError(null)
    try {
      const data = await apiFetch<ContentSearchRow[]>(
        `/admin/content/search?q=${encodeURIComponent(query)}&limit=20`,
      )
      setResults(data)
    } catch (err) {
      if (err instanceof ClientApiError) setError(err.message)
      else setError('Search failed. Retry.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void search()
            }
          }}
          placeholder="Search published content by title…"
          className="flex-1 border rounded-md px-3 py-2 text-sm outline-none"
          style={{ borderColor: 'var(--color-border-strong)' }}
        />
        <button
          type="button"
          onClick={() => {
            void search()
          }}
          disabled={searching}
          className="rounded-md px-3 py-2 text-sm font-medium border disabled:opacity-60"
          style={{ borderColor: 'var(--color-border-strong)' }}
        >
          {searching ? 'Searching…' : 'Search'}
        </button>
      </div>
      {error !== null && (
        <p
          role="alert"
          className="text-sm"
          style={{ color: 'var(--color-error)' }}
        >
          {error}
        </p>
      )}
      {results.length > 0 && (
        <ul
          className="flex flex-col gap-1 border rounded-md p-2 max-h-64 overflow-y-auto"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {results.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-sm">
              <div className="flex-1 min-w-0">
                <p className="truncate">{r.title}</p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {r.type} · @{r.creator_username ?? '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void onPick(r.id).then(() => {
                    setQuery('')
                    setResults([])
                  })
                }}
                className="rounded-md px-2 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: 'var(--color-coral)' }}
              >
                Add
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
