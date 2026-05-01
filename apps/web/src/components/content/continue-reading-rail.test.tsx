import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContinueReadingRail, type ContinueReadingItem } from './continue-reading-rail'
import type { ContentCard } from '@/lib/api/types'

const mkItem = (over: Partial<ContinueReadingItem & { content: ContentCard }> = {}): ContinueReadingItem => ({
  content: {
    id: 'c-1',
    type: 'itinerary',
    title: 'Konkan in 4 Quiet Days',
    coverImageUrl: null,
    priceInPaisa: 0,
    isFree: true,
    creator: { id: 'u', displayName: 'Aanya R.', username: 'aanyar', avatarUrl: null, vertical: 'travel' },
    tags: [],
    ...over.content,
  } as ContentCard,
  progress: over.progress ?? 0.5,
  position: over.position ?? 'Ch. 2 of 4 · Velas at first light',
})

describe('ContinueReadingRail', () => {
  it('renders nothing on empty input', () => {
    const { container } = render(<ContinueReadingRail items={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders one card per item', () => {
    render(
      <ContinueReadingRail
        items={[
          mkItem(),
          mkItem({ content: { id: 'c-2', title: 'Spiti Routes — 2026' } as ContentCard }),
        ]}
      />,
    )
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('shows percent-read derived from progress and clamps out-of-range values', () => {
    render(<ContinueReadingRail items={[mkItem({ progress: 0.5 })]} />)
    expect(screen.getByText('50% read')).toBeInTheDocument()
  })

  it('clamps progress > 1 to 100% and < 0 to 0%', () => {
    const { rerender } = render(<ContinueReadingRail items={[mkItem({ progress: 1.5 })]} />)
    expect(screen.getByText('100% read')).toBeInTheDocument()
    rerender(<ContinueReadingRail items={[mkItem({ progress: -0.2 })]} />)
    expect(screen.getByText('0% read')).toBeInTheDocument()
  })

  it('headline is singular for one item, plural otherwise', () => {
    const { rerender } = render(<ContinueReadingRail items={[mkItem()]} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('One story')
    rerender(<ContinueReadingRail items={[mkItem(), mkItem({ content: { id: 'c-2' } as ContentCard })]} />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toContain('2 stories')
  })

  it('shows position label + creator name on each card', () => {
    render(<ContinueReadingRail items={[mkItem()]} />)
    expect(screen.getByText(/Aanya R\..*Velas at first light/)).toBeInTheDocument()
  })
})
