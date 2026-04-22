'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ClientApiError } from '../lib/api'

export interface AdminPayoutRow {
  id: string
  creator_id: string
  creator_username: string | null
  booking_id: string
  booking_title: string | null
  amount_paisa: number
  tds_paisa: number
  status:
    | 'pending'
    | 'scheduled'
    | 'processing'
    | 'completed'
    | 'failed'
  scheduled_at: string
  processed_at: string | null
  failure_reason: string | null
  created_at: string
}

interface ListEnvelope {
  data: AdminPayoutRow[]
  meta: { next_cursor: string | null }
}

function formatInr(paisa: number): string {
  return `₹${(paisa / 100).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`
}

export function AdminPayoutsList({
  initialItems,
  initialCursor,
  status,
}: {
  initialItems: AdminPayoutRow[]
  initialCursor: string | null
  status: string
}): React.JSX.Element {
  const [items, setItems] = useState<AdminPayoutRow[]>(initialItems)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadMore(): Promise<void> {
    if (cursor === null) return
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({ cursor, status, limit: '25' })
      const res = await fetch(`/api/proxy/admin/payouts?${qs.toString()}`, {
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
        No payouts in this bucket.
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
              <th className="px-4 py-3 font-medium">Creator</th>
              <th className="px-4 py-3 font-medium">Booking</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Scheduled</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr
                key={p.id}
                className="border-t"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/payouts/${p.id}`}
                    className="font-medium underline"
                  >
                    {p.creator_username ?? p.creator_id}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {p.booking_title ?? (
                    <span
                      className="font-mono text-xs"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {p.booking_id.slice(0, 8)}…
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{formatInr(p.amount_paisa)}</td>
                <td className="px-4 py-3">
                  {new Date(p.scheduled_at).toLocaleString('en-IN')}
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
