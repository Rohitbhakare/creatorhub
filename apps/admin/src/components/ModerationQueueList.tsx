'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ClientApiError } from '../lib/api'

export interface Report {
  id: string
  reporter_id: string | null
  reported_type: 'content' | 'user' | 'comment' | 'review'
  reported_id: string
  reason: string
  details: string | null
  status: string
  created_at: string
}

interface ListEnvelope {
  data: Report[]
  meta: { next_cursor: string | null }
}

export function ModerationQueueList({
  initialItems,
  initialCursor,
  typeFilter,
}: {
  initialItems: Report[]
  initialCursor: string | null
  typeFilter: string | null
}): React.JSX.Element {
  const [items, setItems] = useState<Report[]>(initialItems)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadMore(): Promise<void> {
    if (cursor === null) return
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({ cursor, limit: '25' })
      if (typeFilter !== null) qs.set('reported_type', typeFilter)
      const res = await fetch(`/api/proxy/admin/reports?${qs.toString()}`, {
        credentials: 'same-origin',
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: { detail?: string }
        } | null
        throw new ClientApiError(
          res.status,
          body?.error?.detail ?? res.statusText,
        )
      }
      const body = (await res.json()) as ListEnvelope
      setItems((prev) => [...prev, ...body.data])
      setCursor(body.meta.next_cursor)
    } catch (err) {
      if (err instanceof ClientApiError) {
        setError(err.message)
      } else {
        setError('Failed to load more. Retry.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        No pending reports.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
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
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Target</th>
              <th className="px-4 py-3 font-medium">Reason</th>
              <th className="px-4 py-3 font-medium">Reported</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr
                key={r.id}
                className="border-t"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <td className="px-4 py-3">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: 'var(--color-surface-muted)',
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {r.reported_type}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/moderation/${r.id}`}
                    className="font-medium underline"
                  >
                    {r.reported_id}
                  </Link>
                </td>
                <td className="px-4 py-3">{r.reason}</td>
                <td className="px-4 py-3">
                  {new Date(r.created_at).toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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

      {cursor !== null && (
        <button
          type="button"
          onClick={() => {
            void loadMore()
          }}
          disabled={loading}
          className="self-start rounded-md px-3 py-2 text-sm font-medium border disabled:opacity-60"
          style={{ borderColor: 'var(--color-border-strong)' }}
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  )
}
