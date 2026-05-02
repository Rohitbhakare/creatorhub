import Link from 'next/link'

/**
 * 240px sticky filter rail on `/discover` (E5.2 T3).
 *
 * Composition matches v3 wireframe `pack-w-discover.jsx` lines 44–98.
 * Three sections: Type (with counts) · Vibe (top tags) · Distance (km bands).
 * "+ More filters" link is rendered as a plain link to a `?filters=open`
 * URL — the page intercepts that param and mounts the drawer (T7).
 *
 * Server component — every interactive element is a `<Link>` that navigates
 * via URL params. No client state, no hydration cost.
 */
export type DiscoverType = 'all' | 'post' | 'self_paced_itinerary' | 'scheduled_experience' | 'event'

const TYPE_LABELS: Record<DiscoverType, string> = {
  all: 'All',
  post: 'Stories',
  self_paced_itinerary: 'Itineraries',
  scheduled_experience: 'Experiences',
  event: 'Events',
}

const TYPE_ORDER: DiscoverType[] = [
  'all',
  'post',
  'self_paced_itinerary',
  'scheduled_experience',
  'event',
]

const DISTANCE_BANDS: { km: number | null; label: string }[] = [
  { km: 25, label: '25 km' },
  { km: 50, label: '50 km' },
  { km: 100, label: '100 km' },
  { km: 250, label: '250 km' },
  { km: null, label: 'Any' },
]

export interface TypeCounts {
  all: number
  post: number
  self_paced_itinerary: number
  scheduled_experience: number
  event: number
}

interface Props {
  activeType: DiscoverType
  activeVibe: string | null
  activeDistanceKm: number | null
  vibeTags: readonly string[]
  typeCounts: TypeCounts
  /**
   * Plain key/value of the current URL params, used so a Type click preserves
   * the active vibe / distance / sort the user already set.
   */
  baseParams: Record<string, string>
}

function buildHref(base: Record<string, string>, patch: Record<string, string | null>): string {
  const next = new URLSearchParams(base)
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) next.delete(k)
    else next.set(k, v)
  }
  const qs = next.toString()
  return `/discover${qs ? `?${qs}` : ''}`
}

export function DiscoverSidebar({
  activeType,
  activeVibe,
  activeDistanceKm,
  vibeTags,
  typeCounts,
  baseParams,
}: Props) {
  return (
    <aside
      className="ch-discover-sidebar"
      aria-label="Filter results"
      style={{
        position: 'sticky',
        top: 88,
        alignSelf: 'flex-start',
      }}
    >
      <SectionLabel>Type</SectionLabel>
      <ul
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          marginBottom: 28,
        }}
      >
        {TYPE_ORDER.map((id) => {
          const count = typeCounts[id]
          const isActive = id === activeType
          const href = buildHref(baseParams, { type: id === 'all' ? null : id })
          return (
            <li key={id}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md, 10px)',
                  textDecoration: 'none',
                  background: isActive ? 'var(--surface-alt)' : 'transparent',
                  color: isActive ? 'var(--ink)' : 'var(--ink-soft)',
                  fontSize: 13.5,
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                <span>{TYPE_LABELS[id]}</span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, var(--font-sans))',
                    fontSize: 11,
                    color: 'var(--ink-muted)',
                    fontWeight: 500,
                  }}
                >
                  {count}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>

      <SectionLabel>Vibe</SectionLabel>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: 28,
        }}
      >
        {vibeTags.map((tag) => {
          const isActive = activeVibe === tag
          const href = buildHref(baseParams, { vibe: isActive ? null : tag })
          return (
            <Link
              key={tag}
              href={href}
              aria-current={isActive ? 'true' : undefined}
              style={{
                padding: '6px 11px',
                borderRadius: 999,
                textDecoration: 'none',
                background: isActive ? 'var(--ink)' : 'var(--surface)',
                color: isActive ? 'var(--surface)' : 'var(--ink-soft)',
                border: isActive ? 'none' : '1px solid var(--hairline)',
                fontSize: 11.5,
                fontWeight: 500,
              }}
            >
              {tag}
            </Link>
          )
        })}
      </div>

      <SectionLabel>Distance</SectionLabel>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          marginBottom: 22,
        }}
      >
        {DISTANCE_BANDS.map((band) => {
          const isActive =
            (band.km === null && activeDistanceKm === null) || band.km === activeDistanceKm
          const href = buildHref(baseParams, {
            distance_km: band.km === null ? null : String(band.km),
          })
          return (
            <Link
              key={band.label}
              href={href}
              aria-current={isActive ? 'true' : undefined}
              style={{
                padding: '6px 11px',
                borderRadius: 999,
                textDecoration: 'none',
                background: isActive ? 'var(--primary-tint)' : 'var(--surface)',
                color: isActive ? 'var(--primary-deep)' : 'var(--ink-soft)',
                border: isActive
                  ? '1px solid color-mix(in srgb, var(--primary) 33%, transparent)'
                  : '1px solid var(--hairline)',
                fontSize: 11.5,
                fontWeight: isActive ? 700 : 500,
              }}
            >
              {band.label}
            </Link>
          )
        })}
      </div>

      <Link
        href={buildHref(baseParams, { filters: 'open' })}
        style={{
          display: 'block',
          fontSize: 12.5,
          color: 'var(--primary-text-bg)',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        + More filters
      </Link>
    </aside>
  )
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono, var(--font-sans))',
        fontSize: 10,
        color: 'var(--ink-muted)',
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  )
}
