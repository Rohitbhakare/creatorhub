import type { Metadata } from 'next'
import Link from 'next/link'
import { StudioShell, EmptyState } from '@/components/chrome/studio-shell'
import { fetchStudioBookings } from '@/lib/api'
import { formatPrice } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Bookings',
  robots: { index: false, follow: false },
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refund_pending: 'Refund pending',
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'var(--success)',
  in_progress: 'var(--info)',
  completed: 'var(--ink-muted)',
  cancelled: 'var(--ink-faint)',
  refund_pending: 'var(--warning)',
}

export default async function StudioBookingsPage() {
  const items = await fetchStudioBookings()

  return (
    <StudioShell kicker="Studio · Bookings" title="Bookings">
      {items.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          body="Bookings appear here once travellers reserve a date on one of your experiences. You'll need at least one published experience or event for bookings to start."
          cta={
            <Link href="/publish/experience" className="ch-btn ch-btn-primary">
              Publish an experience
            </Link>
          }
        />
      ) : (
        <div className="ch-card" style={{ padding: 0, overflow: 'hidden' }}>
          {items.map((b, i) => (
            <div
              key={b.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr) 110px 100px',
                gap: 16,
                padding: '16px 20px',
                fontSize: 13,
                color: 'var(--ink)',
                alignItems: 'center',
                borderTop: i === 0 ? 'none' : '1px solid var(--hairline)',
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 15,
                    color: 'var(--ink)',
                    marginBottom: 2,
                  }}
                >
                  {b.contentTitle}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                  {b.startsAt
                    ? new Date(b.startsAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Self-paced'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--ink)', fontWeight: 500 }}>{b.travellerName}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                  {b.travellerEmail} · {String(b.pax)} pax
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: STATUS_COLORS[b.status],
                }}
              >
                {STATUS_LABELS[b.status] ?? b.status}
              </span>
              <span
                style={{
                  textAlign: 'right',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 16,
                }}
              >
                {formatPrice(b.totalPaisa, false)}
              </span>
            </div>
          ))}
        </div>
      )}
    </StudioShell>
  )
}
