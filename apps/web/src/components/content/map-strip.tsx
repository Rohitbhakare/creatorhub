import Link from 'next/link'
import type { PopularCity } from '@/lib/api'

interface MapStripProps {
  cities: PopularCity[]
  /** Resolved city name for the headline ("Trips from <city>"). */
  fromCityName?: string | null
}

/**
 * v3 magazine map strip — stylised placeholder until E5.3 lands real
 * Mapbox tiles. Renders a 280px-tall gradient backdrop with decorative
 * "topography" SVG lines and chip-style city pins absolute-positioned
 * over it. Pin click filters the feed by city via `?city=` URL param.
 *
 * Locked decision (E5.1 plan §5.3): no real map data here. Real Mapbox
 * integration belongs to the reader epic where the dependency cost is
 * already justified by the polyline-on-scroll feature.
 *
 * Pin positions are hand-tuned to match the v3 wireframe layout. Cities
 * not in the position map are dropped from the map (they still appear
 * in the popular-cities chip rail elsewhere on `/`).
 */
const PIN_POSITIONS: Record<string, { x: number; y: number; hot?: boolean }> = {
  konkan: { x: 28, y: 75, hot: true },
  igatpuri: { x: 18, y: 56 },
  bhandardara: { x: 38, y: 40 },
  velas: { x: 50, y: 70, hot: true },
  matheran: { x: 62, y: 48 },
  pune: { x: 76, y: 62 },
  mahabaleshwar: { x: 88, y: 80 },
  lonavla: { x: 70, y: 45 },
  alibaug: { x: 22, y: 80 },
  goa: { x: 35, y: 95 },
  bengaluru: { x: 58, y: 90, hot: true },
  spiti: { x: 30, y: 18 },
  ladakh: { x: 42, y: 14 },
  hampi: { x: 48, y: 88 },
}

export function MapStrip({ cities, fromCityName }: MapStripProps) {
  const placedCities = cities
    .map((c) => {
      const slug = c.name.toLowerCase().replace(/\s+/g, '')
      const pos = PIN_POSITIONS[slug]
      return pos ? { name: c.name, count: c.count, ...pos } : null
    })
    .filter((c): c is { name: string; count: number; x: number; y: number; hot?: boolean } => c !== null)
    .slice(0, 8)

  if (placedCities.length === 0) return null

  return (
    <section
      aria-label="Map of nearby destinations"
      style={{ maxWidth: 1640, margin: '40px auto 0', padding: '0 32px' }}
    >
      <div className="ch-map-strip">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1200 280"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, opacity: 0.35 }}
          aria-hidden
        >
          <path d="M0,180 Q200,150 400,170 T800,140 T1200,160" stroke="var(--ink)" strokeWidth="0.6" fill="none" />
          <path d="M0,210 Q300,180 600,200 T1200,190" stroke="var(--ink)" strokeWidth="0.4" fill="none" />
          <path d="M0,240 Q250,220 500,235 T1200,220" stroke="var(--ink)" strokeWidth="0.4" fill="none" />
          <path d="M0,90 Q150,60 300,80 T600,70 T900,90 T1200,75" stroke="var(--ink)" strokeWidth="0.4" fill="none" />
        </svg>

        <header className="ch-map-strip__header">
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--ink)',
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Within 6h drive
            </div>
            <h2
              className="ch-display"
              style={{
                margin: 0,
                fontSize: 'clamp(20px, 2.4vw, 26px)',
                color: 'var(--ink)',
                letterSpacing: '-0.015em',
              }}
            >
              {fromCityName ? (
                <>
                  Trips from{' '}
                  <em style={{ fontStyle: 'italic', color: 'var(--primary-text-bg)' }}>{fromCityName}</em>
                </>
              ) : (
                'Trips by destination'
              )}
            </h2>
          </div>
          <Link href="/discover" className="ch-map-strip__cta">
            Open full map
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </header>

        {placedCities.map((p) => (
          <Link
            key={p.name}
            href={`/?city=${encodeURIComponent(p.name)}`}
            className={p.hot ? 'ch-map-pin ch-map-pin--hot' : 'ch-map-pin'}
            style={{ left: `${String(p.x)}%`, top: `${String(p.y)}%` }}
          >
            <span className="ch-map-pin__bubble">
              {p.hot && (
                <span aria-hidden style={{ display: 'inline-flex' }}>
                  <FlameIcon size={10} />
                </span>
              )}
              <span>{p.name}</span>
              <span style={{ opacity: 0.7, fontWeight: 500 }}>· {String(p.count)}</span>
            </span>
            <span aria-hidden className="ch-map-pin__tail" />
          </Link>
        ))}
      </div>
    </section>
  )
}

function FlameIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={Math.round(size * 1.2)} viewBox="0 0 12 14" fill="currentColor" aria-hidden>
      <path d="M6 0c1 2 3 3 3 6 0 1.4-.7 2.6-1.7 3.4 0-.8-.4-1.6-1-2.2.2 1.4-.7 2.6-1.6 3.4-.5.4-.7 1-.7 1.6C2 11.4 1 9.8 1 8.2 1 5.5 3.5 4 5 1.5 5.4 1 5.7.5 6 0z" />
    </svg>
  )
}
