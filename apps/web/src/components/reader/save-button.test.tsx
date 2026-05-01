import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, userEvent, waitFor } from '@/test-helpers'
import { SaveButton } from './save-button'

describe('SaveButton', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    )
  })

  it('renders default Save state with no count when initialCount is 0', () => {
    renderWithProviders(
      <SaveButton contentId="c-1" isAuthenticated={false} />,
    )
    const btn = screen.getByRole('button', { name: /Save/i })
    expect(btn).toBeInTheDocument()
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    // No "· N" suffix when count is 0
    expect(btn.textContent).not.toMatch(/·\s*\d/)
  })

  it('renders the saved state + running count when initialSaved is true', () => {
    renderWithProviders(
      <SaveButton
        contentId="c-1"
        isAuthenticated={true}
        initialSaved={true}
        initialCount={312}
      />,
    )
    expect(screen.getByRole('button', { name: 'Unsave' })).toBeInTheDocument()
    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByLabelText('312 saves')).toBeInTheDocument()
    expect(screen.getByText(/· 312/)).toBeInTheDocument()
  })

  it('formats large counts with k suffix', () => {
    renderWithProviders(
      <SaveButton
        contentId="c-1"
        isAuthenticated={true}
        initialSaved={true}
        initialCount={1234}
      />,
    )
    expect(screen.getByText(/· 1\.2k/)).toBeInTheDocument()
  })

  it('opens the sign-in modal for guests instead of saving', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <SaveButton
        contentId="c-1"
        contentTitle="Konkan in 4 Quiet Days"
        isAuthenticated={false}
      />,
    )

    await user.click(screen.getByRole('button', { name: /Save/i }))

    // Modal opens with action-specific copy
    await waitFor(() => {
      expect(
        screen.getByRole('dialog', { name: 'Sign in' }),
      ).toBeInTheDocument()
    })
    expect(
      screen.getByText(/Save\s+“Konkan in 4 Quiet Days”/),
    ).toBeInTheDocument()
    // Does NOT call /api/save — guest path stops at the modal
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('truncates long titles in the modal context label', async () => {
    const longTitle =
      'A really very extraordinarily long content title that exceeds forty chars'
    const user = userEvent.setup()
    renderWithProviders(
      <SaveButton
        contentId="c-1"
        contentTitle={longTitle}
        isAuthenticated={false}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Save/i }))
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Sign in' })).toBeInTheDocument()
    })
    // Truncation marker present
    expect(screen.getByText(/Save “.*…”/)).toBeInTheDocument()
  })

  it('optimistically flips state + count on save click for authed users', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <SaveButton
        contentId="c-1"
        isAuthenticated={true}
        initialSaved={false}
        initialCount={10}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Save/i }))

    // Optimistic flip — Saved label + count incremented
    await waitFor(() => {
      expect(screen.getByText('Saved')).toBeInTheDocument()
    })
    expect(screen.getByText(/· 11/)).toBeInTheDocument()

    // Backend was called with the right payload
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/save',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ contentId: 'c-1', save: true }),
      }),
    )
  })

  it('reverts optimistic flip when the API rejects + dispatches an error toast', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 500 }),
    )
    const toastSpy = vi.fn()
    window.addEventListener('ch-toast', (e) => {
      const detail = (e as CustomEvent<{ tone?: string; message?: string }>).detail
      toastSpy(detail)
    })
    const user = userEvent.setup()
    renderWithProviders(
      <SaveButton
        contentId="c-1"
        isAuthenticated={true}
        initialSaved={false}
        initialCount={10}
      />,
    )
    await user.click(screen.getByRole('button', { name: /Save/i }))

    // After the failed roundtrip, state reverts.
    await waitFor(() => {
      expect(screen.getByText('Save')).toBeInTheDocument()
    })
    // Toast event was dispatched on the DOM event bus that <ToastRegion>
    // listens to. We only assert the contract here — visual rendering
    // is covered by toast-region's own tests.
    expect(toastSpy).toHaveBeenCalled()
    const detail = toastSpy.mock.calls[0]?.[0] as { tone?: string; message?: string }
    expect(detail.tone).toBe('error')
    expect(detail.message).toMatch(/Could not save/)
  })
})
