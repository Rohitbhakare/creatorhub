import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EarningsSparkline } from './earnings-sparkline'

const TREND = Array.from({ length: 30 }, (_, i) => ({
  date: `2026-04-${String(i + 1).padStart(2, '0')}`,
  valuePaisa: i === 14 ? 50_000 : 1_000 * (i + 1),
}))

describe('EarningsSparkline', () => {
  it('renders an empty state when trend is empty', () => {
    render(<EarningsSparkline trend={[]} />)
    expect(screen.getByText(/No earnings yet/)).toBeInTheDocument()
  })

  it('renders an svg with a title + desc summarising the trend', () => {
    const { container } = render(<EarningsSparkline trend={TREND} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('role', 'img')
    expect(container.querySelector('title')).toHaveTextContent('30-day earnings')
    const desc = container.querySelector('desc')
    expect(desc?.textContent).toMatch(/total over 30 days/)
    expect(desc?.textContent).toMatch(/Peak: ₹/)
  })

  it('places the peak marker at the highest data point', () => {
    const { container } = render(<EarningsSparkline trend={TREND} />)
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(1)
    // Peak is at index 14 (50_000); verify approximate x position is in the
    // middle of the 30-point series.
    const cx = parseFloat(circles[0]?.getAttribute('cx') ?? '0')
    expect(cx).toBeGreaterThan(300) // > 720/2 - some
    expect(cx).toBeLessThan(420)
  })

  it('plots all data points on the polyline', () => {
    const { container } = render(<EarningsSparkline trend={TREND} />)
    const polyline = container.querySelector('polyline')
    expect(polyline).not.toBeNull()
    const pts = polyline?.getAttribute('points') ?? ''
    expect(pts.split(' ')).toHaveLength(TREND.length)
  })

  it('handles a single-point trend without crashing', () => {
    render(<EarningsSparkline trend={[{ date: '2026-04-15', valuePaisa: 1234 }]} />)
    expect(screen.queryByText(/No earnings yet/)).not.toBeInTheDocument()
  })
})
