import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { getSession } from '@/lib/session'
import { fetchMyBookings, formatPrice } from '@/lib/api'

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

export default async function BookingsPage() {
  const session = await getSession()
  if (!session) redirect('/signin?next=/bookings')

  const bookings = await fetchMyBookings()

  return (
    <>
      <WebHeader session={session} active="bookings" />
      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 32px 80px' }}>
        <h1
          className="ch-display"
          style={{ fontSize: 'clamp(32px, 4vw, 44px)', color: 'var(--ink)', marginBottom: 24 }}
        >
          Your bookings
        </h1>
        {bookings.length === 0 ? (
          <div
            className="ch-card"
            style={{ padding: 64, textAlign: 'center', color: 'var(--ink-muted)' }}
          >
            <p style={{ fontSize: 16, marginBottom: 20 }}>No bookings yet.</p>
            <Link href="/discover" className="ch-btn ch-btn-primary">
              Find your next trip
            </Link>
          </div>
        ) : (
          <div
            className="ch-card"
            style={{ padding: 0, overflow: 'hidden' }}
          >
            {bookings.map((b, i) => (
              <Link
                key={b.id}
                href={`/bookings/${b.id}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  gap: 16,
                  alignItems: 'center',
                  padding: '20px 24px',
                  borderTop: i === 0 ? 'none' : '1px solid var(--hairline)',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div>
                  <div
                    className="ch-display"
                    style={{ fontSize: 18, color: 'var(--ink)', marginBottom: 4 }}
                  >
                    {b.contentTitle}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
                    by {b.creator.displayName}
                    {b.startsAt && (
                      <>
                        {' · '}
                        {new Date(b.startsAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </>
                    )}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: STATUS_COLORS[b.status],
                  }}
                >
                  {STATUS_LABELS[b.status] ?? b.status}
                </span>
                <span
                  style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--ink)' }}
                >
                  {formatPrice(b.totalPaisa, false)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
      <WebFooter />
    </>
  )
}
