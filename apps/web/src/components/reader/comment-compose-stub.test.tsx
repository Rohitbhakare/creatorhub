import { describe, it, expect } from 'vitest'
import { renderWithProviders, screen, userEvent, waitFor } from '@/test-helpers'
import { CommentComposeStub } from './comment-compose-stub'

describe('CommentComposeStub', () => {
  it('renders the "Sign in to comment" stub for guests', () => {
    renderWithProviders(
      <CommentComposeStub contentId="c-1" isAuthenticated={false} />,
    )
    expect(
      screen.getByRole('button', { name: /Sign in to comment/i }),
    ).toBeInTheDocument()
    expect(screen.getByText('Free →')).toBeInTheDocument()
  })

  it('opens the contextual sign-in modal when guest clicks the stub', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <CommentComposeStub
        contentId="c-1"
        contentTitle="Bali in 5 Days"
        isAuthenticated={false}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Sign in to comment/i }))
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Sign in' })).toBeInTheDocument()
    })
    expect(screen.getByText(/Comment on “Bali in 5 Days”/)).toBeInTheDocument()
  })

  it('renders a "Comment box coming soon" placeholder for authed users', () => {
    renderWithProviders(
      <CommentComposeStub contentId="c-1" isAuthenticated={true} />,
    )
    expect(screen.getByText(/Comment box coming soon/)).toBeInTheDocument()
    // No "Sign in to comment" stub when authed
    expect(
      screen.queryByRole('button', { name: /Sign in to comment/i }),
    ).toBeNull()
  })
})
