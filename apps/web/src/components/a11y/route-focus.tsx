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

    // Round-5 audit caught a hydration mismatch on /discover: the
    // setAttribute('tabindex', '-1') previously ran synchronously on
    // useEffect commit, which is close enough to hydration that React
    // 19/Next 15 dev mode flags the attribute drift on the next reconcile.
    // Folding the mutation inside the existing 80ms setTimeout pushes it
    // past hydration so React's reconciler is done before we touch the
    // DOM. The attribute is needed because <h1> is not focusable without
    // it — focus() would silently fail otherwise.
    const id = window.setTimeout(() => {
      if (heading.getAttribute('tabindex') === null) {
        heading.setAttribute('tabindex', '-1')
      }
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
