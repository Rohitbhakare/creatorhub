import Link from 'next/link'
import { ContentCard } from './content-card'
import type { FeedSection } from '@/lib/api/types'

interface SectionRailProps {
  section: FeedSection
  variant?: 'rail' | 'grid'
}

export function SectionRail({ section, variant = 'rail' }: SectionRailProps) {
  if (variant === 'grid') {
    return (
      <section style={{ marginTop: 56 }}>
        <SectionHeader section={section} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 32,
          }}
        >
          {section.items.slice(0, 6).map((item) => (
            <ContentCard key={item.id} content={item} />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section style={{ marginTop: 56 }}>
      <SectionHeader section={section} />
      <div
        style={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridAutoColumns: 'minmax(280px, 320px)',
          gap: 24,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          paddingBottom: 4,
          margin: '0 -32px',
          padding: '0 32px',
        }}
      >
        {section.items.map((item) => (
          <div key={item.id} style={{ scrollSnapAlign: 'start' }}>
            <ContentCard content={item} />
          </div>
        ))}
      </div>
    </section>
  )
}

function SectionHeader({ section }: { section: FeedSection }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 16,
      }}
    >
      <div>
        {section.subtitle && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--ink-muted)',
              display: 'block',
              marginBottom: 8,
            }}
          >
            {section.subtitle}
          </span>
        )}
        <h2
          className="ch-display"
          style={{ fontSize: 30, color: 'var(--ink)', margin: 0, lineHeight: 1.1 }}
        >
          {section.title}
        </h2>
      </div>
      <Link
        href={`/discover?section=${encodeURIComponent(section.id)}`}
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--ink-soft)',
          textDecoration: 'none',
          flex: '0 0 auto',
        }}
      >
        See all →
      </Link>
    </div>
  )
}
