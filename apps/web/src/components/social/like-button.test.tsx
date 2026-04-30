import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, userEvent, waitFor } from '@/test-helpers'
import { LikeButton } from './like-button'

describe('LikeButton', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    )
  })

  it('renders the unfilled heart with no count when initialCount is 0', () => {
    renderWithProviders(<LikeButton contentId="c-1" isAuthenticated={false} />)
    const btn = screen.getByRole('button', { name: 'Like' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    // No count number shown
    expect(btn.textContent?.match(/\d+/)).toBeNull()
  })

  it('renders count beside the heart when initialCount > 0', () => {
    renderWithProviders(
      <LikeButton
        contentId="c-1"
        isAuthenticated={true}
        initialLiked={true}
        initialCount={42}
      />,
    )
    expect(screen.getByRole('button', { name: 'Unlike' })).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('opens sign-in modal for guests with action-specific copy', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <LikeButton
        contentId="c-1"
        contentTitle="Sunrise at Kedarnath"
        isAuthenticated={false}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Like' }))
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Sign in' })).toBeInTheDocument()
    })
    expect(
      screen.getByText(/Like\s+“Sunrise at Kedarnath”/),
    ).toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('flips heart + increments count optimistically for authed users', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <LikeButton
        contentId="c-1"
        isAuthenticated={true}
        initialLiked={false}
        initialCount={5}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Like' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Unlike' })).toBeInTheDocument()
    })
    expect(screen.getByText('6')).toBeInTheDocument()
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/social/like',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ contentId: 'c-1', like: true }),
      }),
    )
  })

  it('reverts the like + count when the API rejects', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 500 }),
    )
    const user = userEvent.setup()
    renderWithProviders(
      <LikeButton
        contentId="c-1"
        isAuthenticated={true}
        initialLiked={false}
        initialCount={5}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Like' }))

    // After failure, the heart reverts to unliked + count back to 5.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Like' })).toBeInTheDocument()
    })
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
