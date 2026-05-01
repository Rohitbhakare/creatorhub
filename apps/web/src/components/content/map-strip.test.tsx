import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MapStrip } from './map-strip'
import type { PopularCity } from '@/lib/api'

const CITIES: PopularCity[] = [
  { id: 'in.mh.konkan', name: 'Konkan', count: 24 },
  { id: 'in.mh.matheran', name: 'Matheran', count: 14 },
  { id: 'in.ka.bengaluru', name: 'Bengaluru', count: 28 },
  { id: 'in.ko.unknown', name: 'Atlantis', count: 99 }, // not in PIN_POSITIONS — should drop
]

describe('MapStrip', () => {
  it('renders only cities with known pin positions', () => {
    render(<MapStrip cities={CITIES} fromCityName="Mumbai" />)
    expect(screen.getByRole('link', { name: /Konkan.*24/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Matheran.*14/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Bengaluru.*28/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Atlantis/ })).toBeNull()
  })

  it('shows the from-city name in the headline', () => {
    render(<MapStrip cities={CITIES} fromCityName="Mumbai" />)
    expect(screen.getByText(/Trips from/)).toBeInTheDocument()
    expect(screen.getByText('Mumbai')).toBeInTheDocument()
  })

  it('falls back to a generic title when no from-city is supplied', () => {
    render(<MapStrip cities={CITIES} />)
    expect(screen.getByText('Trips by destination')).toBeInTheDocument()
  })

  it('returns null when no cities have known pin positions', () => {
    const { container } = render(<MapStrip cities={[{ id: 'x', name: 'NowhereLand', count: 1 }]} />)
    expect(container.firstChild).toBeNull()
  })

  it('marks "hot" cities with the coral pin variant', () => {
    const { container } = render(<MapStrip cities={CITIES} />)
    // Konkan + Bengaluru are flagged hot in PIN_POSITIONS
    const hotPins = container.querySelectorAll('.ch-map-pin--hot')
    expect(hotPins.length).toBeGreaterThanOrEqual(2)
  })

  it('each pin links to /?city=<name>', () => {
    render(<MapStrip cities={CITIES} />)
    const konkan = screen.getByRole('link', { name: /Konkan/ })
    expect(konkan).toHaveAttribute('href', '/?city=Konkan')
  })
})
