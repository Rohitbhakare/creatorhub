'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useRef, type ReactNode } from 'react'

interface ParallaxHeroProps {
  photoClass: string
  children: ReactNode
}

/**
 * Full-bleed 70vh hero with depth-of-field parallax (image translates Y at
 * 0.3× scroll, content stays put). Falls back to a static hero when the user
 * prefers reduced motion (WEB-MOTION-FR-105).
 */
export function ParallaxHero({ photoClass, children }: ParallaxHeroProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 600], [0, 180])
  const opacity = useTransform(scrollY, [0, 400, 700], [1, 1, 0.6])

  if (reduced) {
    return (
      <section
        className={`ch-photo ${photoClass}`}
        style={{ position: 'relative', height: '70vh', minHeight: 480, borderRadius: 0 }}
      >
        <div className="ch-photo-overlay" />
        {children}
      </section>
    )
  }

  return (
    <section
      ref={ref}
      style={{
        position: 'relative',
        height: '70vh',
        minHeight: 480,
        overflow: 'hidden',
      }}
    >
      <motion.div
        className={`ch-photo ${photoClass}`}
        style={{
          position: 'absolute',
          top: -90,
          left: 0,
          right: 0,
          bottom: -90,
          y,
          opacity,
          borderRadius: 0,
          willChange: 'transform',
        }}
        aria-hidden
      >
        <div className="ch-photo-overlay" />
      </motion.div>
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>{children}</div>
    </section>
  )
}
