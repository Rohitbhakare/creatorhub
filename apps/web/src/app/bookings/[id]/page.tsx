import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { ConfettiSlot } from '@/components/booking/confetti-slot'
import { AddToCalendar } from '@/components/booking/add-to-calendar'
import { fetchBookingById, formatPrice } from '@/lib/api'
import { getSession } from '@/lib/session'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ just?: string }>
}

export const metadata: Metadata = {
  title: 'Booking confirmed',
  robots: { index: false, follow: false },
}

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refund_pending: 'Refund pending',
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BookingDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = await searchParams
  const session = await getSession()
  if (!session) redirect(`/signin?next=/bookings/${id}`)

  const booking = await fetchBookingById(id)
  if (!booking) notFound()

  const justBooked = sp.just === '1'

  return (
    <>
      <WebHeader session={session} active="bookings" />
      <main
        id="main-content"
        style={{ maxWidth: 760, margin: '0 auto', padding: '40px 32px 80px' }}
      >
        {/* Confetti slot — fires on mount when ?just=1, gated by reduced-motion + sessionStorage one-shot. */}
        {justBooked && <ConfettiSlot bookingId={booking.id} />}

        <p
          style={{
            fontFamily: 'var(--font-mono, var(--font-sans))',
            fontSize: 11,
            color: 'var(--primary)',
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          {justBooked ? 'You’re booked.' : STATUS_LABELS[booking.status] ?? 'Booking'}
        </p>
        <h1
          className="ch-display"
          style={{
            margin: 0,
            fontSize: 'clamp(28px, 4vw, 44px)',
            lineHeight: 1.05,
            color: 'var(--ink)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            marginBottom: 6,
          }}
        >
          {booking.contentTitle}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginBottom: 28 }}>
          by {booking.creator.displayName}
          {booking.startsAt ? ` · ${formatDate(booking.startsAt)}` : ''}
          {booking.travellers > 1 ? ` · ${String(booking.travellers)} travellers` : ''}
        </p>

        {/* Booking summary card */}
        <div
          className="ch-card"
          style={{ padding: 24, marginBottom: 24 }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-mono, var(--font-sans))',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-muted)',
              margin: 0,
              marginBottom: 12,
            }}
          >
            Booking summary
          </h2>
          <Row label="Booking ID" value={booking.id.slice(0, 8) + '…'} mono />
          <Row label="Status" value={STATUS_LABELS[booking.status] ?? booking.status} />
          {booking.startsAt && <Row label="Date" value={formatDate(booking.startsAt)} />}
          <Row label="Travellers" value={String(booking.travellers)} />
          <hr className="ch-divider" style={{ margin: '14px 0' }} />
          <Row label="Total paid" value={formatPrice(booking.totalPaisa, false)} emphasized />
        </div>

        {/* Add to calendar — Google / Apple / Outlook + .ics download */}
        {booking.startsAt && (
          <div className="ch-card" style={{ padding: 24, marginBottom: 24 }}>
            <h2
              style={{
                fontFamily: 'var(--font-mono, var(--font-sans))',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--ink-muted)',
                margin: 0,
                marginBottom: 12,
              }}
            >
              Add to calendar
            </h2>
            <AddToCalendar
              booking={{
                id: booking.id,
                title: booking.contentTitle,
                startsAt: booking.startsAt,
                creatorName: booking.creator.displayName,
              }}
            />
          </div>
        )}

        {/* Footer actions */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 32 }}>
          <Link href="/bookings" className="ch-btn ch-btn-ink" style={{ padding: '10px 20px' }}>
            All bookings
          </Link>
          <Link
            href={`/u/${booking.creator.username}`}
            className="ch-btn ch-btn-ghost"
            style={{ padding: '10px 20px' }}
          >
            More from {booking.creator.displayName}
          </Link>
        </div>

        <p style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 32 }}>
          Cancellation &amp; refund policy: cancel up to 24 h before for a full refund. After that
          a 50% refund applies. See <Link href="/terms">terms</Link> for details.
        </p>
      </main>
      <WebFooter />
    </>
  )
}

function Row({
  label,
  value,
  emphasized,
  mono,
}: {
  label: string
  value: string
  emphasized?: boolean
  mono?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '6px 0',
      }}
    >
      <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{label}</span>
      <span
        style={{
          fontSize: emphasized ? 18 : 13.5,
          fontWeight: emphasized ? 700 : 500,
          color: 'var(--ink)',
          fontFamily: mono ? 'var(--font-mono, var(--font-sans))' : 'inherit',
        }}
      >
        {value}
      </span>
    </div>
  )
}
