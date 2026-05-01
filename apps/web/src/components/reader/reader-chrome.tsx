'use client'

import Link from 'next/link'
import { motion, useScroll, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { ReaderMode } from '@/lib/reader-mode'

/**
 * Sticky top chrome for multi-day reads (E5.3 T2).
 *
 * Composition matches v3 wireframe `pack-w-detail.jsx` lines 233–253:
 *   "← All chapters" back link · centered day-progress
 *   ("Day N of M · {chapter title}" + thin coral bar) · Aa / Save / Share.
 *
 * The progress bar tracks overall scroll position through the article
 * (cheap and consistent with the top-of-viewport `<ReadingProgress>`).
 * The day label updates when a `[data-day-anchor="N"]` element intersects
 * the viewport — same pattern as the retiring `<StickyDayNav>`.
 *
 * Single-day reads (posts, single-day itineraries) should mount this with
 * `days={[]}` to suppress the day-progress chip and back link.
 */
export interface ReaderChromeDay {
  day: number
  title: string
}

interface ReaderChromeProps {
  /** Days in this read; pass `[]` for non-multi-day to suppress the chip. */
  days: ReaderChromeDay[]
  /** Mode currently active — sets the Aa button visual state. */
  mode: ReaderMode
  /** Server Action that toggles + persists the cookie. */
  onToggleMode: () => void
  /** Toggle save state for the parent content. */
  onToggleSave: () => void
  isSaved: boolean
  /** Native share / copy-link. */
  onShare: () => void
  /** Total chapters for the back-link contextual label. Defaults to days.length. */
  totalChapters?: number
}

export function ReaderChrome({
  days,
  mode,
  onToggleMode,
  onToggleSave,
  isSaved,
  onShare,
  totalChapters,
}: ReaderChromeProps) {
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const [activeDay, setActiveDay] = useState<number>(days[0]?.day ?? 0)
  const isMultiDay = days.length > 1
  const total = totalChapters ?? days.length

  // Track which day section is currently in view (for the centered chip label).
  useEffect(() => {
    if (!isMultiDay) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const dayAttr = entry.target.getAttribute('data-day-anchor')
            const n = Number(dayAttr ?? '')
            if (Number.isFinite(n) && n > 0) setActiveDay(n)
          }
        })
      },
      { rootMargin: '-30% 0px -55% 0px' },
    )
    days.forEach((d) => {
      const el = document.querySelector(`[data-day-anchor="${String(d.day)}"]`)
      if (el) observer.observe(el)
    })
    return () => {
      observer.disconnect()
    }
  }, [days, isMultiDay])

  const activeChapter = days.find((d) => d.day === activeDay) ?? days[0]

  return (
    <div
      role="toolbar"
      aria-label="Reader chrome"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        background: 'color-mix(in srgb, var(--bg) 92%, transparent)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--hairline)',
        padding: '12px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      {isMultiDay ? (
        <Link
          href="#chapters"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--ink-soft)',
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          <span aria-hidden>←</span>
          <span>All chapters</span>
        </Link>
      ) : (
        <span style={{ width: 110 }} aria-hidden />
      )}

      {isMultiDay && activeChapter ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: 'var(--ink-muted)',
              fontWeight: 500,
            }}
          >
            <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
              Day {String(activeDay)} of {String(total)}
            </span>{' '}
            · {activeChapter.title}
          </div>
          <div
            role="progressbar"
            aria-valuenow={Math.round((activeDay / Math.max(total, 1)) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{
              width: 280,
              height: 3,
              background: 'var(--surface-alt)',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                background: 'var(--primary)',
                borderRadius: 999,
                transformOrigin: 'left',
                scaleX: reduced ? 1 : scrollYProgress,
              }}
            />
          </div>
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        <ToolbarBtn
          onClick={onToggleMode}
          ariaLabel={`Switch to ${mode === 'magazine' ? 'compact' : 'magazine'} mode`}
          ariaPressed={mode === 'magazine'}
        >
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 600 }}>
            Aa
          </span>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={onToggleSave}
          ariaLabel={isSaved ? 'Remove from saved' : 'Save'}
          ariaPressed={isSaved}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={isSaved ? 'var(--primary)' : 'none'}
            stroke={isSaved ? 'var(--primary)' : 'currentColor'}
            strokeWidth="2"
            aria-hidden
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </ToolbarBtn>
        <ToolbarBtn onClick={onShare} ariaLabel="Share">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </ToolbarBtn>
      </div>
    </div>
  )
}

interface ToolbarBtnProps {
  onClick: () => void
  ariaLabel: string
  ariaPressed?: boolean
  children: React.ReactNode
}

function ToolbarBtn({ onClick, ariaLabel, ariaPressed, children }: ToolbarBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      {...(ariaPressed !== undefined ? { 'aria-pressed': ariaPressed } : {})}
      style={{
        width: 36,
        height: 36,
        borderRadius: 999,
        border: 'none',
        background: 'var(--surface-alt)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--ink)',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  )
}
