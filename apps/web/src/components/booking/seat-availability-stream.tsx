'use client'

import { useEffect, useState } from 'react'

interface Props {
  dateId: string
  /** Initial seats-left snapshot — server-rendered to avoid empty flicker. */
  initialSeatsLeft: number
  initialCapacity: number
  /**
   * API base; falls back to env. Allows tests to point at a mock server.
   */
  apiBase?: string
}

interface SeatState {
  seatsLeft: number
  capacity: number
  status: 'green' | 'yellow' | 'red' | 'sold-out'
  connection: 'connecting' | 'live' | 'reconnecting' | 'offline'
}

function classify(capacity: number, seatsLeft: number): SeatState['status'] {
  if (seatsLeft <= 0) return 'sold-out'
  const ratio = seatsLeft / Math.max(capacity, 1)
  if (ratio < 0.1) return 'red'
  if (ratio < 0.5) return 'yellow'
  return 'green'
}

const COLORS: Record<SeatState['status'], { bg: string; fg: string; label: string }> = {
  green: { bg: 'color-mix(in srgb, #1D9E75 12%, transparent)', fg: '#0F6E50', label: 'plenty of seats' },
  yellow: { bg: 'color-mix(in srgb, #C68A1A 12%, transparent)', fg: '#7A5710', label: 'filling up' },
  red: { bg: 'color-mix(in srgb, var(--primary) 14%, transparent)', fg: 'var(--primary-deep)', label: 'almost gone' },
  'sold-out': { bg: 'var(--surface-alt)', fg: 'var(--ink-muted)', label: 'sold out' },
}

/**
 * Live seat-availability pill backed by the SSE endpoint
 * `GET /api/v1/bookings/seats/:dateId/stream` (E5.4 T4).
 *
 * Renders a status pill with text label; the status colour is paired with
 * the textual count so the information isn't carried by colour alone (a11y).
 *
 * Reconnect strategy: exponential backoff (1s → 2s → 4s → … capped 30s)
 * after `EventSource.onerror`. Browser EventSource has its own reconnect
 * but we override to give immediate visual feedback ("reconnecting…").
 */
export function SeatAvailabilityStream({ dateId, initialSeatsLeft, initialCapacity, apiBase }: Props) {
  const [state, setState] = useState<SeatState>({
    seatsLeft: initialSeatsLeft,
    capacity: initialCapacity,
    status: classify(initialCapacity, initialSeatsLeft),
    connection: 'connecting',
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (typeof EventSource === 'undefined') {
      setState((s) => ({ ...s, connection: 'offline' }))
      return
    }
    let attempt = 0
    let es: EventSource | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    const connect = (): void => {
      const base = apiBase ?? process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001'
      es = new EventSource(`${base}/api/v1/bookings/seats/${encodeURIComponent(dateId)}/stream`)
      es.addEventListener('seats', (rawEvent) => {
        try {
          const e = rawEvent as MessageEvent<string>
          const data = JSON.parse(e.data) as {
            capacity: number
            seatsLeft: number
            status: SeatState['status']
          }
          attempt = 0
          setState({
            seatsLeft: data.seatsLeft,
            capacity: data.capacity,
            status: data.status,
            connection: 'live',
          })
        } catch {
          // bad payload — keep last known state
        }
      })
      es.onerror = () => {
        es?.close()
        es = null
        attempt += 1
        const delay = Math.min(30_000, 1000 * 2 ** Math.min(attempt - 1, 5))
        setState((s) => ({ ...s, connection: 'reconnecting' }))
        retryTimer = setTimeout(() => {
          connect()
        }, delay)
      }
    }

    connect()
    return () => {
      if (retryTimer) clearTimeout(retryTimer)
      es?.close()
    }
  }, [dateId, apiBase])

  const c = COLORS[state.status]
  const text =
    state.status === 'sold-out'
      ? 'Sold out'
      : `${String(state.seatsLeft)} of ${String(state.capacity)} seats left`

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 999,
        background: c.bg,
        color: c.fg,
        fontSize: 12,
        fontWeight: 600,
        fontFamily: 'inherit',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 7,
          height: 7,
          borderRadius: 999,
          background: c.fg,
          opacity: state.connection === 'live' ? 1 : 0.45,
        }}
      />
      <span>{text}</span>
      {state.connection === 'reconnecting' && (
        <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>· reconnecting…</span>
      )}
    </div>
  )
}
