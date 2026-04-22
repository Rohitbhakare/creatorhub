import type { Metadata } from 'next'
import Link from 'next/link'
import { AppShell } from '../../../components/AppShell'
import { ForceReleaseAction } from '../../../components/ForceReleaseAction'
import { serverFetch, ApiRequestError } from '../../../lib/server-api'

export const metadata: Metadata = { title: 'Payout detail' }

interface PayoutDetail {
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
  razorpay_transfer_id: string | null
  razorpay_payout_id: string | null
  booking_status: string | null
  refund_in_flight: boolean
}

async function loadPayout(
  payoutId: string,
): Promise<{ payout: PayoutDetail } | { notFound: true } | { error: string }> {
  try {
    const payout = await serverFetch<PayoutDetail>(
      `/api/v1/admin/payouts/${payoutId}`,
    )
    return { payout }
  } catch (err) {
    if (err instanceof ApiRequestError) {
      if (err.status === 404) return { notFound: true }
      return { error: err.message }
    }
    return { error: 'Failed to load payout.' }
  }
}

function formatInr(paisa: number): string {
  return `₹${(paisa / 100).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })}`
}

function Row({
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
      <span className={`text-sm ${mono === true ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function StatusPill({ status }: { status: string }): React.JSX.Element {
  const tone =
    status === 'completed'
      ? 'var(--color-success)'
      : status === 'failed'
        ? 'var(--color-error)'
        : status === 'processing'
          ? 'var(--color-coral)'
          : 'var(--color-warning)'
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium text-white"
      style={{ backgroundColor: tone }}
    >
      {status}
    </span>
  )
}

export default async function PayoutDetailPage({
  params,
}: {
  params: Promise<{ payoutId: string }>
}): Promise<React.JSX.Element> {
  const { payoutId } = await params
  const result = await loadPayout(payoutId)

  if ('notFound' in result) {
    return (
      <AppShell>
        <div className="flex flex-col gap-4">
          <Link href="/payouts" className="text-sm underline w-fit">
            ← Back to payouts
          </Link>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No payout with id <code>{payoutId}</code>.
          </p>
        </div>
      </AppShell>
    )
  }

  if ('error' in result) {
    return (
      <AppShell>
        <div className="flex flex-col gap-4">
          <Link href="/payouts" className="text-sm underline w-fit">
            ← Back to payouts
          </Link>
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
        </div>
      </AppShell>
    )
  }

  const p = result.payout
  const releasable =
    (p.status === 'scheduled' || p.status === 'pending') &&
    p.razorpay_transfer_id !== null &&
    p.booking_status === 'completed' &&
    !p.refund_in_flight

  const blockers: string[] = []
  if (p.status !== 'scheduled' && p.status !== 'pending') {
    blockers.push(`Payout is already ${p.status}.`)
  }
  if (p.razorpay_transfer_id === null) {
    blockers.push('No Razorpay transfer is linked.')
  }
  if (p.booking_status !== 'completed') {
    blockers.push(
      `Booking is ${p.booking_status ?? 'unknown'} — must be completed.`,
    )
  }
  if (p.refund_in_flight) {
    blockers.push('A refund is pending or processing on this booking.')
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Link href="/payouts" className="text-sm underline w-fit">
          ← Back to payouts
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">Payout</h1>
            <div className="flex items-center gap-2">
              <StatusPill status={p.status} />
              <span
                className="text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Created {new Date(p.created_at).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          {releasable && <ForceReleaseAction payoutId={p.id} />}
        </div>

        {!releasable && blockers.length > 0 && (
          <div
            role="note"
            className="border rounded-md p-3 text-sm flex flex-col gap-1"
            style={{
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-text-muted)',
            }}
          >
            <span className="font-medium" style={{ color: 'var(--color-text)' }}>
              Release blocked
            </span>
            <ul className="list-disc list-inside">
              {blockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        )}

        <section
          className="flex flex-col gap-3 border rounded-lg p-5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Settlement
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Row label="Amount" value={formatInr(p.amount_paisa)} />
            <Row label="TDS withheld" value={formatInr(p.tds_paisa)} />
            <Row
              label="Scheduled for"
              value={new Date(p.scheduled_at).toLocaleString('en-IN')}
            />
            <Row
              label="Processed at"
              value={
                p.processed_at !== null
                  ? new Date(p.processed_at).toLocaleString('en-IN')
                  : '—'
              }
            />
            {p.failure_reason !== null && (
              <div className="md:col-span-2">
                <Row label="Failure reason" value={p.failure_reason} />
              </div>
            )}
          </div>
        </section>

        <section
          className="flex flex-col gap-3 border rounded-lg p-5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Context
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-0.5">
              <span
                className="text-xs uppercase tracking-wide"
                style={{ color: 'var(--color-text-subtle)' }}
              >
                Creator
              </span>
              <Link
                href={`/users/${p.creator_id}`}
                className="text-sm underline"
              >
                {p.creator_username ?? p.creator_id}
              </Link>
            </div>
            <Row
              label="Booking status"
              value={p.booking_status ?? 'unknown'}
            />
            <div className="md:col-span-2 flex flex-col gap-0.5">
              <span
                className="text-xs uppercase tracking-wide"
                style={{ color: 'var(--color-text-subtle)' }}
              >
                Booking
              </span>
              <span className="text-sm">
                {p.booking_title ?? '—'}{' '}
                <span
                  className="font-mono text-xs"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  ({p.booking_id})
                </span>
              </span>
            </div>
          </div>
        </section>

        <section
          className="flex flex-col gap-3 border rounded-lg p-5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Razorpay
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Row
              label="Transfer ID"
              value={p.razorpay_transfer_id ?? '—'}
              mono
            />
            <Row
              label="Payout ID"
              value={p.razorpay_payout_id ?? '—'}
              mono
            />
          </div>
        </section>

        <Row label="Payout ID" value={p.id} mono />
      </div>
    </AppShell>
  )
}
