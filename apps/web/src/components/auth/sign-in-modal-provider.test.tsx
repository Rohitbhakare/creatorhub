import { describe, it, expect } from 'vitest'
import { render, screen, userEvent, waitFor } from '@/test-helpers'
import { SignInModalProvider, useSignInModal } from './sign-in-modal-provider'

function Trigger() {
  const { openSignInModal, isOpen } = useSignInModal()
  return (
    <>
      <span data-testid="open-flag">{isOpen ? 'open' : 'closed'}</span>
      <button
        type="button"
        onClick={() => {
          openSignInModal({
            contextLabel: 'Save “Konkan in 4 Quiet Days”',
            reason: 'A reason',
          })
        }}
      >
        Open
      </button>
    </>
  )
}

describe('SignInModalProvider', () => {
  it('starts closed and opens when openSignInModal is called', async () => {
    render(
      <SignInModalProvider>
        <Trigger />
      </SignInModalProvider>,
    )
    const user = userEvent.setup()

    expect(screen.getByTestId('open-flag')).toHaveTextContent('closed')
    expect(screen.queryByRole('dialog', { name: 'Sign in' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Open' }))

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Sign in' })).toBeInTheDocument()
    })
    expect(screen.getByTestId('open-flag')).toHaveTextContent('open')
    expect(
      screen.getByText('Save “Konkan in 4 Quiet Days”'),
    ).toBeInTheDocument()
    expect(screen.getByText('A reason')).toBeInTheDocument()
  })

  it('returns a no-op opener when used without the Provider (graceful fallback)', () => {
    // Rendering Trigger directly — without Provider — should still render.
    // The hook returns a no-op openSignInModal so callers don't crash.
    render(<Trigger />)
    expect(screen.getByTestId('open-flag')).toHaveTextContent('closed')
    // No throw here even though there's no Provider in the tree.
  })

  it('closes when the modal X button is clicked', async () => {
    render(
      <SignInModalProvider>
        <Trigger />
      </SignInModalProvider>,
    )
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Open' }))
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Sign in' })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Close' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Sign in' })).toBeNull()
    })
  })
})
