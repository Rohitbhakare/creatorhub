'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Top-of-viewport coral progress bar that streams while the next route
 * loads — same idiom as YouTube/GitHub. Fires on:
 *   1. Same-origin Link clicks (intercepted at capture phase)
 *   2. router.push/replace calls (detected by URL diff vs the last render)
 * Clears once the new pathname/search has painted (RSC stream done).
 *
 * Without this, server-side route changes feel "blank" — the user clicks
 * and nothing visible happens until the new page paints. The bar gives
 * an instant feedback signal.
 */
export function RouteProgress() {
  const pathname = usePathname()
  const search = useSearchParams()
  const reduced = useReducedMotion()
  const [active, setActive] = useState(false)
  // Track the last URL we *finished* rendering so router.push() that
  // changes the URL without a Link click is also picked up.
  const lastSettledRef = useRef<string>('')

  // Show the bar whenever a Link is intercepted.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onClick = (e: MouseEvent) => {
      const target = (e.target as Element | null)?.closest('a[href]') as
        | HTMLAnchorElement
        | null
      if (!target) return
      if (target.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return
      const url = new URL(target.href, window.location.origin)
      if (url.origin !== window.location.origin) return
      // Same URL? skip (no nav).
      if (url.pathname === pathname && url.search === window.location.search) return
      setActive(true)
    }
    window.addEventListener('click', onClick, { capture: true })
    return () => {
      window.removeEventListener('click', onClick, { capture: true } as never)
    }
  }, [pathname])

  // URL changed by any means (Link click *or* router.push from a button) →
  // light up the bar, then clear after the new tree renders.
  useEffect(() => {
    const settled = `${pathname}${search.toString() ? `?${search.toString()}` : ''}`
    // First mount: just record where we are.
    if (!lastSettledRef.current) {
      lastSettledRef.current = settled
      return
    }
    if (lastSettledRef.current !== settled) {
      // The URL we last saw is different from the one we're rendering now —
      // a navigation just completed (or is mid-completing). Briefly flash
      // the bar so the user perceives the change as "fast" not "blank".
      setActive(true)
      const t = setTimeout(() => {
        setActive(false)
        lastSettledRef.current = settled
      }, 240)
      return () => {
        clearTimeout(t)
      }
    }
    lastSettledRef.current = settled
    return undefined
  }, [pathname, search])

  if (reduced || !active) return null

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: 'var(--primary)',
        transformOrigin: 'left',
        zIndex: 60,
        pointerEvents: 'none',
      }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: [0, 0.4, 0.7, 0.85] }}
      exit={{ scaleX: 1, opacity: 0 }}
      transition={{ duration: 1.4, ease: 'easeOut' }}
    />
  )
}
