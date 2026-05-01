import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DiscoverSidebar, type TypeCounts } from './discover-sidebar'

const COUNTS: TypeCounts = {
  all: 49,
  post: 22,
  self_paced_itinerary: 13,
  scheduled_experience: 7,
  event: 7,
}

const VIBES = ['Konkan', 'Spiti', 'Slow travel', 'Foodie'] as const

describe('DiscoverSidebar', () => {
  it('renders the type pills with counts', () => {
    render(
      <DiscoverSidebar
        activeType="all"
        activeVibe={null}
        activeDistanceKm={null}
        vibeTags={VIBES}
        typeCounts={COUNTS}
        baseParams={{}}
      />,
    )
    expect(screen.getByText('Stories').closest('a')).toHaveAttribute(
      'href',
      '/discover?type=post',
    )
    expect(screen.getByText('22')).toBeInTheDocument()
    expect(screen.getByText('49')).toBeInTheDocument() // all
  })

  it('marks the active type with aria-current=page', () => {
    render(
      <DiscoverSidebar
        activeType="post"
        activeVibe={null}
        activeDistanceKm={null}
        vibeTags={VIBES}
        typeCounts={COUNTS}
        baseParams={{ type: 'post' }}
      />,
    )
    const stories = screen.getByText('Stories').closest('a') as HTMLAnchorElement
    expect(stories).toHaveAttribute('aria-current', 'page')
  })

  it('clicking the active type clears the filter', () => {
    render(
      <DiscoverSidebar
        activeType="post"
        activeVibe={null}
        activeDistanceKm={null}
        vibeTags={VIBES}
        typeCounts={COUNTS}
        baseParams={{ type: 'post' }}
      />,
    )
    // "All" should drop the type param
    const all = screen.getByText('All').closest('a') as HTMLAnchorElement
    expect(all).toHaveAttribute('href', '/discover')
  })

  it('preserves other params when clicking a type pill', () => {
    render(
      <DiscoverSidebar
        activeType="all"
        activeVibe="Slow travel"
        activeDistanceKm={50}
        vibeTags={VIBES}
        typeCounts={COUNTS}
        baseParams={{ vibe: 'Slow travel', distance_km: '50' }}
      />,
    )
    const itin = screen.getByText('Itineraries').closest('a') as HTMLAnchorElement
    const href = itin.getAttribute('href') ?? ''
    expect(href).toContain('vibe=Slow+travel')
    expect(href).toContain('distance_km=50')
    expect(href).toContain('type=self_paced_itinerary')
  })

  it('marks the active vibe pill with aria-pressed=true', () => {
    render(
      <DiscoverSidebar
        activeType="all"
        activeVibe="Slow travel"
        activeDistanceKm={null}
        vibeTags={VIBES}
        typeCounts={COUNTS}
        baseParams={{ vibe: 'Slow travel' }}
      />,
    )
    expect(screen.getByText('Slow travel')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Konkan')).toHaveAttribute('aria-pressed', 'false')
  })

  it('clicking the active vibe drops it', () => {
    render(
      <DiscoverSidebar
        activeType="all"
        activeVibe="Slow travel"
        activeDistanceKm={null}
        vibeTags={VIBES}
        typeCounts={COUNTS}
        baseParams={{ vibe: 'Slow travel' }}
      />,
    )
    const slow = screen.getByText('Slow travel')
    expect(slow.getAttribute('href')).toBe('/discover')
  })

  it('marks the active distance band', () => {
    render(
      <DiscoverSidebar
        activeType="all"
        activeVibe={null}
        activeDistanceKm={100}
        vibeTags={VIBES}
        typeCounts={COUNTS}
        baseParams={{ distance_km: '100' }}
      />,
    )
    expect(screen.getByText('100 km')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('25 km')).toHaveAttribute('aria-pressed', 'false')
  })

  it('"Any" distance corresponds to no distance_km param', () => {
    render(
      <DiscoverSidebar
        activeType="all"
        activeVibe={null}
        activeDistanceKm={null}
        vibeTags={VIBES}
        typeCounts={COUNTS}
        baseParams={{}}
      />,
    )
    expect(screen.getByText('Any')).toHaveAttribute('aria-pressed', 'true')
  })

  it('"+ More filters" link writes ?filters=open', () => {
    render(
      <DiscoverSidebar
        activeType="all"
        activeVibe={null}
        activeDistanceKm={null}
        vibeTags={VIBES}
        typeCounts={COUNTS}
        baseParams={{}}
      />,
    )
    expect(screen.getByText('+ More filters').closest('a')).toHaveAttribute(
      'href',
      '/discover?filters=open',
    )
  })
})
