import Link from 'next/link'

/**
 * Sort tabs above the grid (E5.2 T5).
 *
 * Composition matches v3 wireframe `pack-w-discover.jsx` lines 100–112.
 * Four tabs total — three are wired to API sort values today, the fourth
 * ships with a "Coming soon" badge until the API supports `top_creators`
 * (tracked as E5.2/ENH-001 in tracking.md).
 *
 * "Near me" is a pragmatic mapping over the existing 13-filter API
 * (filters to user's city + sorts by trending). Real `?sort=near` with
 * PostGIS distance ordering is E5.2/ENH-002.
 */
export type SortTabId = 'trending' | 'recent' | 'near' | 'top_creators'

interface Props {
  activeSort: SortTabId
  /** URL params that should be carried over when the tab changes. */
  baseParams: Record<string, string>
  /** Session city — required to enable "Near me". When null the tab is disabled with a tooltip. */
  sessionCityId: string | null
}

const TABS: { id: SortTabId; label: string; comingSoon?: boolean }[] = [
  { id: 'trending', label: 'Trending' },
  { id: 'recent', label: 'Recent' },
  { id: 'near', label: 'Near me' },
  { id: 'top_creators', label: 'Top creators', comingSoon: true },
]

export function DiscoverSortTabs({ activeSort, baseParams, sessionCityId }: Props) {
  const buildHref = (tabId: SortTabId): string => {
    const next = new URLSearchParams(baseParams)
    if (tabId === 'near') {
      // "Near me" is a city filter + trending sort — see ENH-002.
      next.set('sort', 'trending')
      if (sessionCityId) next.set('starting_city_id', sessionCityId)
    } else if (tabId === 'top_creators') {
      // Disabled — link to current state (no-op).
      return `/discover${next.toString() ? `?${next.toString()}` : ''}`
    } else {
      next.set('sort', tabId)
      // Clear the "Near me"-only side-effect if we're switching away from it.
      if (activeSort === 'near') next.delete('starting_city_id')
    }
    const qs = next.toString()
    return `/discover${qs ? `?${qs}` : ''}`
  }

  return (
    <div
      role="tablist"
      aria-label="Sort results"
      style={{
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === activeSort
        const isDisabled =
          tab.comingSoon === true || (tab.id === 'near' && !sessionCityId)
        const href = buildHref(tab.id)

        const baseStyle = {
          padding: '7px 13px',
          borderRadius: 999,
          fontSize: 12.5,
          fontWeight: isActive ? 700 : 500,
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        } as const

        const activeStyle = {
          background: 'var(--primary-tint)',
          color: 'var(--primary-deep)',
          border: '1px solid color-mix(in srgb, var(--primary) 33%, transparent)',
        } as const

        const inactiveStyle = {
          background: 'transparent',
          color: isDisabled ? 'var(--ink-muted)' : 'var(--ink-soft)',
          border: '1px solid var(--hairline)',
          opacity: isDisabled ? 0.55 : 1,
          cursor: isDisabled ? 'not-allowed' : undefined,
        } as const

        const styleMix = isActive ? { ...baseStyle, ...activeStyle } : { ...baseStyle, ...inactiveStyle }

        if (isDisabled) {
          // Render a non-navigating element so the tab is visible but inert.
          return (
            <span
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-disabled
              title={
                tab.comingSoon === true
                  ? 'Coming soon — sorting by top creators is in our roadmap'
                  : 'Set your city to use Near me'
              }
              style={styleMix}
            >
              {tab.label}
              {tab.comingSoon === true && <SoonBadge />}
            </span>
          )
        }

        return (
          <Link
            key={tab.id}
            href={href}
            role="tab"
            aria-selected={isActive}
            style={styleMix}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}

function SoonBadge() {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '2px 6px',
        borderRadius: 4,
        background: 'var(--surface-alt)',
        color: 'var(--ink-muted)',
      }}
    >
      Soon
    </span>
  )
}
