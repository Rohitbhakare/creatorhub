'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'


import type { MoodId } from './mood-types'

interface Mood {
  id: MoodId
  label: string
  desc: string
  Icon: React.FC<{ size?: number }>
}

const MOODS: Mood[] = [
  { id: 'slow', label: 'Slow & quiet', desc: 'Single villages, no rush, monsoons', Icon: LeafIcon },
  { id: 'high', label: 'High octane', desc: 'Bike rides, treks, long hauls', Icon: BoltIcon },
  { id: 'food', label: 'Foodie', desc: 'Walks, kitchens, hidden mess halls', Icon: BowlIcon },
  { id: 'sunrise', label: 'Sunrise people', desc: '4am starts, golden hour, fewer crowds', Icon: SunIcon },
  { id: 'art', label: 'Art & craft', desc: 'Studios, weavers, ateliers, residencies', Icon: BrushIcon },
]


/**
 * v3 mood selector — 5 chips that re-rank the feed below by lifestyle
 * mood (WEB-FEED-FR-024 extension). Click writes `?mood=` to the URL;
 * the server component re-fetches with the mood param. No client-side
 * filtering — server-of-truth.
 *
 * Icons are hand-rolled inline SVGs (E5.1 Decision 2: no emoji per the
 * project rule). Active state matches the v3 wireframe: coral border +
 * primary-tint halo + coral check badge in the top-right + tiny lift.
 */
export function MoodSelector({ activeMood }: { activeMood?: MoodId | null }) {
  const router = useRouter()
  const search = useSearchParams()
  const [, startTransition] = useTransition()

  function setMood(id: MoodId) {
    const params = new URLSearchParams(search.toString())
    if (activeMood === id) {
      params.delete('mood')
    } else {
      params.set('mood', id)
    }
    const qs = params.toString()
    startTransition(() => {
      router.push(qs ? `/?${qs}` : '/')
    })
  }

  return (
    <section
      aria-label="Mood selector"
      style={{ maxWidth: 1640, margin: '40px auto 0', padding: '0 32px' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 18,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--primary)',
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Tune your feed
          </div>
          <h2
            className="ch-display"
            style={{
              margin: 0,
              fontSize: 'clamp(20px, 2.4vw, 28px)',
              color: 'var(--ink)',
              letterSpacing: '-0.015em',
            }}
          >
            What kind of weekend feels right?
          </h2>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>
          Pick a mood — we'll re-rank everything below.
        </div>
      </div>
      <div className="ch-mood-grid" role="radiogroup" aria-label="Mood">
        {MOODS.map((m) => {
          const active = activeMood === m.id
          const Icon = m.Icon
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                setMood(m.id)
              }}
              className={active ? 'ch-mood-tile ch-mood-tile--active' : 'ch-mood-tile'}
            >
              <span aria-hidden style={{ display: 'block', marginBottom: 10 }}>
                <Icon size={26} />
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  marginBottom: 4,
                }}
              >
                {m.label}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: 11,
                  color: 'var(--ink-muted)',
                  lineHeight: 1.4,
                }}
              >
                {m.desc}
              </span>
              {active && (
                <span aria-hidden className="ch-mood-tile__check">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

/** Validate a `?mood=` query param. Returns null if not a known mood. */

// ─── Icons (hand-rolled, monochrome, theme-aware via currentColor) ───
function LeafIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 20A7 7 0 0 1 4 13c0-5 5-9 14-9 0 5-1 14-7 16Z" />
      <path d="M4 13c2-2 6-4 11-4" />
    </svg>
  )
}
function BoltIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="13 2 3 14 11 14 11 22 21 10 13 10 13 2" />
    </svg>
  )
}
function BowlIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 11h18a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8Z" />
      <path d="M8 7c1-2 3-3 4-3 1 1 1 3-1 4" />
      <path d="M14 6c1-2 3-3 4-2" />
      <path d="M2 19h20" />
    </svg>
  )
}
function SunIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 18h18" />
      <path d="M5 14a7 7 0 0 1 14 0" />
      <path d="M12 2v3" />
      <path d="M5 6l1.8 1.8" />
      <path d="M19 6l-1.8 1.8" />
      <path d="M2 11h2.5" />
      <path d="M19.5 11H22" />
    </svg>
  )
}
function BrushIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 4l6 6-9 9-6-6Z" />
      <path d="M11 19l-3 3a2 2 0 0 1-3-3l3-3" />
      <path d="M9 14l5-5" />
    </svg>
  )
}
