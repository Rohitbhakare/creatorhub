'use client'

import Link from 'next/link'
import { useReducedMotion } from 'framer-motion'
import { useState } from 'react'
import { InitialAvatar } from '@/components/ui/initial-avatar'
import { TILT_MAX_DEG } from '@/lib/motion'
import type { ContentCard } from '@/lib/api/types'

interface SpotlightCreator {
  id: string
  displayName: string
  username: string
  avatarUrl: string | null
  city: string | null
  followerCount: number
  contentCount: number
  isVerified?: boolean
}

interface CreatorSpotlightProps {
  creator: SpotlightCreator
  featuredContent: ContentCard
}

/**
 * v3 "from creators you follow" spotlight — 1fr/1fr split with cursor-
 * tracking parallax tilt on the whole card. WEB-MOTION-FR-103 caps tilt
 * at ±2° (lib/motion.ts TILT_MAX_DEG); the v3 wireframe used ±8°/±6° but
 * the locked motion spec wins. Reduced-motion freezes the tilt entirely.
 *
 * Touch devices skip the tilt — the `(hover: hover) and (pointer: fine)`
 * media query in the CSS class disables the transform on phones/tablets.
 */
export function CreatorSpotlight({ creator, featuredContent }: CreatorSpotlightProps) {
  const reduced = useReducedMotion()
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reduced) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * (TILT_MAX_DEG * 2)
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -(TILT_MAX_DEG * 2)
    setTilt({ x, y })
  }
  function onLeave() {
    setTilt({ x: 0, y: 0 })
  }

  const photoClass = pickPhoto(featuredContent.title)

  return (
    <section
      aria-label="Creator spotlight"
      style={{ maxWidth: 1240, margin: '40px auto 0', padding: '0 32px' }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          marginBottom: 18,
          gap: 16,
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
            Creator spotlight
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
            From the people you{' '}
            <em style={{ fontStyle: 'italic', color: 'var(--primary)' }}>follow</em>
          </h2>
        </div>
      </header>

      <div
        className="ch-spotlight"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{
          transform: reduced
            ? 'none'
            : `perspective(1200px) rotateY(${String(tilt.x)}deg) rotateX(${String(tilt.y)}deg)`,
        }}
      >
        <div className="ch-spotlight__copy">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
              <InitialAvatar
                name={creator.displayName}
                url={creator.avatarUrl}
                size={48}
              />
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {creator.displayName}
                  {creator.isVerified && (
                    <span
                      aria-label="verified"
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 999,
                        background: 'var(--primary)',
                        color: 'white',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 8,
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                  {creator.city ? `${creator.city} · ` : ''}
                  {fmt(creator.followerCount)} followers · {String(creator.contentCount)} stories
                </div>
              </div>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--ink-muted)',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              New this week
            </div>
            <h3
              className="ch-display"
              style={{
                margin: 0,
                fontSize: 'clamp(20px, 2.2vw, 26px)',
                lineHeight: 1.1,
                color: 'var(--ink)',
                letterSpacing: '-0.015em',
                marginBottom: 12,
              }}
            >
              {featuredContent.title}
            </h3>
            {featuredContent.summary && (
              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  color: 'var(--ink-soft)',
                  lineHeight: 1.55,
                }}
              >
                {featuredContent.summary}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
            <Link
              href={`/content/${featuredContent.id}`}
              className="ch-btn ch-btn-ink"
              style={{ padding: '12px 18px' }}
            >
              Read story →
            </Link>
            <Link
              href={`/u/${creator.username}`}
              className="ch-btn ch-btn-ghost"
              style={{ padding: '12px 18px' }}
            >
              View profile
            </Link>
          </div>
        </div>

        <div
          className={`ch-photo ${photoClass} ch-spotlight__photo`}
          aria-hidden
        />
      </div>
    </section>
  )
}

function fmt(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10_000) return `${(n / 1000).toFixed(1)}k`
  if (n < 1_000_000) return `${String(Math.round(n / 1000))}k`
  return `${(n / 1_000_000).toFixed(1)}M`
}

function pickPhoto(title: string): string {
  const lower = title.toLowerCase()
  const candidates = ['konkan', 'spiti', 'monsoon', 'goa', 'ladakh', 'hampi', 'matheran', 'bandra']
  for (const c of candidates) if (lower.includes(c)) return `ch-photo--${c}`
  return 'ch-photo--konkan'
}
