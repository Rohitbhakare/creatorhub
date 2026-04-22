'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ClientApiError } from '../lib/api'

export interface KycQueueItem {
  user_id: string
  username: string | null
  display_name: string | null
  submitted_at: string
  pan_name: string
}

interface KycListEnvelope {
  data: KycQueueItem[]
  meta: { next_cursor: string | null }
}

export function KycQueueList({
  initialItems,
  initialCursor,
}: {
  initialItems: KycQueueItem[]
  initialCursor: string | null
}): React.JSX.Element {
  const [items, setItems] = useState<KycQueueItem[]>(initialItems)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadMore(): Promise<void> {
    if (cursor === null) return
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({ cursor, limit: '25' })
      const res = await fetch(`/api/proxy/admin/kyc?${qs.toString()}`, {
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
      const body = (await res.json()) as KycListEnvelope
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
        No pending KYC submissions.
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
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">PAN name</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr
                key={it.user_id}
                className="border-t"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/kyc/${it.user_id}`}
                    className="font-medium underline"
                  >
                    {it.display_name ?? it.username ?? it.user_id}
                  </Link>
                  {it.username !== null && (
                    <span
                      className="ml-2 text-xs"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      @{it.username}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{it.pan_name}</td>
                <td className="px-4 py-3">
                  {new Date(it.submitted_at).toLocaleString('en-IN')}
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
