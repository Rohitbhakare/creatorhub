import { ContentCard } from './content-card'
import { ContentGrid } from './content-grid'
import { RailScroller } from './rail-scroller'
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
        <RailScroller ariaLabel={section.title}>
          {section.items.map((item) => (
            <div key={item.id} style={{ scrollSnapAlign: 'start' }}>
              <ContentCard content={item} />
            </div>
          ))}
        </RailScroller>
      )}
    </section>
  )
}
