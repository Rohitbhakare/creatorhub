import Link from 'next/link'
import Image from 'next/image'
import type { DiscoverExperience } from '@/lib/api/discover'
import { formatPrice } from '@/lib/format'
import { contentSlugId } from '@/lib/slug'

interface Props {
  experiences: DiscoverExperience[]
}

function formatNextDate(iso: string | null): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return null
  }
}

export function UpcomingExperiencesRail({ experiences }: Props) {
  if (experiences.length === 0) return null
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
          Live experiences
        </p>
        <h2 className="ch-display" style={{ fontSize: 22, color: 'var(--ink)' }}>
          Upcoming this season
        </h2>
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16,
        }}
      >
        {experiences.map((e) => {
          const isFree = e.pricingModel === 'free' || e.pricePaisa === 0
          const date = formatNextDate(e.nextDate)
          return (
            <Link
              key={e.id}
              href={`/content/${contentSlugId(e.title, e.id)}`}
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
                  aspectRatio: '4 / 3',
                  background: 'var(--bg-muted)',
                }}
              >
                {e.coverImageUrl ? (
                  <Image
                    src={e.coverImageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 25vw, 90vw"
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                ) : null}
              </div>
              <div style={{ padding: '12px 14px' }}>
                <h3
                  style={{
                    fontSize: 14.5,
                    fontWeight: 600,
                    marginBottom: 4,
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {e.title}
                </h3>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12.5,
                    color: 'var(--ink-muted)',
                  }}
                >
                  <span>
                    {e.cityName ?? 'India'}
                    {date ? ` · ${date}` : ''}
                  </span>
                  <span style={{ color: 'var(--ink)', fontWeight: 600 }}>
                    {formatPrice(e.pricePaisa, isFree)}
                  </span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
