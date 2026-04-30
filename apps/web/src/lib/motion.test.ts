import { describe, it, expect } from 'vitest'
import {
  easing,
  duration,
  secs,
  transitionFor,
  pageVariants,
  pageVariantsReduced,
  revealVariants,
  revealVariantsReduced,
  stagger,
  REDUCED_DURATION_MS,
  TILT_MAX_DEG,
  CONFETTI_PARTICLES,
  CONFETTI_DURATION_MS,
} from './motion'

describe('motion / easing', () => {
  it('exposes the three SRS-locked curves', () => {
    expect(easing.easeOut).toEqual([0.22, 1, 0.36, 1])
    expect(easing.easeInOut).toEqual([0.65, 0, 0.35, 1])
    expect(easing.spring.type).toBe('spring')
    expect(easing.spring.stiffness).toBe(280)
    expect(easing.spring.damping).toBe(26)
  })
})

describe('motion / secs', () => {
  it('converts a named duration key to seconds', () => {
    expect(secs('page')).toBe(0.22) // 220 ms → 0.22 s
    expect(secs('drawer')).toBe(0.3) // 300 ms → 0.3 s
    expect(secs('hero')).toBe(0.48) // 480 ms → 0.48 s
  })

  it('passes a raw ms number through as seconds', () => {
    expect(secs(500)).toBe(0.5)
    expect(secs(0)).toBe(0)
  })

  it('matches the duration token exports', () => {
    for (const key of Object.keys(duration) as (keyof typeof duration)[]) {
      expect(secs(key)).toBeCloseTo(duration[key] / 1000)
    }
  })
})

describe('motion / transitionFor', () => {
  it('returns the requested duration + ease when reduced-motion is off', () => {
    const t = transitionFor(false, 'page')
    expect(t.duration).toBeCloseTo(0.22)
    expect(t.ease).toBe(easing.easeOut)
  })

  it('honors a custom ease curve', () => {
    const t = transitionFor(false, 'chip', easing.easeInOut)
    expect(t.duration).toBeCloseTo(0.18)
    expect(t.ease).toBe(easing.easeInOut)
  })

  it('caps at REDUCED_DURATION_MS when reduced-motion is on', () => {
    const t = transitionFor(true, 'hero') // hero = 480 ms in normal mode
    expect(t.duration).toBe(REDUCED_DURATION_MS / 1000)
    expect(t.duration).toBeCloseTo(0.1)
  })

  it('treats a null reduced flag as off (frame-motion convention)', () => {
    const t = transitionFor(null, 'page')
    expect(t.duration).toBeCloseTo(0.22)
  })
})

describe('motion / variants', () => {
  it('page variants drop the y-axis transform under reduced motion', () => {
    expect(pageVariants.initial).toEqual({ opacity: 0, y: 6 })
    expect(pageVariantsReduced.initial).toEqual({ opacity: 0 })
    expect('y' in pageVariantsReduced.initial).toBe(false)
  })

  it('reveal variants drop the y-axis transform under reduced motion', () => {
    expect(revealVariants.hidden).toEqual({ opacity: 0, y: 12 })
    expect(revealVariantsReduced.hidden).toEqual({ opacity: 0 })
  })

  it('stagger() returns a framer-motion-shaped staggerChildren config', () => {
    expect(stagger(40)).toEqual({ staggerChildren: 0.04 })
    expect(stagger(120)).toEqual({ staggerChildren: 0.12 })
  })
})

describe('motion / SRS-locked constants', () => {
  it('REDUCED_DURATION_MS matches WEB-MOTION-FR-105 (cap ~100ms)', () => {
    expect(REDUCED_DURATION_MS).toBe(100)
  })

  it('TILT_MAX_DEG matches FR-103 (±2°)', () => {
    expect(TILT_MAX_DEG).toBe(2)
  })

  it('confetti config matches FR-091 / FR-055 (200 particles, 1.4s)', () => {
    expect(CONFETTI_PARTICLES).toBe(200)
    expect(CONFETTI_DURATION_MS).toBe(1400)
  })
})
