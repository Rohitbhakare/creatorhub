import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DualMonthCalendar, type ScheduledDateRef } from './dual-month-calendar'

// Pin a stable "now" so the tests don't drift over time.
const NOW = new Date('2026-05-15T10:00:00+05:30')

const DATES: ScheduledDateRef[] = [
  // May 20: available
  { id: 'd-may20', startsAt: '2026-05-20T08:00:00+05:30', capacity: 10, seatsBooked: 3 },
  // May 25: sold out
  { id: 'd-may25', startsAt: '2026-05-25T08:00:00+05:30', capacity: 5, seatsBooked: 5 },
  // June 5: available, in next month (visible in dual-month view)
  { id: 'd-jun5', startsAt: '2026-06-05T08:00:00+05:30', capacity: 8, seatsBooked: 1 },
  // April 30: past
  { id: 'd-apr30', startsAt: '2026-04-30T08:00:00+05:30', capacity: 5, seatsBooked: 0 },
]

describe('DualMonthCalendar', () => {
  it('renders the current and next month side-by-side', () => {
    render(<DualMonthCalendar scheduledDates={DATES} now={NOW} onPick={vi.fn()} />)
    expect(screen.getByLabelText('May 2026')).toBeInTheDocument()
    expect(screen.getByLabelText('June 2026')).toBeInTheDocument()
  })

  it('falls back to a single month when singleMonth is set', () => {
    render(<DualMonthCalendar scheduledDates={DATES} now={NOW} onPick={vi.fn()} singleMonth />)
    expect(screen.getByLabelText('May 2026')).toBeInTheDocument()
    expect(screen.queryByLabelText('June 2026')).not.toBeInTheDocument()
  })

  it('disables past, sold-out, and non-scheduled days', () => {
    render(<DualMonthCalendar scheduledDates={DATES} now={NOW} onPick={vi.fn()} />)
    // Available date (May 20) — clickable
    const may20 = screen.getByLabelText(/Wednesday, 20 May.*7 seats left/)
    expect(may20).toHaveAttribute('aria-disabled', 'false')
    // Sold-out date (May 25)
    const may25 = screen.getByLabelText(/Monday, 25 May.*sold out/)
    expect(may25).toHaveAttribute('aria-disabled', 'true')
    // Non-scheduled date — pick a random May day with no scheduled date
    const may18 = screen.getByLabelText(/Monday, 18 May.*not available/)
    expect(may18).toHaveAttribute('aria-disabled', 'true')
  })

  it('clicking an available day calls onPick with the date id', async () => {
    const onPick = vi.fn()
    const user = userEvent.setup()
    render(<DualMonthCalendar scheduledDates={DATES} now={NOW} onPick={onPick} />)
    await user.click(screen.getByLabelText(/Wednesday, 20 May/))
    expect(onPick).toHaveBeenCalledWith('d-may20')
  })

  it('does not fire onPick on a sold-out date click', async () => {
    const onPick = vi.fn()
    const user = userEvent.setup()
    render(<DualMonthCalendar scheduledDates={DATES} now={NOW} onPick={onPick} />)
    await user.click(screen.getByLabelText(/Monday, 25 May/))
    expect(onPick).not.toHaveBeenCalled()
  })

  it('navigates months with the prev/next arrows', async () => {
    const user = userEvent.setup()
    render(<DualMonthCalendar scheduledDates={DATES} now={NOW} onPick={vi.fn()} />)
    // Start: May/June. Click "next" → Jun/Jul.
    await user.click(screen.getByLabelText('Next month'))
    expect(screen.getByLabelText('June 2026')).toBeInTheDocument()
    expect(screen.getByLabelText('July 2026')).toBeInTheDocument()
    // Click "prev" twice → Apr/May.
    await user.click(screen.getByLabelText('Previous month'))
    await user.click(screen.getByLabelText('Previous month'))
    expect(screen.getByLabelText('April 2026')).toBeInTheDocument()
    expect(screen.getByLabelText('May 2026')).toBeInTheDocument()
  })

  it('arrow-key keyboard nav moves the focused day', async () => {
    const user = userEvent.setup()
    render(<DualMonthCalendar scheduledDates={DATES} now={NOW} onPick={vi.fn()} />)
    // Initial focus should be on the first available date (May 20).
    const initial = screen.getByLabelText(/Wednesday, 20 May/)
    initial.focus()
    expect(initial).toHaveFocus()
    // Right arrow → May 21
    await user.keyboard('{ArrowRight}')
    expect(screen.getByLabelText(/Thursday, 21 May.*not available/)).toHaveFocus()
    // Down arrow → May 28 (+7 days)
    await user.keyboard('{ArrowDown}')
    expect(screen.getByLabelText(/Thursday, 28 May/)).toHaveFocus()
  })

  it('Enter on an available focused day picks it', async () => {
    const onPick = vi.fn()
    const user = userEvent.setup()
    render(<DualMonthCalendar scheduledDates={DATES} now={NOW} onPick={onPick} />)
    const may20 = screen.getByLabelText(/Wednesday, 20 May/)
    may20.focus()
    await user.keyboard('{Enter}')
    expect(onPick).toHaveBeenCalledWith('d-may20')
  })

  it('renders day-of-week headers', () => {
    render(<DualMonthCalendar scheduledDates={DATES} now={NOW} onPick={vi.fn()} />)
    const may = screen.getByLabelText('May 2026')
    expect(within(may).getByText('Mo')).toBeInTheDocument()
    expect(within(may).getByText('Su')).toBeInTheDocument()
  })
})
