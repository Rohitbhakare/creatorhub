/**
 * Editorial header for /discover (E5.2 T2).
 *
 * Composition matches v3 wireframe `pack-w-discover.jsx` lines 31–42:
 *   coral mono kicker (DISCOVER) → display H1 with italic accent →
 *   live-stats line ({totalCount} from creators near {city} · {citiesCount} cities · ● Live).
 *
 * Server component — all stats are resolved upstream in `page.tsx` so the
 * header renders once during SSR with no client-side fetches or hydration.
 */
interface Props {
  totalCount: number
  citiesCount: number
  cityHeadline: string | null
}

export function DiscoverHeader({ totalCount, citiesCount, cityHeadline }: Props) {
  const formattedCount = totalCount.toLocaleString('en-IN')
  return (
    <section
      style={{
        maxWidth: 1640,
        margin: '0 auto',
        padding: '40px 32px 0',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono, var(--font-sans))',
          fontSize: 11,
          color: 'var(--primary)',
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          marginBottom: 10,
        }}
      >
        Discover
      </div>
      <h1
        className="ch-display"
        style={{
          margin: 0,
          fontSize: 'clamp(34px, 5vw, 56px)',
          lineHeight: 1.02,
          fontWeight: 600,
          letterSpacing: '-0.025em',
          color: 'var(--ink)',
        }}
      >
        Stories worth{' '}
        <em style={{ fontStyle: 'italic', color: 'var(--primary)' }}>your weekend.</em>
      </h1>
      <div
        style={{
          marginTop: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          fontSize: 13.5,
          color: 'var(--ink-muted)',
        }}
      >
        <span>
          <strong style={{ color: 'var(--ink)' }}>{formattedCount}</strong>{' '}
          {cityHeadline ? `from creators near ${cityHeadline}` : 'from creators across India'}
        </span>
        <span aria-hidden>·</span>
        <span>
          <strong style={{ color: 'var(--ink)' }}>{citiesCount}</strong>{' '}
          {citiesCount === 1 ? 'city' : 'cities'}
        </span>
        <span aria-hidden>·</span>
        <span
          aria-label="Updated live"
          style={{ color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span
            aria-hidden
            style={{
              display: 'inline-block',
              width: 7,
              height: 7,
              borderRadius: 999,
              background: 'var(--primary)',
            }}
          />
          Live
        </span>
      </div>
    </section>
  )
}
