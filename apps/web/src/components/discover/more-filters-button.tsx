'use client'

import { useFilterSheet } from './filter-sheet-context'

/**
 * Sidebar's "+ More filters" trigger. Replaces the previous `<Link>` to
 * `?filters=open` which caused a 500–1500ms RSC re-render every click in
 * dev mode. Now toggles a context — instant.
 */
export function MoreFiltersButton(): React.ReactElement {
  const { open } = useFilterSheet()
  return (
    <button
      type="button"
      onClick={open}
      style={{
        display: 'block',
        fontSize: 12.5,
        color: 'var(--primary-text-bg)',
        fontWeight: 600,
        textDecoration: 'none',
        padding: 0,
        margin: 0,
        background: 'transparent',
        border: 0,
        cursor: 'pointer',
        fontFamily: 'inherit',
        textAlign: 'left',
      }}
    >
      + More filters
    </button>
  )
}
