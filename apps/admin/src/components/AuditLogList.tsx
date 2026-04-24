'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ClientApiError } from '../lib/api'
import { relativeTime } from '../lib/time'

export interface AuditEntry {
  id: string
  admin_id: string
  admin_email: string | null
  action: string
  target_type: string
  target_id: string
  details: Record<string, unknown>
  created_at: string
}

interface ListEnvelopeRaw {
  data: AuditEntry[]
  meta: { next_cursor: string | null; has_more: boolean; per_page: number }
}

function AuditDetails({
  details,
}: {
  details: Record<string, unknown>
}): React.JSX.Element {
  const [open, setOpen] = useState(false)
  return (
    <details
      onToggle={(e) => {
        setOpen((e.currentTarget as HTMLDetailsElement).open)
      }}
    >
      <summary
        className="text-xs cursor-pointer select-none"
        style={{ color: 'var(--color-text-muted)' }}
      >
        details
      </summary>
      {open && (
        <pre
          className="text-xs mt-1 p-2 rounded overflow-x-auto"
          style={{
            backgroundColor: 'var(--color-surface-muted)',
            color: 'var(--color-text)',
          }}
        >
          {JSON.stringify(details, null, 2)}
        </pre>
      )}
    </details>
  )
}

function targetHref(entry: AuditEntry): string | null {
  switch (entry.target_type) {
    case 'user':
      return `/users/${entry.target_id}`
    case 'report':
      return `/moderation/${entry.target_id}`
    case 'booking':
      return `/refunds?bookingId=${entry.target_id}`
    case 'payout':
      return `/payouts/${entry.target_id}`
    case 'collection':
      return `/editorial/${entry.target_id}`
    default:
      return null
  }
}

export function AuditLogList({
  initialItems,
  initialCursor,
}: {
  initialItems: AuditEntry[]
  initialCursor: string | null
}): React.JSX.Element {
  const [items, setItems] = useState<AuditEntry[]>(initialItems)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadMore(): Promise<void> {
    if (cursor === null) return
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams({ cursor, limit: '25' })
      const res = await fetch(`/api/proxy/admin/audit-log?${qs.toString()}`, {
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
      const body = (await res.json()) as ListEnvelopeRaw
      setItems((prev) => [...prev, ...body.data])
      setCursor(body.meta.next_cursor)
    } catch (err) {
      if (err instanceof ClientApiError) setError(err.message)
      else setError('Failed to load more.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        No audit entries yet.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <ol
        className="border rounded-lg overflow-hidden"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {items.map((entry) => {
          const href = targetHref(entry)
          const hasDetails = Object.keys(entry.details).length > 0
          return (
            <li
              key={entry.id}
              className="px-4 py-3 border-t first:border-t-0 flex flex-col gap-1"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <span
                  className="font-mono text-xs px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: 'var(--color-surface-muted)',
                    color: 'var(--color-text)',
                  }}
                >
                  {entry.action}
                </span>
                <span>
                  by{' '}
                  <span className="font-medium">
                    {entry.admin_email ?? entry.admin_id}
                  </span>
                </span>
                <span style={{ color: 'var(--color-text-muted)' }}>on</span>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {entry.target_type}:
                </span>
                {href !== null ? (
                  <Link
                    href={href}
                    className="font-mono text-xs underline truncate max-w-xs"
                  >
                    {entry.target_id}
                  </Link>
                ) : (
                  <span className="font-mono text-xs">{entry.target_id}</span>
                )}
                <span
                  className="ml-auto text-xs"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {relativeTime(entry.created_at)}
                </span>
              </div>
              {hasDetails && <AuditDetails details={entry.details} />}
            </li>
          )
        })}
      </ol>

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
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => {
              void loadMore()
            }}
            disabled={loading}
            className="rounded-md px-3 py-2 text-sm font-medium border disabled:opacity-60"
            style={{ borderColor: 'var(--color-border-strong)' }}
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}
