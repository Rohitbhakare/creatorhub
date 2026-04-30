import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen } from '@/test-helpers'
import { GuestRailCard } from './guest-rail-card'

describe('GuestRailCard', () => {
  it('renders the "Browsing as guest" kicker and the broadened title', () => {
    renderWithProviders(<GuestRailCard />)
    expect(screen.getByText('Browsing as guest')).toBeInTheDocument()
    expect(screen.getByText('Save your favourite work')).toBeInTheDocument()
  })

  it('shows a single quiet "Create a free account →" link, not the old Join free + Sign in pair', () => {
    renderWithProviders(<GuestRailCard />)

    // The new design has one link, not two button CTAs.
    const cta = screen.getByRole('link', { name: /Create a free account/i })
    expect(cta).toBeInTheDocument()
    expect(cta).toHaveAttribute('href', '/signup?next=%2F')

    // Regression guard: we deliberately removed these from the right rail.
    expect(screen.queryByRole('link', { name: /^Join free$/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /^Sign in$/i })).toBeNull()
  })

  it('encodes the "next" param so deep-link redirects survive sign-up', () => {
    renderWithProviders(<GuestRailCard next="/content/abc?x=1" />)
    const cta = screen.getByRole('link', { name: /Create a free account/i })
    expect(cta).toHaveAttribute(
      'href',
      '/signup?next=%2Fcontent%2Fabc%3Fx%3D1',
    )
  })
})
