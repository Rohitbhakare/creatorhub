'use client'

import { motion, useScroll, useReducedMotion } from 'framer-motion'

/**
 * 2px coral bar pinned to the top of the viewport, scaleX bound to body
 * scroll progress. Per WEB-READ-FR-044.
 */
export function ReadingProgress() {
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll()

  if (reduced) return null

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
        scaleX: scrollYProgress,
        zIndex: 50,
      }}
      aria-hidden
    />
  )
}
