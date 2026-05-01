import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import type * as FramerMotion from 'framer-motion'
import { ConfettiSlot } from './confetti-slot'

const confettiMock = vi.fn()

vi.mock('canvas-confetti', () => ({
  default: confettiMock,
}))

const reducedMotionMock = vi.fn(() => false)
vi.mock('framer-motion', async (orig) => {
  const real = await orig<typeof FramerMotion>()
  return {
    ...real,
    useReducedMotion: () => reducedMotionMock(),
  }
})

describe('ConfettiSlot', () => {
  beforeEach(() => {
    confettiMock.mockClear()
    reducedMotionMock.mockReturnValue(false)
    sessionStorage.clear()
  })

  it('fires canvas-confetti on mount when not reduced-motion', async () => {
    render(<ConfettiSlot bookingId="b1" />)
    // Dynamic import is async; flush microtasks.
    await new Promise((r) => setTimeout(r, 30))
    expect(confettiMock).toHaveBeenCalled()
  })

  it('does not fire when prefers-reduced-motion is set', async () => {
    reducedMotionMock.mockReturnValue(true)
    render(<ConfettiSlot bookingId="b2" />)
    await new Promise((r) => setTimeout(r, 30))
    expect(confettiMock).not.toHaveBeenCalled()
  })

  it('does not re-fire on remount of the same booking ID (sessionStorage one-shot)', async () => {
    const { unmount } = render(<ConfettiSlot bookingId="b3" />)
    await new Promise((r) => setTimeout(r, 30))
    const firstCount = confettiMock.mock.calls.length
    expect(firstCount).toBeGreaterThan(0)
    unmount()
    confettiMock.mockClear()
    render(<ConfettiSlot bookingId="b3" />)
    await new Promise((r) => setTimeout(r, 30))
    expect(confettiMock).not.toHaveBeenCalled()
  })

  it('renders nothing visible (canvas is library-injected)', () => {
    const { container } = render(<ConfettiSlot bookingId="b4" />)
    expect(container.firstChild).toBeNull()
  })
})
