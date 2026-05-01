import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SeatAvailabilityStream } from './seat-availability-stream'

class MockEventSource {
  url: string
  listeners: Record<string, ((e: MessageEvent) => void)[]> = {}
  onerror: (() => void) | null = null
  closed = false
  constructor(url: string) {
    this.url = url
  }
  addEventListener(name: string, cb: (e: MessageEvent) => void): void {
    ;(this.listeners[name] ??= []).push(cb)
  }
  emit(name: string, data: unknown): void {
    const evt = new MessageEvent(name, { data: JSON.stringify(data) })
    for (const cb of this.listeners[name] ?? []) cb(evt)
  }
  close(): void {
    this.closed = true
  }
}

describe('SeatAvailabilityStream', () => {
  it('renders the initial seats-left snapshot before any SSE events arrive', () => {
    const original = globalThis.EventSource
    Object.defineProperty(globalThis, 'EventSource', { value: MockEventSource, configurable: true, writable: true })
    render(
      <SeatAvailabilityStream
        dateId="d1"
        initialSeatsLeft={5}
        initialCapacity={10}
      />,
    )
    expect(screen.getByText('5 of 10 seats left')).toBeInTheDocument()
    Object.defineProperty(globalThis, 'EventSource', { value: original, configurable: true, writable: true })
  })

  it('renders sold-out label when capacity is fully booked', () => {
    Object.defineProperty(globalThis, 'EventSource', { value: MockEventSource, configurable: true, writable: true })
    render(
      <SeatAvailabilityStream
        dateId="d2"
        initialSeatsLeft={0}
        initialCapacity={10}
      />,
    )
    expect(screen.getByText('Sold out')).toBeInTheDocument()
  })

  it('marks the pill as offline when EventSource is unavailable', () => {
    const original = globalThis.EventSource
    Object.defineProperty(globalThis, 'EventSource', { value: undefined, configurable: true, writable: true })
    render(
      <SeatAvailabilityStream
        dateId="d3"
        initialSeatsLeft={3}
        initialCapacity={10}
      />,
    )
    // Component still renders, just doesn't open a connection.
    expect(screen.getByRole('status')).toBeInTheDocument()
    Object.defineProperty(globalThis, 'EventSource', { value: original, configurable: true, writable: true })
  })

  it('classifies seats-left ratio into status colors via initial state', () => {
    Object.defineProperty(globalThis, 'EventSource', { value: MockEventSource, configurable: true, writable: true })
    const { unmount: u1 } = render(
      <SeatAvailabilityStream dateId="d4" initialSeatsLeft={9} initialCapacity={10} />,
    )
    expect(screen.getByText('9 of 10 seats left')).toBeInTheDocument()
    u1()
    const { unmount: u2 } = render(
      <SeatAvailabilityStream dateId="d5" initialSeatsLeft={3} initialCapacity={10} />,
    )
    expect(screen.getByText('3 of 10 seats left')).toBeInTheDocument()
    u2()
    render(<SeatAvailabilityStream dateId="d6" initialSeatsLeft={0} initialCapacity={10} />)
    expect(screen.getByText('Sold out')).toBeInTheDocument()
  })

  it('uses aria-live="polite" so SR announces seat changes', () => {
    Object.defineProperty(globalThis, 'EventSource', { value: MockEventSource, configurable: true, writable: true })
    render(
      <SeatAvailabilityStream dateId="d7" initialSeatsLeft={3} initialCapacity={10} />,
    )
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })
})
