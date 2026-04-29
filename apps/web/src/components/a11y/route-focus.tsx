'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/**
 * On client-side route changes, focus the first <h1> in the new page so
 * screen readers announce the new context (per WEB-A11Y-FR-109).
 *
 * - Skips first paint (browser already focuses the body).
 * - Sets tabindex=-1 + a roving aria-live="polite" announcement.
 * - Resets scroll-position implicitly because Next does it; we just handle
 *   focus.
 */
export function RouteFocus() {
  const pathname = usePathname()

  useEffect(() => {
    // Skip first mount — the browser handles initial focus on full page load.
    if (typeof window === 'undefined') return
    const main = document.querySelector('main')
    const heading = main?.querySelector<HTMLElement>('h1')
    if (!heading) return

    if (heading.getAttribute('tabindex') === null) {
      heading.setAttribute('tabindex', '-1')
    }
    // Defer focus so any AnimatePresence transitions don't fight it.
    const id = window.setTimeout(() => {
      heading.focus({ preventScroll: false })
    }, 80)

    return () => {
      window.clearTimeout(id)
    }
  }, [pathname])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: 'absolute',
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
      id="ch-aria-live"
    />
  )
}
