import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContentCard } from './content-card'
import type { ContentCard as ContentCardModel } from '@/lib/api/types'

const baseCard: ContentCardModel = {
  id: 'c-1',
  slug: null,
  type: 'itinerary',
  title: 'Konkan in 4 Quiet Days',
  summary: 'A road trip through misty hills and quiet beaches.',
  coverImageUrl: null,
  priceInPaisa: 650000,
  isFree: false,
  city: 'Mumbai',
  durationDays: 4,
  rating: 4.7,
  saveCount: 312,
  viewCount: 4521,
  startsAt: null,
  creator: {
    id: 'cr-1',
    username: 'priyasharma',
    displayName: 'Priya Sharma',
    avatarUrl: null,
    vertical: 'travel',
    isVerified: true,
  },
  tags: ['konkan', 'monsoon'],
}

describe('ContentCard', () => {
  it('renders the title, type pill, and creator strip', () => {
    render(<ContentCard content={baseCard} />)
    expect(
      screen.getByRole('heading', { name: 'Konkan in 4 Quiet Days' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Itinerary')).toBeInTheDocument()
    // Creator name appears at least once in the creator strip
    expect(screen.getAllByText('Priya Sharma').length).toBeGreaterThan(0)
  })

  it('shows price for paid content but a Free pill for free content', () => {
    const { rerender } = render(<ContentCard content={baseCard} />)
    expect(screen.queryByText('Free')).toBeNull()
    expect(screen.getByText('₹6,500')).toBeInTheDocument()

    rerender(
      <ContentCard
        content={{ ...baseCard, isFree: true, priceInPaisa: 0 }}
      />,
    )
    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('renders meta row with city, duration, rating, save count', () => {
    render(<ContentCard content={baseCard} />)
    expect(screen.getByText('Mumbai')).toBeInTheDocument()
    expect(screen.getByText('4 days')).toBeInTheDocument()
    expect(screen.getByText('★ 4.7')).toBeInTheDocument()
    expect(screen.getByText('312 saved')).toBeInTheDocument()
  })

  it('renders the verified checkmark when creator is verified', () => {
    render(<ContentCard content={baseCard} />)
    expect(screen.getByLabelText('Verified')).toBeInTheDocument()
  })

  it('renders tags as #-prefixed pills (max 2)', () => {
    render(
      <ContentCard
        content={{ ...baseCard, tags: ['konkan', 'monsoon', 'roadtrip', 'beach'] }}
      />,
    )
    expect(screen.getByText('#konkan')).toBeInTheDocument()
    expect(screen.getByText('#monsoon')).toBeInTheDocument()
    // tags 3 + 4 are dropped — keeps the card calm
    expect(screen.queryByText('#roadtrip')).toBeNull()
    expect(screen.queryByText('#beach')).toBeNull()
  })

  it('formats large save counts compactly', () => {
    render(
      <ContentCard
        content={{ ...baseCard, saveCount: 12_345 }}
      />,
    )
    expect(screen.getByText('12k saved')).toBeInTheDocument()
  })

  it('omits sections that have no data', () => {
    const minimal: ContentCardModel = {
      ...baseCard,
      summary: null,
      city: null,
      durationDays: null,
      rating: null,
      saveCount: null,
      tags: [],
    }
    render(<ContentCard content={minimal} />)
    expect(screen.getByRole('heading', { name: minimal.title })).toBeInTheDocument()
    // None of the optional meta lines render
    expect(screen.queryByText(/days/)).toBeNull()
    expect(screen.queryByText(/★/)).toBeNull()
    expect(screen.queryByText(/saved/)).toBeNull()
    expect(screen.queryByText(/^#/)).toBeNull()
  })

  it('builds the link with slug-prefixed URL when slug is null', () => {
    render(<ContentCard content={baseCard} />)
    const link = screen.getByRole('link', { name: /Konkan in 4 Quiet Days/i })
    expect(link).toHaveAttribute('href', '/content/konkan-in-4-quiet-days-c-1')
  })

  it('uses the API slug when provided (post migration-031)', () => {
    render(
      <ContentCard
        content={{ ...baseCard, slug: 'konkan-in-4-quiet-days' }}
      />,
    )
    const link = screen.getByRole('link', { name: /Konkan in 4 Quiet Days/i })
    expect(link).toHaveAttribute('href', '/content/konkan-in-4-quiet-days')
  })
})
