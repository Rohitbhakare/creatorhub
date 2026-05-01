import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReaderChrome, type ReaderChromeDay } from './reader-chrome'

const DAYS: ReaderChromeDay[] = [
  { day: 1, title: 'The soft start' },
  { day: 2, title: 'The fort that stayed' },
  { day: 3, title: 'Coastal crawl' },
  { day: 4, title: 'The long way home' },
]

describe('ReaderChrome', () => {
  it('renders the back link, day chip, and three toolbar buttons in multi-day mode', () => {
    render(
      <ReaderChrome
        days={DAYS}
        mode="magazine"
        onToggleMode={vi.fn()}
        onToggleSave={vi.fn()}
        isSaved={false}
        onShare={vi.fn()}
      />,
    )
    expect(screen.getByText('All chapters')).toBeInTheDocument()
    expect(screen.getByText(/Day 1 of 4/)).toBeInTheDocument()
    expect(screen.getByText(/The soft start/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Switch to compact mode/)).toBeInTheDocument()
    expect(screen.getByLabelText('Save')).toBeInTheDocument()
    expect(screen.getByLabelText('Share')).toBeInTheDocument()
  })

  it('hides the back link and day chip when not multi-day', () => {
    render(
      <ReaderChrome
        days={[]}
        mode="magazine"
        onToggleMode={vi.fn()}
        onToggleSave={vi.fn()}
        isSaved={false}
        onShare={vi.fn()}
      />,
    )
    expect(screen.queryByText('All chapters')).not.toBeInTheDocument()
    expect(screen.queryByText(/Day \d+ of/)).not.toBeInTheDocument()
  })

  it('marks Aa as pressed in magazine mode and unpressed in compact', () => {
    const { rerender } = render(
      <ReaderChrome
        days={DAYS}
        mode="magazine"
        onToggleMode={vi.fn()}
        onToggleSave={vi.fn()}
        isSaved={false}
        onShare={vi.fn()}
      />,
    )
    expect(screen.getByLabelText(/Switch to compact mode/)).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    rerender(
      <ReaderChrome
        days={DAYS}
        mode="compact"
        onToggleMode={vi.fn()}
        onToggleSave={vi.fn()}
        isSaved={false}
        onShare={vi.fn()}
      />,
    )
    expect(screen.getByLabelText(/Switch to magazine mode/)).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('reflects saved state on the bookmark button', () => {
    const { rerender } = render(
      <ReaderChrome
        days={DAYS}
        mode="magazine"
        onToggleMode={vi.fn()}
        onToggleSave={vi.fn()}
        isSaved={false}
        onShare={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('Save')).toHaveAttribute('aria-pressed', 'false')
    rerender(
      <ReaderChrome
        days={DAYS}
        mode="magazine"
        onToggleMode={vi.fn()}
        onToggleSave={vi.fn()}
        isSaved={true}
        onShare={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('Remove from saved')).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('fires the right callbacks on click', async () => {
    const user = userEvent.setup()
    const onToggleMode = vi.fn()
    const onToggleSave = vi.fn()
    const onShare = vi.fn()
    render(
      <ReaderChrome
        days={DAYS}
        mode="magazine"
        onToggleMode={onToggleMode}
        onToggleSave={onToggleSave}
        isSaved={false}
        onShare={onShare}
      />,
    )
    await user.click(screen.getByLabelText(/Switch to compact mode/))
    await user.click(screen.getByLabelText('Save'))
    await user.click(screen.getByLabelText('Share'))
    expect(onToggleMode).toHaveBeenCalledTimes(1)
    expect(onToggleSave).toHaveBeenCalledTimes(1)
    expect(onShare).toHaveBeenCalledTimes(1)
  })

  it('exposes the day-progress as an accessible progressbar', () => {
    render(
      <ReaderChrome
        days={DAYS}
        mode="magazine"
        onToggleMode={vi.fn()}
        onToggleSave={vi.fn()}
        isSaved={false}
        onShare={vi.fn()}
      />,
    )
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '100')
    expect(bar).toHaveAttribute('aria-valuenow')
  })
})
