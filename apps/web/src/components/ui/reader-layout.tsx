/**
 * Three-column reader layout: 200px day-nav (left) + 1fr body + 280px
 * map/aside (right). Used by `/content/:id` for itinerary detail.
 *
 * Wraps the existing `.ch-reader-grid` CSS class with semantic landmarks
 * — `<nav aria-label="Days">`, the body wrapper, `<aside aria-label="…">`
 * — per WEB-A11Y-FR-108. The CSS already collapses to two-col on tablet
 * (drops the day-nav) and one-col on mobile (drops the map).
 *
 * Pass `dayNav={null}` for non-itinerary content (post, story) so the
 * grid reflows to a wider single-column body.
 *
 * SSR-safe.
 */

import type { ReactNode } from 'react'

interface ReaderLayoutProps {
  /** Left-rail day picker. Pass `null` for posts / non-day-grouped content. */
  dayNav: ReactNode | null
  /** Centered article body. */
  body: ReactNode
  /** Right-rail (map, book-cta, related). Pass `null` to drop the aside. */
  aside: ReactNode | null
  /** Optional aria-label for the right aside (defaults to "Reader sidebar"). */
  asideLabel?: string
  className?: string
}

export function ReaderLayout({
  dayNav,
  body,
  aside,
  asideLabel = 'Reader sidebar',
  className,
}: ReaderLayoutProps) {
  const modifiers = [
    'ch-reader-grid',
    dayNav === null && 'ch-reader-grid--no-days',
    aside === null && 'ch-reader-grid--no-aside',
    className,
  ]
    .filter(Boolean)
    .join(' ')
  const classes = modifiers
  return (
    <div className={classes}>
      {dayNav !== null && <nav aria-label="Days">{dayNav}</nav>}
      <div>{body}</div>
      {aside !== null && <aside aria-label={asideLabel}>{aside}</aside>}
    </div>
  )
}
