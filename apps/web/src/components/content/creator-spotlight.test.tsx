import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CreatorSpotlight } from './creator-spotlight'
import type { ContentCard } from '@/lib/api/types'

const CREATOR = {
  id: 'u-1',
  displayName: 'Aanya Ravi',
  username: 'aanyar',
  avatarUrl: null,
  city: 'Mumbai',
  followerCount: 2400,
  contentCount: 18,
  isVerified: true,
}

const FEATURED: ContentCard = {
  id: 'c-1',
  type: 'itinerary',
  title: 'Konkan in monsoon — empty roads',
  summary: '4 chapters · 312 km · 1 booking-ready stop with a fisherman family.',
  coverImageUrl: null,
  priceInPaisa: 0,
  isFree: true,
  city: 'Mumbai',
  tags: [],
}

describe('CreatorSpotlight', () => {
  it('renders the creator name + verified check + featured content title', () => {
    render(<CreatorSpotlight creator={CREATOR} featuredContent={FEATURED} />)
    expect(screen.getByText('Aanya Ravi')).toBeInTheDocument()
    expect(screen.getByLabelText('verified')).toBeInTheDocument()
    expect(screen.getByText('Konkan in monsoon — empty roads')).toBeInTheDocument()
  })

  it('formats follower count with k-suffix', () => {
    render(<CreatorSpotlight creator={CREATOR} featuredContent={FEATURED} />)
    expect(screen.getByText(/2\.4k followers/)).toBeInTheDocument()
  })

  it('exposes a "Read story" link to the featured content + a "View profile" link', () => {
    render(<CreatorSpotlight creator={CREATOR} featuredContent={FEATURED} />)
    const read = screen.getByRole('link', { name: /Read story/ })
    const profile = screen.getByRole('link', { name: /View profile/ })
    expect(read).toHaveAttribute('href', '/content/c-1')
    expect(profile).toHaveAttribute('href', '/u/aanyar')
  })

  it('applies a tilt transform on mouse move (within ±2°×2 = ±4° per axis)', () => {
    const { container } = render(<CreatorSpotlight creator={CREATOR} featuredContent={FEATURED} />)
    const spotlight = container.querySelector('.ch-spotlight') as HTMLElement
    // Force a layout: set bounding rect and dispatch mouseMove.
    spotlight.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 400, bottom: 200, width: 400, height: 200, x: 0, y: 0, toJSON: () => '' }) as DOMRect
    fireEvent.mouseMove(spotlight, { clientX: 300, clientY: 50 })
    expect(spotlight.style.transform).toMatch(/perspective\(1200px\) rotateY\([-0-9.]+deg\) rotateX\([-0-9.]+deg\)/)
  })

  it('resets tilt on mouse leave', () => {
    const { container } = render(<CreatorSpotlight creator={CREATOR} featuredContent={FEATURED} />)
    const spotlight = container.querySelector('.ch-spotlight') as HTMLElement
    spotlight.getBoundingClientRect = () =>
      ({ left: 0, top: 0, right: 400, bottom: 200, width: 400, height: 200, x: 0, y: 0, toJSON: () => '' }) as DOMRect
    fireEvent.mouseMove(spotlight, { clientX: 350, clientY: 180 })
    fireEvent.mouseLeave(spotlight)
    expect(spotlight.style.transform).toMatch(/rotateY\(0deg\) rotateX\(0deg\)/)
  })
})
