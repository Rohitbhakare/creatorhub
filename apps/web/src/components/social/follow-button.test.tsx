import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, userEvent, waitFor } from '@/test-helpers'
import { FollowButton } from './follow-button'

describe('FollowButton', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    )
  })

  it('renders Follow with no count when initialFollowerCount is 0', () => {
    renderWithProviders(
      <FollowButton creatorId="cr-1" isAuthenticated={false} />,
    )
    const btn = screen.getByRole('button', { pressed: false })
    expect(btn).toHaveTextContent('Follow')
    // No follower count rendered
    expect(btn.textContent).not.toMatch(/·\s*\d/)
  })

  it('renders "Following ✓" + follower count when already following', () => {
    renderWithProviders(
      <FollowButton
        creatorId="cr-1"
        isAuthenticated={true}
        initialFollowing={true}
        initialFollowerCount={1234}
      />,
    )
    expect(
      screen.getByRole('button', { pressed: true, name: /Following/ }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('1234 followers')).toBeInTheDocument()
    // Format helper truncates to "1.2k"
    expect(screen.getByText(/· 1\.2k/)).toBeInTheDocument()
  })

  it('opens sign-in modal for guests with the creator name in copy', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <FollowButton
        creatorId="cr-1"
        creatorName="Aarav Mehta"
        isAuthenticated={false}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Follow/ }))
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Sign in' })).toBeInTheDocument()
    })
    expect(screen.getByText('Follow Aarav Mehta')).toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('optimistically increments follower count when authed user follows', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <FollowButton
        creatorId="cr-1"
        isAuthenticated={true}
        initialFollowing={false}
        initialFollowerCount={99}
      />,
    )
    // Accessible name is "Follow · 99 · 99 followers" (count + aria-label
    // both contribute) — match by `pressed: false` to find the un-followed
    // button regardless of trailing count text.
    await user.click(screen.getByRole('button', { pressed: false }))

    await waitFor(() => {
      expect(
        screen.getByRole('button', { pressed: true }),
      ).toBeInTheDocument()
    })
    // 99 → 100 — rendered as "· 100" inside the count span.
    expect(screen.getByLabelText('100 followers')).toBeInTheDocument()
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/social/follow',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ creatorId: 'cr-1', follow: true }),
      }),
    )
  })
})
