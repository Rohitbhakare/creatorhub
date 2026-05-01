import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AutosavePill } from './autosave-pill'

describe('AutosavePill', () => {
  it('renders Idle / "Unsaved" before any save', () => {
    render(<AutosavePill state="idle" savedAt={null} />)
    expect(screen.getByText('Unsaved')).toBeInTheDocument()
  })

  it('renders Idle / "All changes saved" once a save has happened', () => {
    render(<AutosavePill state="idle" savedAt={new Date()} />)
    expect(screen.getByText('All changes saved')).toBeInTheDocument()
  })

  it('renders Saving with a pulsing dot', () => {
    render(<AutosavePill state="saving" savedAt={null} />)
    expect(screen.getByText('Saving…')).toBeInTheDocument()
  })

  it('renders Saved with relative time', () => {
    const now = Date.now()
    const fortySecondsAgo = new Date(now - 40_000)
    render(<AutosavePill state="saved" savedAt={fortySecondsAgo} />)
    expect(screen.getByText(/Saved 40s ago/)).toBeInTheDocument()
  })

  it('renders Error with a Retry button', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<AutosavePill state="error" savedAt={null} onRetry={onRetry} />)
    expect(screen.getByText(/Save failed/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders Offline state', () => {
    render(<AutosavePill state="offline" savedAt={null} />)
    expect(screen.getByText(/Offline/)).toBeInTheDocument()
  })

  it('uses role=status with aria-live=polite', () => {
    render(<AutosavePill state="saving" savedAt={null} />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })
})
