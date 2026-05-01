import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DiscoverSortTabs } from './discover-sort-tabs'

describe('DiscoverSortTabs', () => {
  it('renders the four tabs', () => {
    render(<DiscoverSortTabs activeSort="trending" baseParams={{}} sessionCityId={null} />)
    expect(screen.getByText('Trending')).toBeInTheDocument()
    expect(screen.getByText('Recent')).toBeInTheDocument()
    expect(screen.getByText('Near me')).toBeInTheDocument()
    expect(screen.getByText('Top creators')).toBeInTheDocument()
  })

  it('marks the active tab with aria-selected=true', () => {
    render(<DiscoverSortTabs activeSort="recent" baseParams={{}} sessionCityId={null} />)
    expect(screen.getByText('Recent')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Trending')).toHaveAttribute('aria-selected', 'false')
  })

  it('renders Top creators as disabled with a "Soon" badge', () => {
    render(<DiscoverSortTabs activeSort="trending" baseParams={{}} sessionCityId={null} />)
    const tab = screen.getByText('Top creators')
    expect(tab.tagName).toBe('SPAN')
    expect(tab).toHaveAttribute('aria-disabled')
    expect(screen.getByText('Soon')).toBeInTheDocument()
  })

  it('disables Near me when no session city', () => {
    render(<DiscoverSortTabs activeSort="trending" baseParams={{}} sessionCityId={null} />)
    const tab = screen.getByText('Near me')
    expect(tab.tagName).toBe('SPAN')
    expect(tab).toHaveAttribute('aria-disabled')
  })

  it('Near me is a navigable Link when session city is set', () => {
    render(
      <DiscoverSortTabs
        activeSort="trending"
        baseParams={{ vibe: 'Slow travel' }}
        sessionCityId="in.mh.mumbai"
      />,
    )
    const link = screen.getByText('Near me')
    expect(link.tagName).toBe('A')
    expect(link.getAttribute('href')).toContain('starting_city_id=in.mh.mumbai')
    expect(link.getAttribute('href')).toContain('sort=trending')
    expect(link.getAttribute('href')).toContain('vibe=Slow+travel')
  })

  it('switching away from Near me drops the starting_city_id', () => {
    render(
      <DiscoverSortTabs
        activeSort="near"
        baseParams={{ starting_city_id: 'in.mh.mumbai', sort: 'trending' }}
        sessionCityId="in.mh.mumbai"
      />,
    )
    const trending = screen.getByText('Trending')
    expect(trending.getAttribute('href')).not.toContain('starting_city_id')
  })
})
