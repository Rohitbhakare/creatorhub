'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { InitialAvatar } from '@/components/ui/initial-avatar'
import { Pill } from '@/components/ui/pill'
import { easing, secs } from '@/lib/motion'
import type { ChapterStory } from '@/lib/api/feed'

interface ChapterHeroProps {
  story: ChapterStory
  /** Auto-advance interval in ms. Default 7000. Set 0 to disable. */
  autoAdvanceMs?: number
}

const DEFAULT_INTERVAL_MS = 7000

/**
 * v3 magazine "story of the day" — a featured itinerary's chapters
 * (spots) cycle through a single hero card. WEB-FEED-FR-025 magazine
 * treatment. Auto-advance is gated by `useReducedMotion` (FR-105) and
 * pauses on tab blur (visibilitychange) so a backgrounded tab doesn't
 * burn cycles.
 *
 * Keyboard:
 *   ←  previous chapter
 *   →  next chapter
 *
 * Falls back to a static first-chapter render under reduced motion.
 */
export function ChapterHero({ story, autoAdvanceMs = DEFAULT_INTERVAL_MS }: ChapterHeroProps) {
  const reduced = useReducedMotion()
  const [chapter, setChapter] = useState(0)
  const [paused, setPaused] = useState(false)
  const total = story.chapters.length

  const advance = useCallback(
    (delta: number) => {
      setChapter((c) => (c + delta + total) % total)
    },
    [total],
  )

  // Auto-advance timer. Disabled under reduced-motion or when paused.
  useEffect(() => {
    if (reduced || paused || autoAdvanceMs <= 0 || total <= 1) return
    const id = window.setInterval(() => {
      setChapter((c) => (c + 1) % total)
    }, autoAdvanceMs)
    return () => {
      window.clearInterval(id)
    }
  }, [reduced, paused, autoAdvanceMs, total])

  // Pause on tab blur so a backgrounded page doesn't churn timers.
  useEffect(() => {
    function onVis() {
      setPaused(document.hidden)
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // Arrow-key navigation.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName.toLowerCase()
        if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return
      }
      if (e.key === 'ArrowLeft') {
        advance(-1)
      } else if (e.key === 'ArrowRight') {
        advance(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
    }
  }, [advance])

  const ch = story.chapters[chapter]
  if (!ch) return null

  const photoClass = `ch-photo--${pickPhoto(story.content.title)}`
  const totalDigits = String(total).padStart(2, '0')
  const chapterDigits = String(ch.dayNumber).padStart(2, '0')

  return (
    <section
      style={{ maxWidth: 1640, margin: '0 auto', padding: '0 32px' }}
      onMouseEnter={() => {
        setPaused(true)
      }}
      onMouseLeave={() => {
        setPaused(false)
      }}
    >
      <div className="ch-chapter-hero">
        {/* Photo side. We render an <Image priority> when the content has
         * a real cover so the browser preloads it (LCP candidate on /).
         * Falls back to the CSS-painted gradient class when no cover URL —
         * keeps brand-new creators' chapters from rendering visually empty. */}
        <div
          className={`ch-photo ${story.content.coverImageUrl ? '' : photoClass}`}
          style={{
            position: 'relative',
            minHeight: 360,
            borderRadius: 0,
            overflow: 'hidden',
          }}
        >
          {story.content.coverImageUrl && (
            <Image
              src={story.content.coverImageUrl}
              alt=""
              fill
              sizes="(max-width: 1080px) 100vw, 720px"
              style={{ objectFit: 'cover' }}
              unoptimized={isExternalUnoptimized(story.content.coverImageUrl)}
              priority
              aria-hidden
            />
          )}
          {/* Gradient overlay so white text/labels stay legible regardless
           * of cover image. Sits on top of the Image, below content. */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0.55) 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 24,
              left: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <Pill variant="coral">★ Story of the day</Pill>
            <div
              style={{
                color: 'white',
                fontFamily: 'var(--font-serif)',
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                textShadow: '0 1px 4px rgba(0,0,0,0.4)',
              }}
            >
              Chapter {chapterDigits}/{totalDigits}
            </div>
          </div>

          <div style={{ position: 'absolute', left: 24, right: 24, bottom: 24, color: 'white' }}>
            <h2
              className="ch-display"
              style={{
                margin: 0,
                fontSize: 'clamp(28px, 3.8vw, 44px)',
                lineHeight: 1.05,
                color: 'white',
                textShadow: '0 2px 12px rgba(0,0,0,0.35)',
                maxWidth: '92%',
              }}
            >
              {story.content.title}
            </h2>
            <Link
              href={`/u/${story.content.creator.username}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 14,
                color: 'white',
                textDecoration: 'none',
                textShadow: '0 1px 4px rgba(0,0,0,0.4)',
              }}
            >
              <InitialAvatar
                name={story.content.creator.displayName}
                url={story.content.creator.avatarUrl ?? null}
                size={32}
              />
              <span style={{ fontSize: 13, fontWeight: 500 }}>
                {story.content.creator.displayName}
              </span>
            </Link>
          </div>
        </div>

        {/* Narrative side */}
        <div
          style={{
            padding: '32px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'var(--surface)',
          }}
        >
          <div>
            <AnimatePresence mode="wait">
              <motion.div
                key={ch.id}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: secs('chip'), ease: easing.easeOut }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--ink-muted)',
                    fontWeight: 600,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}
                >
                  Day {chapterDigits}
                </div>
                <h3
                  className="ch-display"
                  style={{
                    margin: '0 0 14px',
                    fontSize: 'clamp(22px, 2.4vw, 30px)',
                    lineHeight: 1.1,
                    color: 'var(--ink)',
                  }}
                >
                  {ch.name}
                </h3>
                {ch.description && (
                  <p
                    style={{
                      margin: 0,
                      fontFamily: 'var(--font-serif)',
                      fontSize: 18,
                      lineHeight: 1.55,
                      color: 'var(--ink-soft)',
                      fontStyle: 'italic',
                    }}
                  >
                    “{ch.description}”
                  </p>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Chapter dots — clickable */}
            <div role="tablist" aria-label="Chapters" style={{ display: 'flex', gap: 8, marginTop: 28 }}>
              {story.chapters.map((c, i) => {
                const active = i === chapter
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setChapter(i)
                    }}
                    style={{
                      flex: 1,
                      padding: '12px 10px 10px',
                      border: 0,
                      cursor: 'pointer',
                      background: active ? 'var(--surface)' : 'var(--surface-alt)',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: `3px solid ${active ? 'var(--primary)' : 'transparent'}`,
                      textAlign: 'left',
                      transition: 'background 150ms, border-color 150ms',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 9,
                        color: active ? 'var(--primary)' : 'var(--ink-muted)',
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                      }}
                    >
                      DAY {String(c.dayNumber).padStart(2, '0')}
                    </div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: active ? 'var(--ink)' : 'var(--ink-soft)',
                        fontWeight: active ? 600 : 500,
                        marginTop: 4,
                        lineHeight: 1.3,
                        height: 30,
                        overflow: 'hidden',
                      }}
                    >
                      {c.name}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
            <Link
              href={`/content/${story.content.id}`}
              className="ch-btn ch-btn-ink"
              style={{ flex: 1, padding: '14px 18px', justifyContent: 'center' }}
            >
              Read all {String(total)} chapters →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function pickPhoto(title: string): string {
  const lower = title.toLowerCase()
  const candidates = ['konkan', 'spiti', 'monsoon', 'goa', 'ladakh', 'hampi', 'matheran', 'bandra']
  for (const c of candidates) if (lower.includes(c)) return c
  return 'konkan'
}

/**
 * Mirror of the same helper in hero-feature.tsx — bypass next/image's
 * domain-bound optimizer for hosts that already serve transformed assets
 * (Google CDN, CloudFront, Razorpay) so we don't double-pay or hit a
 * "URL not whitelisted in next.config" wall.
 */
function isExternalUnoptimized(url: string): boolean {
  try {
    const u = new URL(url)
    if (
      u.host.endsWith('googleusercontent.com') ||
      u.host.endsWith('cloudfront.net') ||
      u.host.endsWith('razorpay.com')
    ) {
      return true
    }
    return false
  } catch {
    return false
  }
}
