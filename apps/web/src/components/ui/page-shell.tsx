/**
 * Page shell — centered, max-width 1640, 32px gutters that step down on
 * tablet and mobile per WEB-NFR-006. Wraps the route's `<main>` so every
 * page has the same outer rhythm without each page redeclaring inline
 * `maxWidth` / `padding` styles.
 *
 * Pair with `<TwoColLayout>` for home/discover/content-detail; `<ReaderLayout>`
 * for itinerary reading; or use bare for single-column pages (legal, kyc steps).
 *
 * SSR-safe.
 */

import type { CSSProperties, ReactNode } from 'react'

interface PageShellProps {
  children: ReactNode
  /** Vertical padding above + below the shell. Defaults to 0 (let pages decide). */
  paddingBlock?: number | string
  /** Override the default 1640px max-width (rare — used for narrow pages like legal). */
  maxWidth?: number
  /** Drop the side gutters when the page wants to be edge-to-edge (e.g. parallax hero). */
  flush?: boolean
  className?: string
  style?: CSSProperties
  /** Render as `<main>` (default) or a different element. Use `<section>` for nested shells. */
  as?: 'main' | 'section' | 'article' | 'div'
  /** Native id, used by skip-link target. */
  id?: string
}

export function PageShell({
  children,
  paddingBlock,
  maxWidth,
  flush = false,
  className,
  style,
  as: As = 'main',
  id,
}: PageShellProps) {
  const classes = [flush ? undefined : 'ch-container', className].filter(Boolean).join(' ')
  const merged: CSSProperties = {
    paddingBlock,
    maxWidth: maxWidth ?? undefined,
    ...style,
  }
  return (
    <As id={id} className={classes} style={merged}>
      {children}
    </As>
  )
}
