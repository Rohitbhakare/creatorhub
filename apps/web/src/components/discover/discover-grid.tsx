import Link from 'next/link'
import type { ContentCard as ContentCardModel } from '@/lib/api/types'
import { ContentCard } from '@/components/content/content-card'

/**
 * 3-column masonry grid for /discover (E5.2 T4).
 *
 * Composition matches v3 wireframe `pack-w-discover.jsx` lines 100–142.
 * Uses `grid-template-columns: repeat(3, 1fr)` + `grid-auto-flow: dense`
 * with select tiles spanning 2 columns to give an editorial rhythm.
 *
 * Server component. Stable spanning rule (`every 5th index`) so SSR ↔ CSR
 * never mismatch — important because `/discover` is heavily indexed by
 * crawlers and we don't want layout shifts on hydration.
 */
interface Props {
  items: ContentCardModel[]
  /** Total result count from the API (for the "Load N more" wording). */
  totalCount: number | null
  /** URL the "Load more" CTA navigates to, with current filter set carried over. */
  loadMoreHref: string
  /** Empty-state CTA url (typically `/discover` with all filters cleared). */
  clearFiltersHref: string
}

/** Span-2 every 5th tile (index 0, 5, 10, …) — gives magazine rhythm. */
function shouldSpan2(index: number): boolean {
  return index % 5 === 0
}

export function DiscoverGrid({ items, totalCount, loadMoreHref, clearFiltersHref }: Props) {
  if (items.length === 0) {
    return (
      <div
        role="status"
        style={{
          padding: '60px 24px',
          textAlign: 'center',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-md, 12px)',
          border: '1px solid var(--hairline)',
        }}
      >
        <p
          className="ch-display"
          style={{ margin: 0, fontSize: 22, color: 'var(--ink)' }}
        >
          No stories match these filters yet.
        </p>
        <p
          style={{
            margin: '10px 0 18px',
            color: 'var(--ink-muted)',
            fontSize: 13.5,
          }}
        >
          Try a different vibe, widen the distance, or clear filters to see everything.
        </p>
        <Link
          href={clearFiltersHref}
          className="ch-btn ch-btn-primary"
          style={{ padding: '10px 20px' }}
        >
          Clear filters
        </Link>
      </div>
    )
  }

  const remaining =
    typeof totalCount === 'number' ? Math.max(0, totalCount - items.length) : null

  return (
    <>
      <div
        className="ch-discover-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridAutoFlow: 'dense',
          gap: 20,
        }}
      >
        {items.map((item, i) => {
          const span2 = shouldSpan2(i)
          return (
            <div
              key={item.id}
              style={{
                gridColumn: span2 ? 'span 2' : 'span 1',
              }}
            >
              <ContentCard content={item} variant="grid" hero={span2} />
            </div>
          )
        })}
      </div>

      {remaining !== null && remaining > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 36 }}>
          <Link
            href={loadMoreHref}
            className="ch-btn ch-btn-ink"
            style={{ padding: '12px 28px', fontSize: 13.5 }}
          >
            Load {Math.min(24, remaining)} more
          </Link>
        </div>
      )}
    </>
  )
}
