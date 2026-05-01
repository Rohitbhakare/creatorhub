'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useMemo } from 'react'

const PARTICLE_COUNT = 200 // E5.6 T5 — bumped from 80 per FR-022
const COLORS = ['#E15A41', '#D97B1A', '#1D9E75', '#185FA5', '#B9401E']

interface Particle {
  id: number
  x: number
  y: number
  rotate: number
  scale: number
  color: string
}

/**
 * Confetti burst — Framer Motion spring per particle.
 * Reduced-motion users see a single coral check fade-in instead of confetti.
 */
export function WelcomeBurst() {
  const reduced = useReducedMotion()
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 600,
      y: -200 - Math.random() * 600,
      rotate: Math.random() * 720,
      scale: 0.6 + Math.random() * 0.8,
      color: COLORS[i % COLORS.length] ?? '#E15A41',
    }))
  }, [])

  if (reduced) {
    return (
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.32 }}
        style={{
          position: 'absolute',
          top: 80,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 64,
          height: 64,
          borderRadius: 999,
          background: 'var(--primary-tint)',
          color: 'var(--primary-deep)',
          display: 'grid',
          placeItems: 'center',
          fontSize: 28,
          fontWeight: 700,
        }}
      >
        ✓
      </motion.div>
    )
  }

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        width: 0,
        height: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: p.scale }}
          animate={{ x: p.x, y: p.y, rotate: p.rotate, opacity: 0 }}
          transition={{
            duration: 1.4,
            ease: [0.22, 1, 0.36, 1],
            delay: Math.random() * 0.2,
          }}
          style={{
            position: 'absolute',
            width: 10,
            height: 14,
            background: p.color,
            borderRadius: 2,
            transformOrigin: 'center',
          }}
        />
      ))}
    </div>
  )
}
