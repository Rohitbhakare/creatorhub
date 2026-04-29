'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  delay?: number
  /** Threshold (0-1) for "in view" before animating. Default 0.3. */
  threshold?: number
  className?: string
  as?: 'div' | 'section' | 'article' | 'li'
}

const DEFAULT_VARIANT = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

const REDUCED_VARIANT = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

/**
 * Wraps children in a `whileInView` reveal — used for editorial sections
 * and grid items. Respects `prefers-reduced-motion`: skips transform,
 * keeps a soft opacity fade so layout shifts are still cushioned.
 */
export function ScrollReveal({
  children,
  delay = 0,
  threshold = 0.3,
  className,
  as = 'div',
}: ScrollRevealProps) {
  const reduced = useReducedMotion()
  const variants = reduced ? REDUCED_VARIANT : DEFAULT_VARIANT
  const Component = motion[as] as typeof motion.div

  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold }}
      transition={{ duration: reduced ? 0.12 : 0.55, ease: [0.22, 1, 0.36, 1], delay }}
      variants={variants}
      className={className}
    >
      {children}
    </Component>
  )
}
