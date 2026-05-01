import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DiscoverHeader } from './discover-header'

describe('DiscoverHeader', () => {
  it('formats the total count with Indian grouping', () => {
    render(<DiscoverHeader totalCount={12487} citiesCount={24} cityHeadline="Mumbai" />)
    expect(screen.getByText('12,487')).toBeInTheDocument()
  })

  it('shows the city headline when provided', () => {
    render(<DiscoverHeader totalCount={49} citiesCount={7} cityHeadline="Mumbai" />)
    expect(screen.getByText(/from creators near Mumbai/)).toBeInTheDocument()
  })

  it('falls back to "across India" when no city is set', () => {
    render(<DiscoverHeader totalCount={49} citiesCount={7} cityHeadline={null} />)
    expect(screen.getByText(/from creators across India/)).toBeInTheDocument()
  })

  it('singularises the cities label when only one city has content', () => {
    render(<DiscoverHeader totalCount={3} citiesCount={1} cityHeadline={null} />)
    expect(screen.getByText(/^city$/)).toBeInTheDocument()
  })

  it('renders the editorial H1 with the italic accent', () => {
    render(<DiscoverHeader totalCount={49} citiesCount={7} cityHeadline={null} />)
    const h1 = screen.getByRole('heading', { level: 1 })
    expect(h1).toHaveTextContent('Stories worth your weekend.')
    expect(h1.querySelector('em')).not.toBeNull()
  })

  it('renders a "Live" indicator', () => {
    render(<DiscoverHeader totalCount={49} citiesCount={7} cityHeadline="Mumbai" />)
    expect(screen.getByLabelText('Updated live')).toBeInTheDocument()
  })
})
