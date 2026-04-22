import type { Metadata } from 'next'
import { AppShell } from '../../components/AppShell'
import { RefundLookupForm } from '../../components/RefundLookupForm'
import { RefundAction } from '../../components/RefundAction'
import { serverFetch, ApiRequestError } from '../../lib/server-api'

export const metadata: Metadata = { title: 'Manual refund' }

interface BookingDetail {
  id: string
  status: string
  total_paisa: number
  creator_payout_paisa: number | null
  buyer_id: string
  buyer_username: string | null
  creator_id: string
  creator_username: string | null
  content_id: string | null
  content_title: string | null
  razorpay_payment_id: string | null
  razorpay_refund_id: string | null
  refund_in_flight: boolean
  created_at: string
  updated_at: string
}

async function loadBooking(
  bookingId: string,
): Promise<
  { booking: BookingDetail } | { notFound: true } | { error: string }
> {
  try {
    const booking = await serverFetch<BookingDetail>(
      `/api/v1/admin/bookings/${bookingId}`,
    )
    return { booking }
  } catch (err) {
    if (err instanceof ApiRequestError) {
      if (err.status === 404) return { notFound: true }
      return { error: err.message }
    }
    return { error: 'Failed to load booking.' }
  }
}

function formatInr(paisa: number): string {
  return `₹${(paisa / 100).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function RefundsPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>
}): Promise<React.JSX.Element> {
  const { bookingId: raw } = await searchParams
  const bookingId = raw?.trim() ?? ''
  const isValidId = UUID_RE.test(bookingId)
  const result = isValidId ? await loadBooking(bookingId) : null

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Manual refund</h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Look up a booking by ID, then process a refund against the
            linked Razorpay payment. Manual refunds are dispute-driven —
            there is no queue.
          </p>
        </div>

        <RefundLookupForm defaultValue={bookingId} />

        {bookingId.length > 0 && !isValidId && (
          <div
            role="alert"
            className="border rounded-md p-3 text-sm"
            style={{
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-error)',
            }}
          >
            Booking IDs are UUIDs — check the value and try again.
          </div>
        )}

        {result !== null && 'notFound' in result && (
          <div
            role="alert"
            className="border rounded-md p-3 text-sm"
            style={{
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-text-muted)',
            }}
          >
            No booking with id <code>{bookingId}</code>.
          </div>
        )}

        {result !== null && 'error' in result && (
          <div
            role="alert"
            className="border rounded-md p-3 text-sm"
            style={{
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-error)',
            }}
          >
            {result.error}
          </div>
        )}

        {result !== null && 'booking' in result && (
          <BookingPanel booking={result.booking} />
        )}
      </div>
    </AppShell>
  )
}

function BookingPanel({
  booking: b,
}: {
  booking: BookingDetail
}): React.JSX.Element {
  const refundable =
    b.status !== 'refunded' &&
    !b.refund_in_flight &&
    b.razorpay_payment_id !== null

  const blockers: string[] = []
  if (b.status === 'refunded') blockers.push('Booking is already refunded.')
  if (b.refund_in_flight) blockers.push('A refund is pending or processing.')
  if (b.razorpay_payment_id === null)
    blockers.push('Booking has no Razorpay payment id.')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">
            {b.content_title ?? 'Booking'}
          </h2>
          <span
            className="text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Status: {b.status}
          </span>
        </div>
        {refundable && (
          <RefundAction bookingId={b.id} amountLabel={formatInr(b.total_paisa)} />
        )}
      </div>

      {!refundable && blockers.length > 0 && (
        <div
          role="note"
          className="border rounded-md p-3 text-sm flex flex-col gap-1"
          style={{
            borderColor: 'var(--color-border-strong)',
            color: 'var(--color-text-muted)',
          }}
        >
          <span className="font-medium" style={{ color: 'var(--color-text)' }}>
            Refund blocked
          </span>
          <ul className="list-disc list-inside">
            {blockers.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      )}

      <section
        className="flex flex-col gap-3 border rounded-lg p-5"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide">
          Amounts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Field label="Total (buyer paid)" value={formatInr(b.total_paisa)} />
          <Field
            label="Creator payout"
            value={
              b.creator_payout_paisa !== null
                ? formatInr(b.creator_payout_paisa)
                : '—'
            }
          />
        </div>
      </section>

      <section
        className="flex flex-col gap-3 border rounded-lg p-5"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide">
          Parties
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <FieldLink
            label="Buyer"
            href={`/users/${b.buyer_id}`}
            value={b.buyer_username ?? b.buyer_id}
          />
          <FieldLink
            label="Creator"
            href={`/users/${b.creator_id}`}
            value={b.creator_username ?? b.creator_id}
          />
        </div>
      </section>

      <section
        className="flex flex-col gap-3 border rounded-lg p-5"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide">
          Razorpay
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Field
            label="Payment ID"
            value={b.razorpay_payment_id ?? '—'}
            mono
          />
          <Field
            label="Refund ID"
            value={b.razorpay_refund_id ?? '—'}
            mono
          />
        </div>
      </section>
    </div>
  )
}

function Field({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-xs uppercase tracking-wide"
        style={{ color: 'var(--color-text-subtle)' }}
      >
        {label}
      </span>
      <span className={mono === true ? 'font-mono' : ''}>{value}</span>
    </div>
  )
}

function FieldLink({
  label,
  href,
  value,
}: {
  label: string
  href: string
  value: string
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-xs uppercase tracking-wide"
        style={{ color: 'var(--color-text-subtle)' }}
      >
        {label}
      </span>
      <a href={href} className="underline">
        {value}
      </a>
    </div>
  )
}
