'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

/**
 * Top-of-viewport coral progress bar that streams while the next route
 * loads — same idiom as YouTube/GitHub. Uses Next's built-in navigation
 * lifecycle: fires when a Link is clicked and clears when the new
 * pathname/search renders.
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

  // Show the bar whenever a Link is intercepted. Hide as soon as the
  // pathname/search changes — that's our signal the new RSC tree painted.
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

  // Pathname/search changed → new page rendered → clear.
  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => {
      setActive(false)
    }, 120)
    return () => {
      clearTimeout(t)
    }
  }, [pathname, search, active])

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
