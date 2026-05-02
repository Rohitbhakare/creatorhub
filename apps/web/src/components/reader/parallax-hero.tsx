'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import { useRef, type ReactNode } from 'react'

interface ParallaxHeroProps {
  photoClass: string
  imageUrl?: string | null
  children: ReactNode
}

/**
 * Full-bleed 70vh hero with depth-of-field parallax (image translates Y at
 * 0.3× scroll, content stays put). Falls back to a static hero when the user
 * prefers reduced motion (WEB-MOTION-FR-105).
 *
 * The hero image renders through `<Image priority>` so the browser preloads
 * it as part of the LCP graph — was previously a CSS `background-image:
 * url(...)` which the browser doesn't preload, causing a visible pop-in
 * flagged in the 2026-05-02 perf pass. The CSS-painted gradient class
 * (`ch-photo--konkan` etc.) still serves as the no-image fallback.
 */
export function ParallaxHero({ photoClass, imageUrl, children }: ParallaxHeroProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 600], [0, 180])
  const opacity = useTransform(scrollY, [0, 400, 700], [1, 0.85, 0.4])

  const bgClass = imageUrl ? '' : photoClass

  if (reduced) {
    return (
      <section
        className={`ch-photo ${bgClass}`}
        style={{
          position: 'relative',
          height: '85vh',
          minHeight: 540,
          borderRadius: 0,
          overflow: 'hidden',
        }}
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="100vw"
            style={{ objectFit: 'cover' }}
            unoptimized={isExternalUnoptimized(imageUrl)}
            priority
            aria-hidden
          />
        )}
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
        className={`ch-photo ${bgClass}`}
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
          overflow: 'hidden',
        }}
        aria-hidden
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="100vw"
            style={{ objectFit: 'cover' }}
            unoptimized={isExternalUnoptimized(imageUrl)}
            priority
          />
        )}
        <div className="ch-photo-overlay" />
      </motion.div>
      <div style={{ position: 'relative', zIndex: 1, height: '100%' }}>{children}</div>
    </section>
  )
}

/** See chapter-hero.tsx — same shared helper. */
function isExternalUnoptimized(url: string): boolean {
  try {
    const u = new URL(url)
    if (
      u.host.endsWith('googleusercontent.com') ||
      u.host.endsWith('cloudfront.net') ||
      u.host.endsWith('razorpay.com')
    ) {
      return true
    }
    return false
  } catch {
    return false
  }
}
