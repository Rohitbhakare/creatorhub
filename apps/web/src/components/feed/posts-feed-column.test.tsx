import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PostsFeedColumn } from './posts-feed-column'
import type { ContentCard } from '@/lib/api/types'

const mkPost = (over: Partial<ContentCard> = {}): ContentCard => ({
  id: 'p-1',
  type: 'post',
  title: 'Tunday Kababi at 7am is a different city',
  summary: 'Lucknow at dawn — the cooks rolling galouti as the call to prayer drifts down the gully.',
  coverImageUrl: null,
  priceInPaisa: 0,
  isFree: true,
  city: 'Lucknow',
  tags: [],
  creator: { id: 'u-1', displayName: 'Saanvi K.', username: 'saanvik', avatarUrl: null, vertical: 'travel' },
  ...over,
})

describe('PostsFeedColumn', () => {
  it('shows the empty state when items is empty', () => {
    render(<PostsFeedColumn items={[]} />)
    expect(screen.getByText(/No posts yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to magazine/i })).toBeInTheDocument()
  })

  it('renders one post per item with the right title + creator', () => {
    render(
      <PostsFeedColumn
        items={[
          mkPost(),
          mkPost({ id: 'p-2', title: 'Velas at first light' }),
        ]}
      />,
    )
    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getByText('Tunday Kababi at 7am is a different city')).toBeInTheDocument()
    expect(screen.getByText('Velas at first light')).toBeInTheDocument()
    expect(screen.getAllByText(/Saanvi K\./)).toHaveLength(2)
  })

  it('shows a "Show all →" link only when summary is longer than 200 chars', () => {
    const longSummary = 'a'.repeat(250)
    render(<PostsFeedColumn items={[mkPost({ summary: longSummary })]} />)
    expect(screen.getByRole('link', { name: /Show all/ })).toBeInTheDocument()
  })

  it('omits the show-all link when summary is short', () => {
    render(<PostsFeedColumn items={[mkPost({ summary: 'short' })]} />)
    expect(screen.queryByRole('link', { name: /Show all/ })).toBeNull()
  })

  it('shows the city in the post header when present', () => {
    render(<PostsFeedColumn items={[mkPost({ city: 'Lucknow' })]} />)
    expect(screen.getByText('Lucknow')).toBeInTheDocument()
  })
})
