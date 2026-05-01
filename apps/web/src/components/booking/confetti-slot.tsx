'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

interface Props {
  /** Used as the sessionStorage one-shot key so a refresh after the burst doesn't re-fire. */
  bookingId: string
}

const SHOWN_KEY_PREFIX = 'ch_booking_celebrated:'

/**
 * One-shot confetti burst on `/bookings/[id]?just=1` (E5.4 T7).
 *
 * Behaviour:
 * - Fires `canvas-confetti` once on mount with a 200-particle spring profile.
 * - Gated by `useReducedMotion()` — no burst when the user prefers reduced motion.
 * - sessionStorage one-shot — once a booking has been celebrated this session,
 *   a refresh of `?just=1` doesn't re-fire the burst.
 * - The library is dynamically imported so it doesn't bloat the bundle for
 *   every other route on `/bookings/*`.
 */
export function ConfettiSlot({ bookingId }: Props) {
  const reduced = useReducedMotion()
  const cancelled = useRef(false)

  useEffect(() => {
    if (reduced) return
    if (typeof window === 'undefined') return
    const key = SHOWN_KEY_PREFIX + bookingId
    try {
      if (sessionStorage.getItem(key) === '1') return
      sessionStorage.setItem(key, '1')
    } catch {
      // sessionStorage disabled — fire once per page load anyway, but no persistence
    }

    cancelled.current = false
    void (async (): Promise<void> => {
      const mod = await import('canvas-confetti')
      if (cancelled.current) return
      const confetti = mod.default
      const burst = (originY: number, particleCount: number): void => {
        void confetti({
          particleCount,
          startVelocity: 38,
          spread: 70,
          origin: { x: 0.5, y: originY },
          ticks: 220,
          colors: ['#E15A41', '#1D9E75', '#0E2643', '#F4D78F', '#FFFFFF'],
        })
      }
      // Two-stage burst — primary at viewport top, follow-up wider and slightly lower.
      burst(0.2, 120)
      setTimeout(() => {
        burst(0.35, 80)
      }, 220)
    })()

    return () => {
      cancelled.current = true
    }
  }, [bookingId, reduced])

  // Render nothing — confetti draws onto a canvas that the library injects
  // directly into <body>.
  return null
}
