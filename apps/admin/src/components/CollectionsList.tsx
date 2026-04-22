'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { apiFetch, ClientApiError } from '../lib/api'

export interface CollectionSummary {
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
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function CollectionsList({
  initialItems,
}: {
  initialItems: CollectionSummary[]
}): React.JSX.Element {
  const router = useRouter()
  const [items] = useState<CollectionSummary[]>(initialItems)
  const [creating, setCreating] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setCreating(true)
          }}
          className="rounded-md px-3 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: 'var(--color-coral)' }}
        >
          New collection
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          No collections yet.
        </p>
      ) : (
        <div
          className="border rounded-lg overflow-hidden"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <table className="w-full text-sm">
            <thead
              className="text-left text-xs uppercase tracking-wide"
              style={{
                color: 'var(--color-text-subtle)',
                backgroundColor: 'var(--color-surface-muted)',
              }}
            >
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr
                  key={c.id}
                  className="border-t"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/editorial/${c.id}`}
                      className="font-medium underline"
                    >
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
                  <td className="px-4 py-3">{c.content_ids.length}</td>
                  <td className="px-4 py-3">{c.priority}</td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: c.is_active
                          ? 'var(--color-success)'
                          : 'var(--color-text-muted)',
                        color: '#fff',
                      }}
                    >
                      {c.is_active ? 'active' : 'inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && (
        <CreateCollectionModal
          onCancel={() => {
            setCreating(false)
          }}
          onCreated={(id) => {
            setCreating(false)
            router.push(`/editorial/${id}`)
          }}
        />
      )}
    </div>
  )
}

function CreateCollectionModal({
  onCancel,
  onCreated,
}: {
  onCancel: () => void
  onCreated: (id: string) => void
}): React.JSX.Element {
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [priority, setPriority] = useState('0')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const slugOk = SLUG_RE.test(slug)
  const titleOk = title.trim().length >= 3
  const priorityOk = /^\d+$/.test(priority) && Number(priority) <= 1000
  const disabled = submitting || !slugOk || !titleOk || !priorityOk

  async function submit(): Promise<void> {
    setSubmitting(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        slug,
        title,
        priority: Number(priority),
      }
      if (subtitle.trim().length > 0) body['subtitle'] = subtitle.trim()
      const data = await apiFetch<{ id: string }>('/admin/collections', {
        method: 'POST',
        body,
      })
      onCreated(data.id)
    } catch (err) {
      if (err instanceof ClientApiError) setError(err.message)
      else setError('Create failed. Retry.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
    >
      <div
        className="w-full max-w-md rounded-lg p-6 flex flex-col gap-4"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <h2 className="text-lg font-semibold">New collection</h2>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Title</span>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
            }}
            className="border rounded-md px-3 py-2 outline-none"
            style={{ borderColor: 'var(--color-border-strong)' }}
            maxLength={100}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">
            Slug{' '}
            <span
              className="font-normal"
              style={{ color: 'var(--color-text-muted)' }}
            >
              (lowercase, hyphens)
            </span>
          </span>
          <input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value.toLowerCase())
            }}
            className="border rounded-md px-3 py-2 font-mono text-xs outline-none"
            style={{ borderColor: 'var(--color-border-strong)' }}
            maxLength={60}
            placeholder="monsoon-goa-2026"
          />
          {slug.length > 0 && !slugOk && (
            <span
              className="text-xs"
              style={{ color: 'var(--color-error)' }}
            >
              Lowercase letters, numbers, and hyphens only (3–60 chars).
            </span>
          )}
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">
            Subtitle{' '}
            <span
              className="font-normal"
              style={{ color: 'var(--color-text-muted)' }}
            >
              (optional)
            </span>
          </span>
          <input
            value={subtitle}
            onChange={(e) => {
              setSubtitle(e.target.value)
            }}
            className="border rounded-md px-3 py-2 outline-none"
            style={{ borderColor: 'var(--color-border-strong)' }}
            maxLength={200}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">
            Priority{' '}
            <span
              className="font-normal"
              style={{ color: 'var(--color-text-muted)' }}
            >
              (0–1000, higher = earlier)
            </span>
          </span>
          <input
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value)
            }}
            className="border rounded-md px-3 py-2 outline-none"
            style={{ borderColor: 'var(--color-border-strong)' }}
            inputMode="numeric"
          />
        </label>

        {error !== null && (
          <p
            role="alert"
            className="text-sm"
            style={{ color: 'var(--color-error)' }}
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-md px-3 py-2 text-sm font-medium border disabled:opacity-60"
            style={{ borderColor: 'var(--color-border-strong)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              void submit()
            }}
            disabled={disabled}
            className="rounded-md px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            style={{ backgroundColor: 'var(--color-coral)' }}
          >
            {submitting ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
