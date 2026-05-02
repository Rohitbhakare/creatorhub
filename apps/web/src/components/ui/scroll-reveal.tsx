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
 * Scroll-triggered reveal wrapper (WEB-MOTION-FR-102).
 *
 * Renders content at the "visible" state on SSR (no `initial="hidden"`) so
 * the page is never blank when JS fails, IntersectionObserver doesn't fire,
 * or the agent is a non-scrolling crawler (E5.1/BUG-001). The reveal
 * animation only fires on subsequent scrolls into view via `whileInView` —
 * effectively a no-op for elements that are already in view at mount, which
 * is exactly the desired behaviour: content above the fold doesn't fade in,
 * content below the fold gets the fade as the user scrolls.
 *
 * Tradeoff: lose the staggered hero-entrance animation that ran on first
 * page load. Hero content now appears statically. Net win: no blank page
 * for SEO crawlers, social-card preview generators, screenshot scripts,
 * users with broken JS, or anyone whose IntersectionObserver glitches.
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
      initial={false}
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
