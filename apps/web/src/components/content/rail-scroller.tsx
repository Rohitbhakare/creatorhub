'use client'

import { useEffect, useRef, useState } from 'react'

interface RailScrollerProps {
  children: React.ReactNode
  /** Aria label for the rail. Defaults to "Stories rail". */
  ariaLabel?: string
}

/**
 * v3 magazine section rail with hover-revealed scroll arrows. WEB-FEED-FR-025
 * + FR-103. Server passes server-rendered cards as children; this wrapper
 * just adds the chrome:
 *   - left + right arrow buttons, hidden until the rail has hover
 *     and the user can actually scroll in that direction
 *   - smooth-scroll by ~one card width on click
 *   - touch devices skip the arrows entirely (gesture-only)
 *
 * Implements scroll-snap CSS so keyboard users can also nudge with
 * arrow keys (the rail is focusable; left/right snap card-by-card).
 */
export function RailScroller({ children, ariaLabel = 'Stories rail' }: RailScrollerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    function update() {
      if (!el) return
      setCanPrev(el.scrollLeft > 4)
      setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  function scrollBy(dir: -1 | 1) {
    const el = ref.current
    if (!el) return
    const card = el.firstElementChild as HTMLElement | null
    const step = card ? card.clientWidth + 16 : 320
    el.scrollBy({ left: step * dir, behavior: 'smooth' })
  }

  return (
    <div className="ch-rail" aria-label={ariaLabel}>
      <div
        ref={ref}
        tabIndex={0}
        className="ch-rail__track"
        role="region"
        aria-label={ariaLabel}
      >
        {children}
      </div>
      {canPrev && (
        <button
          type="button"
          className="ch-rail__arrow ch-rail__arrow--prev"
          aria-label="Previous"
          onClick={() => {
            scrollBy(-1)
          }}
        >
          <ChevronIcon dir="left" />
        </button>
      )}
      {canNext && (
        <button
          type="button"
          className="ch-rail__arrow ch-rail__arrow--next"
          aria-label="Next"
          onClick={() => {
            scrollBy(1)
          }}
        >
          <ChevronIcon dir="right" />
        </button>
      )}
    </div>
  )
}

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  const points = dir === 'left' ? '15 6 9 12 15 18' : '9 6 15 12 9 18'
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points={points} />
    </svg>
  )
}
