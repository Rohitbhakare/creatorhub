/**
 * CreatorHub Web — Motion tokens & shared variants (WEB-MOTION-FR-100..105).
 *
 * The wireframe design system specifies a fixed motion vocabulary; this
 * module exposes it as typed exports so components don't carry magic
 * numbers. Pair with `useReducedMotion()` from framer-motion: every
 * transform-based variant has a `…Reduced` counterpart (opacity-only,
 * capped at 100ms, no parallax) per WEB-MOTION-FR-105.
 *
 * Rule of thumb:
 *   - Page-level entrances use `pageVariants`
 *   - List item reveals use `revealVariants` with `viewport={{ once: true }}`
 *   - Microinteractions (hover, press) use the `easing.spring` config
 *   - Confetti / level-up bursts use `easing.spring` with extra damping
 *
 * Durations in milliseconds for clarity at call sites; framer-motion takes
 * seconds, so divide by 1000 when passing to `transition.duration`. Helpers
 * `secs(ms)` and `transitionFrom(name)` do this for you.
 */

import { duration } from './design-tokens'

// ── Easing curves ─────────────────────────────────────────────────

/**
 * Bezier easing curves (WEB-MOTION easing language). Use as the `ease`
 * value in any framer-motion transition. The cubic-bezier control points
 * map onto CSS `cubic-bezier(...)` directly.
 */
/** Cubic-bezier easing tuple compatible with framer-motion's `Easing` type. */
type CubicBezier = [number, number, number, number]

export const easing = {
  /** Default entrance — fast in, slow settle. Good for reveals. */
  easeOut: [0.22, 1, 0.36, 1] as CubicBezier,
  /** State changes — symmetrical. Good for chip select / toggle / accordion. */
  easeInOut: [0.65, 0, 0.35, 1] as CubicBezier,
  /** Press / pop / confetti spring. Pass as `transition={{ type: 'spring', ...easing.spring }}`. */
  spring: { type: 'spring' as const, stiffness: 280, damping: 26 },
}

// ── Durations (re-exported for convenience) ───────────────────────

/**
 * Re-export of `duration` from design-tokens with a `secs` helper. Keep
 * call sites human-readable: `transition={{ duration: secs('page') }}`.
 */
export { duration } from './design-tokens'

/** Convert a named duration (or a raw ms number) to framer-motion seconds. */
export function secs(value: keyof typeof duration | number): number {
  const ms = typeof value === 'number' ? value : duration[value]
  return ms / 1000
}

/** Reduced-motion duration cap: no animation should run longer than this. */
export const REDUCED_DURATION_MS = 100

// ── Standard variants ─────────────────────────────────────────────

/**
 * Page-level transition (WEB-MOTION-FR-101). Used by `<PageTransition>`.
 * Fade + 6px lift in, fade + 4px exit. Reduced-motion = opacity-only.
 */
export const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
} as const

export const pageVariantsReduced = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const

/**
 * List/section reveal (WEB-MOTION-FR-102). Used by `<ScrollReveal>`.
 * Fade + 12px lift; reduced-motion = opacity-only fade.
 */
export const revealVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
} as const

export const revealVariantsReduced = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
} as const

/**
 * Stagger config for sequencing list items. Cap at first 8 (FR-102):
 * the 9th+ items snap in without animation. Apply with
 * `transition={{ ...stagger(40), delayChildren: 0 }}`.
 */
export function stagger(stepMs: number) {
  return { staggerChildren: secs(stepMs) }
}

// ── Reduced-motion-aware transition factory ───────────────────────

/**
 * Build a `transition` object that honors reduced-motion automatically.
 * Pass the framer-motion `useReducedMotion()` result alongside the named
 * duration + easing. Callers don't have to remember to override.
 *
 * Example:
 *   const reduced = useReducedMotion()
 *   <motion.div transition={transitionFor(reduced, 'page')} />
 */
export function transitionFor(
  reduced: boolean | null,
  durationKey: keyof typeof duration,
  ease: CubicBezier = easing.easeOut,
) {
  if (reduced) {
    return { duration: REDUCED_DURATION_MS / 1000, ease: easing.easeOut }
  }
  return { duration: secs(durationKey), ease }
}

// ── Tilt — cursor-aware microinteraction (FR-103) ─────────────────

/**
 * Max card-hover tilt angle in degrees. Disabled on touch devices via
 * the `(hover: hover) and (pointer: fine)` media query at the call site.
 * E5.1 will consume this; defined here so the value is centralised.
 */
export const TILT_MAX_DEG = 2

// ── Confetti config (FR-091, FR-055) ──────────────────────────────

/**
 * Confetti spring config used on level-up + booking confirmation. Caps
 * at 200 particles per the SRS. Reduced-motion replaces with a single
 * coral check fade-in (consumer's responsibility — see WEB-A11Y-FR-110).
 */
export const CONFETTI_PARTICLES = 200
export const CONFETTI_DURATION_MS = 1400 // FR-055: 1.4 s celebration
