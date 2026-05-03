'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { ScheduledDate } from '@/lib/api/types'
import { formatPrice } from '@/lib/format'
import { useSignInModal } from '@/components/auth/sign-in-modal-provider'
import { DualMonthCalendar } from '@/components/booking/dual-month-calendar'

interface BookCtaProps {
  contentId: string
  contentTitle?: string
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
  contentTitle,
  contentType,
  priceInPaisa,
  isFree,
  scheduledDates = [],
  isAuthenticated,
}: BookCtaProps) {
  const router = useRouter()
  const { openSignInModal } = useSignInModal()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedDateId, setSelectedDateId] = useState<string | undefined>(
    scheduledDates.find((d) => d.status === 'open')?.id,
  )

  function startHold() {
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
          // 401 here is almost always a transient access-token expiry on a
          // user whose web session is still valid. Round-3 attempted to
          // recover by calling /api/auth/signout + redirecting to /signin —
          // that nuked the entire web session for any logged-in user who
          // hit a stale token (round-4 SEC-01: critical UX + security
          // regression). Show an inline retry hint instead and let the
          // user refresh — never silently destroy their session from a
          // single failed booking call.
          setError('Couldn’t verify your session for booking. Refresh the page and try again.')
          return
        }
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { detail?: string } | null
          setError(body?.detail ?? 'Could not start booking — try again')
          return
        }
        const json = (await res.json()) as { intentId?: string }
        if (!json.intentId) {
          setError('Booking start returned no intent — try again')
          return
        }
        router.push(`/booking/${json.intentId}`)
      } catch {
        setError('Network error — please try again')
      }
    })
  }

  function handleBook() {
    if (!isAuthenticated) {
      const truncated = contentTitle && contentTitle.length > 36
        ? `${contentTitle.slice(0, 35)}…`
        : contentTitle
      openSignInModal({
        contextLabel: truncated
          ? `Book “${truncated}” — ${formatPrice(priceInPaisa, isFree)}`
          : `Book — ${formatPrice(priceInPaisa, isFree)}`,
        reason: 'Sign in to hold your seat. Cancellable up to 24 h before.',
        onSuccess: () => {
          startHold()
        },
      })
      return
    }
    startHold()
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
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--ink-muted)',
              marginBottom: 8,
            }}
          >
            Pick a date
          </div>
          <DualMonthCalendar
            singleMonth
            scheduledDates={scheduledDates.map((d) => ({
              id: d.id,
              startsAt: d.startsAt,
              capacity: d.capacity,
              seatsBooked:
                d.status === 'open' && d.capacity - d.seatsBooked - d.seatsHeld > 0
                  ? d.seatsBooked + d.seatsHeld
                  : d.capacity,
            }))}
            onPick={(dateId) => {
              setSelectedDateId(dateId)
            }}
          />
          {selectedDateId && (
            <div
              style={{
                marginTop: 10,
                fontSize: 12.5,
                color: 'var(--ink-soft)',
                textAlign: 'center',
              }}
            >
              <strong style={{ color: 'var(--ink)' }}>
                {new Date(
                  scheduledDates.find((d) => d.id === selectedDateId)?.startsAt ?? '',
                ).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </strong>{' '}
              selected
            </div>
          )}
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

      <div style={{ fontSize: 11, color: 'var(--ink-muted)', textAlign: 'center' }}>
        Cancellable up to 24 h before · 100% refund guarantee
      </div>
    </div>
  )
}
