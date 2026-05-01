'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import type { ItinerarySpot } from '@/lib/api/types'

interface Props {
  spot: ItinerarySpot
  /**
   * Whether this spot's parent content is already saved by the user.
   * (Spot-level saves aren't supported by the API today — see E5.3/ENH-001.)
   */
  isParentSaved: boolean
  /** Server Action — toggles the parent content's save state. */
  onToggleSave: () => void | Promise<void>
}

/**
 * Magazine "pull-out" spot card (E5.3 T6).
 *
 * Composition matches v3 wireframe `pack-w-detail.jsx` lines 301–313:
 *   photo on left (220h) + meta on right (kicker · title · description · 2 chip tags · heart).
 * Renders as an `<aside>` so screen readers announce it as a tangentially
 * related card, not part of the main reading flow.
 *
 * The heart's 600ms spring (T7) is gated by `prefers-reduced-motion`.
 */
export function InlineSpotCard({ spot, isParentSaved, onToggleSave }: Props) {
  const reduced = useReducedMotion()
  const [savingPulse, setSavingPulse] = useState(false)

  const handleSave = (): void => {
    if (!reduced) {
      setSavingPulse(true)
      setTimeout(() => {
        setSavingPulse(false)
      }, 600)
    }
    void onToggleSave()
  }

  return (
    <aside
      className="ch-inline-spot"
      role="note"
      style={{
        margin: '36px 0',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 0,
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid var(--hairline)',
      }}
    >
      <div
        style={{
          position: 'relative',
          minHeight: 220,
          background: 'var(--surface-alt)',
        }}
        aria-hidden
      >
        {spot.thumbnailUrl ? (
          <Image
            src={spot.thumbnailUrl}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            style={{ objectFit: 'cover' }}
          />
        ) : null}
      </div>

      <div style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono, var(--font-sans))',
            fontSize: 10,
            color: 'var(--primary)',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          Stop · Day {String(spot.dayNumber)}
        </div>

        <h3
          className="ch-display"
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 600,
            color: 'var(--ink)',
            letterSpacing: '-0.015em',
            lineHeight: 1.15,
          }}
        >
          {spot.name}
        </h3>

        {spot.description ? (
          <p
            style={{
              margin: '8px 0 0',
              fontSize: 13.5,
              color: 'var(--ink-soft)',
              lineHeight: 1.55,
            }}
          >
            {spot.description}
          </p>
        ) : null}

        <div style={{ marginTop: 'auto', paddingTop: 14, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {spot.distanceFromPreviousKm !== null && (
            <Tag>📍 {spot.distanceFromPreviousKm.toFixed(0)} km</Tag>
          )}
          {spot.durationFromPreviousMin !== null && (
            <Tag>⏱ {Math.round(spot.durationFromPreviousMin / 60)} hr</Tag>
          )}
          <button
            type="button"
            onClick={handleSave}
            aria-label={isParentSaved ? 'Remove from saved' : 'Save'}
            aria-pressed={isParentSaved}
            style={{
              marginLeft: 'auto',
              width: 32,
              height: 32,
              borderRadius: 999,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <motion.svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={isParentSaved ? 'var(--primary)' : 'none'}
              stroke={isParentSaved ? 'var(--primary)' : 'currentColor'}
              strokeWidth="2"
              animate={savingPulse ? { scale: [1, 1.4, 1] } : { scale: 1 }}
              transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              aria-hidden
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </motion.svg>
          </button>
        </div>
      </div>
    </aside>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        padding: '4px 9px',
        borderRadius: 999,
        background: 'var(--surface-alt)',
        fontFamily: 'var(--font-mono, var(--font-sans))',
        fontSize: 10,
        color: 'var(--ink-soft)',
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  )
}
