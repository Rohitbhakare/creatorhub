import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InlineSpotCard } from './inline-spot-card'
import type { ItinerarySpot } from '@/lib/api/types'

const SPOT: ItinerarySpot = {
  id: 's1',
  dayNumber: 1,
  orderIndex: 1,
  name: 'Kihim Beach',
  description: 'Empty till the sun leans in. Local Mr. Pendse runs an unlabeled tea stall.',
  lat: null,
  lng: null,
  distanceFromPreviousKm: 12,
  durationFromPreviousMin: 90,
  thumbnailUrl: null,
}

describe('InlineSpotCard', () => {
  it('renders the kicker, title and description', () => {
    render(<InlineSpotCard spot={SPOT} isParentSaved={false} onToggleSave={vi.fn()} />)
    expect(screen.getByText('Stop · Day 1')).toBeInTheDocument()
    expect(screen.getByText('Kihim Beach')).toBeInTheDocument()
    expect(screen.getByText(/Empty till the sun leans in/)).toBeInTheDocument()
  })

  it('renders distance and duration tags when present', () => {
    render(<InlineSpotCard spot={SPOT} isParentSaved={false} onToggleSave={vi.fn()} />)
    expect(screen.getByText(/12 km/)).toBeInTheDocument()
    // 90 min → 2 hr (rounded)
    expect(screen.getByText(/2 hr/)).toBeInTheDocument()
  })

  it('hides tags when distance/duration are null', () => {
    const bare: ItinerarySpot = { ...SPOT, distanceFromPreviousKm: null, durationFromPreviousMin: null }
    render(<InlineSpotCard spot={bare} isParentSaved={false} onToggleSave={vi.fn()} />)
    expect(screen.queryByText(/km/)).not.toBeInTheDocument()
    expect(screen.queryByText(/hr/)).not.toBeInTheDocument()
  })

  it('save button reflects parent-saved state via aria-pressed', () => {
    const { rerender } = render(
      <InlineSpotCard spot={SPOT} isParentSaved={false} onToggleSave={vi.fn()} />,
    )
    expect(screen.getByLabelText('Save')).toHaveAttribute('aria-pressed', 'false')
    rerender(<InlineSpotCard spot={SPOT} isParentSaved={true} onToggleSave={vi.fn()} />)
    expect(screen.getByLabelText('Remove from saved')).toHaveAttribute('aria-pressed', 'true')
  })

  it('clicking the heart calls onToggleSave', async () => {
    const onToggleSave = vi.fn()
    const user = userEvent.setup()
    render(<InlineSpotCard spot={SPOT} isParentSaved={false} onToggleSave={onToggleSave} />)
    await user.click(screen.getByLabelText('Save'))
    expect(onToggleSave).toHaveBeenCalledTimes(1)
  })

  it('renders without a description', () => {
    const noDesc: ItinerarySpot = { ...SPOT, description: null }
    render(<InlineSpotCard spot={noDesc} isParentSaved={false} onToggleSave={vi.fn()} />)
    expect(screen.queryByText(/Empty till the sun/)).not.toBeInTheDocument()
    expect(screen.getByText('Kihim Beach')).toBeInTheDocument()
  })
})
