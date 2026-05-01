import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DiscoverGrid } from './discover-grid'
import type { ContentCard } from '@/lib/api/types'

function makeItem(i: number): ContentCard {
  return {
    id: `c${String(i)}`,
    type: 'itinerary',
    title: `Story ${String(i)}`,
    summary: null,
    coverImageUrl: null,
    priceInPaisa: 0,
    isFree: true,
    city: 'Mumbai',
    durationDays: null,
    distanceKm: null,
    rating: null,
    saveCount: null,
    viewCount: null,
    startsAt: null,
    tags: [],
  }
}

describe('DiscoverGrid', () => {
  it('shows the empty state with a clear-filters CTA when items is empty', () => {
    render(
      <DiscoverGrid
        items={[]}
        totalCount={0}
        loadMoreHref="/discover/results"
        clearFiltersHref="/discover"
      />,
    )
    expect(screen.getByText(/No stories match/)).toBeInTheDocument()
    expect(screen.getByText('Clear filters').closest('a')).toHaveAttribute(
      'href',
      '/discover',
    )
  })

  it('renders one card per item and uses the dense masonry grid', () => {
    const items = Array.from({ length: 9 }, (_, i) => makeItem(i))
    const { container } = render(
      <DiscoverGrid
        items={items}
        totalCount={9}
        loadMoreHref="/discover/results"
        clearFiltersHref="/discover"
      />,
    )
    const grid = container.querySelector('.ch-discover-grid') as HTMLElement
    expect(grid.style.gridAutoFlow).toBe('dense')
    expect(grid.children).toHaveLength(9)
  })

  it('makes every 5th tile span 2 columns', () => {
    const items = Array.from({ length: 11 }, (_, i) => makeItem(i))
    const { container } = render(
      <DiscoverGrid
        items={items}
        totalCount={11}
        loadMoreHref="/discover/results"
        clearFiltersHref="/discover"
      />,
    )
    const cells = Array.from(
      (container.querySelector('.ch-discover-grid') as HTMLElement).children,
    ) as HTMLElement[]
    expect(cells[0]?.style.gridColumn).toBe('span 2')
    expect(cells[1]?.style.gridColumn).toBe('span 1')
    expect(cells[5]?.style.gridColumn).toBe('span 2')
    expect(cells[10]?.style.gridColumn).toBe('span 2')
  })

  it('hides the Load more CTA when no remaining items', () => {
    const items = Array.from({ length: 5 }, (_, i) => makeItem(i))
    render(
      <DiscoverGrid
        items={items}
        totalCount={5}
        loadMoreHref="/discover/results"
        clearFiltersHref="/discover"
      />,
    )
    expect(screen.queryByText(/Load \d+ more/)).not.toBeInTheDocument()
  })

  it('shows Load N more (capped at 24) when remaining > 0', () => {
    const items = Array.from({ length: 24 }, (_, i) => makeItem(i))
    render(
      <DiscoverGrid
        items={items}
        totalCount={120}
        loadMoreHref="/discover/results?page=2"
        clearFiltersHref="/discover"
      />,
    )
    expect(screen.getByText('Load 24 more').closest('a')).toHaveAttribute(
      'href',
      '/discover/results?page=2',
    )
  })

  it('caps the Load more wording at the actual remaining count', () => {
    const items = Array.from({ length: 24 }, (_, i) => makeItem(i))
    render(
      <DiscoverGrid
        items={items}
        totalCount={29}
        loadMoreHref="/discover/results?page=2"
        clearFiltersHref="/discover"
      />,
    )
    expect(screen.getByText('Load 5 more')).toBeInTheDocument()
  })
})
