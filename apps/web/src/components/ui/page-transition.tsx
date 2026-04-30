'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  easing,
  pageVariants,
  pageVariantsReduced,
  transitionFor,
} from '@/lib/motion'

/**
 * Wraps the page tree in an AnimatePresence keyed by pathname so route
 * changes get a quick fade+slide transition (WEB-MOTION-FR-101). SPA-feel
 * without sacrificing SSR — the server renders the page as usual; this
 * wrapper just animates the swap on the client.
 *
 * Reduced-motion users get an opacity-only fade capped at 100ms (FR-105).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const reduced = useReducedMotion()
  const variants = reduced ? pageVariantsReduced : pageVariants

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={variants.initial}
        animate={variants.animate}
        exit={variants.exit}
        transition={transitionFor(reduced, 'page', easing.easeOut)}
        style={{ minHeight: '100vh' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
