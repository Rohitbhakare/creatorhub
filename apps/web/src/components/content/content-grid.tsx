import { ContentCard } from './content-card'
import type { ContentCard as ContentCardModel } from '@/lib/api/types'

interface ContentGridProps {
  items: ContentCardModel[]
  /** Min card width — controls the auto-fill column count. */
  minCard?: number
  /** Cap on number of items to render. */
  limit?: number
}

/**
 * Responsive auto-fill grid for content cards. Used by section rails,
 * search results, saved page, mini-site content list — single source for
 * the spacing/density rules so they stay in sync.
 */
export function ContentGrid({ items, minCard = 280, limit }: ContentGridProps) {
  const list = limit ? items.slice(0, limit) : items
  if (list.length === 0) return null

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${String(minCard)}px, 1fr))`,
        gap: 'clamp(16px, 3vw, 32px)',
      }}
    >
      {list.map((item) => (
        <ContentCard key={item.id} content={item} />
      ))}
    </div>
  )
}
