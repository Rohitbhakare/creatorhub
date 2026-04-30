'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'
import {
  easing,
  revealVariants,
  revealVariantsReduced,
  REDUCED_DURATION_MS,
} from '@/lib/motion'

interface ScrollRevealProps {
  children: ReactNode
  delay?: number
  /** Threshold (0-1) for "in view" before animating. Default 0.3. */
  threshold?: number
  className?: string
  as?: 'div' | 'section' | 'article' | 'li'
}

/**
 * Wraps children in a `whileInView` reveal — used for editorial sections
 * and grid items (WEB-MOTION-FR-102). Respects `prefers-reduced-motion`:
 * skips transform, keeps a soft opacity fade so layout shifts are still
 * cushioned (WEB-MOTION-FR-105).
 */
export function ScrollReveal({
  children,
  delay = 0,
  threshold = 0.3,
  className,
  as = 'div',
}: ScrollRevealProps) {
  const reduced = useReducedMotion()
  const variants = reduced ? revealVariantsReduced : revealVariants
  const Component = motion[as] as typeof motion.div

  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold }}
      transition={{
        duration: reduced ? REDUCED_DURATION_MS / 1000 : 0.55,
        ease: easing.easeOut,
        delay: reduced ? 0 : delay,
      }}
      variants={variants}
      className={className}
    >
      {children}
    </Component>
  )
}
