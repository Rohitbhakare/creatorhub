'use client'

import type { CSSProperties, ReactNode } from 'react'

interface SearchTriggerProps {
  /** Optional fallback href if JS is disabled — falls through to /discover. */
  fallbackHref?: string
  className?: string
  style?: CSSProperties
  children: ReactNode
  ariaLabel?: string
  title?: string
}

/**
 * Header search icon — opens the global Cmd+K palette via custom event so
 * the user gets the typeahead/recent-searches overlay rather than the full
 * /discover page navigation. Falls back to navigation if JS is disabled
 * or the palette mounts after the click.
 */
export function SearchTrigger({
  fallbackHref = '/discover',
  className,
  style,
  children,
  ariaLabel = 'Search',
  title = 'Search (⌘K)',
}: SearchTriggerProps) {
  return (
    <a
      href={fallbackHref}
      aria-label={ariaLabel}
      title={title}
      className={className}
      style={style}
      onClick={(e) => {
        // If the palette is mounted (most cases), prefer the overlay over a
        // full page navigation. Right-click / cmd-click / middle-click still
        // gets the underlying href so power users can open /discover in a
        // new tab.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('ch:open-command-palette'))
      }}
    >
      {children}
    </a>
  )
}
