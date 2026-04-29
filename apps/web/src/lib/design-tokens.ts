/**
 * CreatorHub Web — Design Tokens (TypeScript mirror).
 *
 * The source of truth lives in `apps/web/src/app/globals.css` as CSS custom
 * properties. This module exposes the same scales as named exports for JSX
 * inline styles where you need a literal (e.g. number for transition
 * durations, exact px for measurements before paint).
 *
 * Rule: prefer the CSS var (`color: 'var(--ink)'`) when the value is just a
 * style — it's themable for free. Use the named export here only when you
 * need the value in JS (e.g. animation calcs, conditional logic, motion
 * variants).
 *
 * See WEB-DESIGN-SYSTEM.md for layout rules, button hierarchy, and the
 * coral-accent allow-list.
 */

// ── Colors ────────────────────────────────────────────────────────

/** Semantic color tokens — same names as CSS vars without the `--` prefix. */
export const color = {
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surfaceAlt: 'var(--surface-alt)',
  surfaceSunk: 'var(--surface-sunk)',
  ink: 'var(--ink)',
  inkSoft: 'var(--ink-soft)',
  inkMuted: 'var(--ink-muted)',
  inkFaint: 'var(--ink-faint)',
  hairline: 'var(--hairline)',
  hairlineStrong: 'var(--hairline-strong)',
  primary: 'var(--primary)',
  primaryDeep: 'var(--primary-deep)',
  primaryTint: 'var(--primary-tint)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: 'var(--info)',
} as const

// ── Spacing ───────────────────────────────────────────────────────

/**
 * 4 px-base spacing scale. Use the symbol (`spacing.md`) instead of a magic
 * number so the rhythm is auditable across the codebase.
 *   xs  4px    sm  8px    md 12px    lg 16px    xl 24px
 *   2xl 32px   3xl 40px   4xl 56px   5xl 80px   6xl 120px
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 56,
  '5xl': 80,
  '6xl': 120,
} as const

/** Page-level layout horizontal cap. The wireframe uses 1240; the live web
 *  uses 1640 because wide-screen monitors leave too much dead margin at 1240.
 *  Header / footer / feed / discover all max at this. */
export const PAGE_MAX_WIDTH = 1640

/** Side gutters scale with breakpoint; default desktop uses 32. */
export const PAGE_GUTTER = 32

/** Right-rail width for two-column layouts (home, content detail authed). */
export const RIGHT_RAIL_WIDTH = 296

/** Studio left sidebar width. */
export const STUDIO_SIDEBAR_WIDTH = 220

// ── Radius ────────────────────────────────────────────────────────

/** Soft-corner default for cards, inputs, sheets. Buttons + chips use pill. */
export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
} as const

// ── Type ──────────────────────────────────────────────────────────

/** Display sizes for editorial heads. Always Fraunces, weight 600, line-height 1.05. */
export const displaySize = {
  xs: 22, // chapter title in cards
  sm: 26, // section heading on rails
  md: 32, // bento feature title
  lg: 40, // page H1
  xl: 56, // hero feature title
  '2xl': 72, // landing hero
} as const

/** Body text sizes — Inter / Geist sans. */
export const bodySize = {
  xxs: 10, // mono kicker label
  xs: 11, // mono kicker
  sm: 12, // meta / chip text
  md: 13.5, // default UI body
  base: 14, // global body
  lg: 15, // emphasised body
  xl: 17, // sub-headline / lede
} as const

/** Letter-spacing rules. */
export const tracking = {
  tight: '-0.03em', // brand wordmark, large display
  display: '-0.02em', // headings >= 28px
  bodyTight: '-0.005em', // emphasized body
  caps: '0.18em', // small-caps mono kicker
  capsWide: '0.22em', // weather-stripe kicker
} as const

// ── Motion ────────────────────────────────────────────────────────

/** Standard easing curves. `easeOut` for entrance, `easeInOut` for state, spring for press. */
export const easing = {
  easeOut: [0.22, 1, 0.36, 1] as const,
  easeInOut: [0.65, 0, 0.35, 1] as const,
  spring: { stiffness: 280, damping: 26 } as const,
} as const

/** Standard durations in ms.
 *   micro 120ms — flick / tap response
 *   chip 180ms — chip select, button hover
 *   page 220ms — page transitions, modal in/out
 *   drawer 300ms — sheets, drawers, accordion
 *   hero 480ms — once-only entrance reveals
 */
export const duration = {
  micro: 120,
  chip: 180,
  page: 220,
  drawer: 300,
  hero: 480,
} as const

// ── Shadow ────────────────────────────────────────────────────────

/** Layered shadows per SRS C-18. Cards default to `md`. */
export const shadow = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
} as const

// ── Z-index scale ─────────────────────────────────────────────────

/** Single source of z-indexes — never invent new layer numbers. */
export const z = {
  base: 0,
  raised: 1,
  sticky: 20,
  header: 30,
  guestPromptBar: 40,
  modalScrim: 90,
  commandPalette: 100,
} as const

// ── Breakpoints ───────────────────────────────────────────────────

/**
 * Grid breakpoints (matches WEB-NFR-006).
 *   mobile      < 768
 *   tablet     768–1079
 *   desktop   1080–1439
 *   wide      1440–1919
 *   ultrawide ≥ 1920
 */
export const breakpoint = {
  mobile: 768,
  tablet: 1080,
  desktop: 1440,
  ultrawide: 1920,
} as const

export type Color = keyof typeof color
export type Spacing = keyof typeof spacing
export type Radius = keyof typeof radius
