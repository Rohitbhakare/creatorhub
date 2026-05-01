import Link from 'next/link'
import Image from 'next/image'
import type { HandpickedCollection } from '@/lib/api/discover'

interface Props {
  collections: HandpickedCollection[]
}

/**
 * Each collection.kind maps to a preset filter set on /discover/results.
 * Mirrors the templates in apps/api/src/services/discover.service.ts.
 */
function hrefFor(c: HandpickedCollection): string {
  switch (c.kind) {
    case 'popular_in_city': {
      // id is `popular_in_<cityId>` — extract the cityId tail.
      const cityId = c.id.replace(/^popular_in_/, '')
      return `/discover/results?starting_city_id=${encodeURIComponent(cityId)}&sort=trending`
    }
    case 'under_budget':
      return '/discover/results?budget_buckets=lt2k&sort=recent'
    case 'short_reads':
      return '/discover/results?type=post&sort=recent'
    case 'new_voices':
      return '/discover/results?sort=recent'
    default:
      return '/discover/results'
  }
}

export function HandpickedCollectionsRail({ collections }: Props) {
  if (collections.length === 0) return null
  return (
    <section style={{ marginBottom: 40 }}>
      <header style={{ marginBottom: 16 }}>
        <p
          style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--ink-muted)',
            marginBottom: 4,
            fontWeight: 700,
          }}
        >
          Handpicked
        </p>
        <h2 className="ch-display" style={{ fontSize: 22, color: 'var(--ink)' }}>
          Collections worth a look
        </h2>
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16,
        }}
      >
        {collections.map((c) => (
          <Link
            key={c.id}
            href={hrefFor(c)}
            style={{
              display: 'block',
              borderRadius: 14,
              overflow: 'hidden',
              border: '1px solid var(--hairline)',
              background: 'var(--surface)',
              textDecoration: 'none',
              color: 'var(--ink)',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '16 / 10',
                background: 'var(--bg-muted)',
              }}
            >
              {c.coverUrl ? (
                <Image
                  src={c.coverUrl}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 25vw, 90vw"
                  style={{ objectFit: 'cover' }}
                  unoptimized
                />
              ) : null}
            </div>
            <div style={{ padding: '12px 14px' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{c.title}</h3>
              <p style={{ fontSize: 12.5, color: 'var(--ink-muted)', lineHeight: 1.4 }}>
                {c.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
