import { ContentCard } from './content-card'
import { ContentGrid } from './content-grid'
import { SectionHeader } from '../ui/section-header'
import type { FeedSection } from '@/lib/api/types'

interface SectionRailProps {
  section: FeedSection
  variant?: 'rail' | 'grid'
}

export function SectionRail({ section, variant = 'rail' }: SectionRailProps) {
  return (
    <section style={{ marginTop: 56 }}>
      <SectionHeader
        {...(section.subtitle ? { kicker: section.subtitle } : {})}
        title={section.title}
        seeAllHref={`/discover?section=${encodeURIComponent(section.id)}`}
      />
      {variant === 'grid' ? (
        <ContentGrid items={section.items} limit={6} />
      ) : (
        <div
          style={{
            display: 'grid',
            gridAutoFlow: 'column',
            gridAutoColumns: 'minmax(min(280px, 80vw), 320px)',
            gap: 'clamp(16px, 2.5vw, 24px)',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            paddingBottom: 4,
            margin: '0 calc(var(--ch-page-pad, 0px) * -1)',
          }}
        >
          {section.items.map((item) => (
            <div key={item.id} style={{ scrollSnapAlign: 'start' }}>
              <ContentCard content={item} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
