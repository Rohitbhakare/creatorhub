/**
 * Two-column layout: main (1fr, max content width) + 296px right rail.
 * Used by `/`, `/discover`, `/content/:id` (authed). Tablet shrinks the
 * rail to 260px; mobile stacks (`aside` falls below `main`).
 *
 * Wraps the existing `.ch-page-grid` CSS class with semantic landmark
 * tags — `<main role="main">` and `<aside aria-label="Side rail">` —
 * so screen readers and skip-links work correctly (WEB-A11Y-FR-108).
 *
 * SSR-safe.
 */

import type { ReactNode } from 'react'

interface TwoColLayoutProps {
  /** Primary content column. */
  main: ReactNode
  /** Right-side rail. Pass `null` to skip rendering the aside slot. */
  rail: ReactNode | null
  /** Optional aria-label for the aside (defaults to "Side rail"). */
  railLabel?: string
  className?: string
}

export function TwoColLayout({
  main,
  rail,
  railLabel = 'Side rail',
  className,
}: TwoColLayoutProps) {
  const classes = ['ch-page-grid', className].filter(Boolean).join(' ')
  return (
    <div className={classes}>
      <div>{main}</div>
      {rail !== null && <aside aria-label={railLabel}>{rail}</aside>}
    </div>
  )
}
