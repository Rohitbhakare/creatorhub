import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen, userEvent, waitFor } from '@/test-helpers'
import { GuestGate } from './guest-gate'

describe('GuestGate', () => {
  it('renders children plain when authenticated — no gate, no overlay', () => {
    renderWithProviders(
      <GuestGate
        isAuthenticated={true}
        contextLabel="See Day 2 and the rest of the trip"
      >
        <p>Day 2 secret content</p>
      </GuestGate>,
    )
    expect(screen.getByText('Day 2 secret content')).toBeInTheDocument()
    // No "Members only" CTA when authed
    expect(screen.queryByText(/Members only/i)).toBeNull()
    expect(
      screen.queryByRole('button', { name: /Sign in/i }),
    ).toBeNull()
  })

  it('renders gated children + Members-only CTA for guests in fade mode', () => {
    renderWithProviders(
      <GuestGate
        isAuthenticated={false}
        contextLabel="See Day 2 and the rest of the trip"
        reason="Sign in for the full plan."
        ctaLabel="Sign in to keep reading"
      >
        <p>Day 2 secret content</p>
      </GuestGate>,
    )
    // Children are still in the DOM (so SEO sees them) but visually faded.
    expect(screen.getByText('Day 2 secret content')).toBeInTheDocument()
    expect(screen.getByText(/Members only/i)).toBeInTheDocument()
    expect(
      screen.getByText('See Day 2 and the rest of the trip'),
    ).toBeInTheDocument()
    expect(screen.getByText('Sign in for the full plan.')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Sign in to keep reading' }),
    ).toBeInTheDocument()
  })

  it('opens the sign-in modal when the gate CTA is clicked', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <GuestGate
        isAuthenticated={false}
        contextLabel="See exact venue"
        mode="redact"
      >
        <p>Hidden venue</p>
      </GuestGate>,
    )
    await user.click(screen.getByRole('button', { name: /Sign in to continue/i }))
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Sign in' })).toBeInTheDocument()
    })
    // The modal kicker carries the gate's contextLabel.
    const dialog = screen.getByRole('dialog', { name: 'Sign in' })
    expect(dialog).toHaveTextContent('See exact venue')
  })

  it('default ctaLabel is "Sign in to continue"', () => {
    renderWithProviders(
      <GuestGate
        isAuthenticated={false}
        contextLabel="Anything"
      >
        <p>Body</p>
      </GuestGate>,
    )
    expect(
      screen.getByRole('button', { name: 'Sign in to continue' }),
    ).toBeInTheDocument()
  })
})
