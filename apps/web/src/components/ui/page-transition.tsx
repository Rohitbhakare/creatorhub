'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

/**
 * Wraps the page tree in an AnimatePresence keyed by pathname so route
 * changes get a quick fade+slide transition. SPA-feel without sacrificing
 * SSR — the server renders the page as usual; this wrapper just animates
 * the swap on the client.
 *
 * Reduced-motion users get a no-op fade at 100ms.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const reduced = useReducedMotion()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
        animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
        transition={{ duration: reduced ? 0.1 : 0.22, ease: [0.22, 1, 0.36, 1] }}
        style={{ minHeight: '100vh' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
