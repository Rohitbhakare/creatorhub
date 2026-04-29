'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { ScheduledDate } from '@/lib/api/types'
import { formatPrice } from '@/lib/format'

interface BookCtaProps {
  contentId: string
  contentType: 'post' | 'itinerary' | 'experience' | 'event'
  priceInPaisa: number
  isFree: boolean
  scheduledDates?: ScheduledDate[]
  isAuthenticated: boolean
}

/**
 * Sticky booking CTA — initiates the seat-hold flow by POSTing to our
 * server action which calls /api/v1/booking-intents.
 *
 * Concurrency note: the API does the actual hold inside a Postgres
 * transaction with `SELECT … FOR UPDATE` on the scheduled_date row, so
 * two concurrent requests for the same last seat will serialise and one
 * will receive a 409. We surface that to the user inline.
 */
export function BookCta({
  contentId,
  contentType,
  priceInPaisa,
  isFree,
  scheduledDates = [],
  isAuthenticated,
}: BookCtaProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedDateId, setSelectedDateId] = useState<string | undefined>(
    scheduledDates.find((d) => d.status === 'open')?.id,
  )

  function handleBook() {
    if (!isAuthenticated) {
      router.push(`/signin?next=/booking?content=${contentId}`)
      return
    }
    setError(null)

    startTransition(async () => {
      try {
        const res = await fetch('/api/booking/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            content_id: contentId,
            scheduled_date_id: selectedDateId,
          }),
        })
        if (res.status === 409) {
          setError('This date just sold out. Pick another.')
          return
        }
        if (res.status === 401) {
          router.push(`/signin?next=/booking?content=${contentId}`)
          return
        }
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { detail?: string } | null
          setError(body?.detail ?? 'Could not start booking — try again')
          return
        }
        const { intentId } = (await res.json()) as { intentId: string }
        router.push(`/booking/${intentId}`)
      } catch {
        setError('Network error — please try again')
      }
    })
  }

  const ctaLabel = isFree
    ? 'Save & open'
    : contentType === 'experience' || contentType === 'event'
      ? 'Book this experience'
      : 'Unlock this trip'

  const subLabel = isFree
    ? 'Free · no payment needed'
    : `${formatPrice(priceInPaisa, isFree)} · GST included · UPI`

  return (
    <div
      className="ch-card"
      style={{
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div>
        <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 4 }}>
          {isFree ? 'Free · self-paced' : 'From'}
        </div>
        <div className="ch-display" style={{ fontSize: 28, color: 'var(--ink)' }}>
          {formatPrice(priceInPaisa, isFree)}
        </div>
      </div>

      {scheduledDates.length > 0 && (
        <div>
          <label
            htmlFor="date-select"
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--ink-muted)',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Pick a date
          </label>
          <select
            id="date-select"
            value={selectedDateId ?? ''}
            onChange={(e) => {
              setSelectedDateId(e.target.value || undefined)
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--hairline-strong)',
              background: 'var(--surface)',
              fontSize: 14,
              color: 'var(--ink)',
            }}
          >
            <option value="">Select…</option>
            {scheduledDates.map((d) => {
              const dt = new Date(d.startsAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
              const seatsLeft = d.capacity - d.seatsBooked - d.seatsHeld
              const soldOut = d.status !== 'open' || seatsLeft <= 0
              return (
                <option key={d.id} value={d.id} disabled={soldOut}>
                  {dt} {soldOut ? '· Sold out' : seatsLeft <= 3 ? `· ${String(seatsLeft)} left` : ''}
                </option>
              )
            })}
          </select>
        </div>
      )}

      <button
        type="button"
        onClick={handleBook}
        disabled={pending || (scheduledDates.length > 0 && !selectedDateId)}
        className="ch-btn ch-btn-primary"
        style={{ padding: '14px 20px', fontSize: 14.5 }}
      >
        {pending ? 'Holding your seat…' : ctaLabel}
      </button>

      <div style={{ fontSize: 12, color: 'var(--ink-muted)', textAlign: 'center' }}>
        {subLabel}
      </div>

      {error && (
        <div
          role="alert"
          style={{
            fontSize: 12,
            color: 'var(--danger)',
            background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ fontSize: 11, color: 'var(--ink-faint)', textAlign: 'center' }}>
        Cancellable up to 24 h before · 100% refund guarantee
      </div>
    </div>
  )
}
