import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Ring } from './ring'

describe('Ring', () => {
  it('clamps progress to [0, 1]', () => {
    const { container, rerender } = render(<Ring progress={1.5} label="ring" />)
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(2)
    // Fill circle (second) — strokeDashoffset should be 0 when progress >= 1
    const offset = (circles[1] as SVGCircleElement).getAttribute('stroke-dashoffset')
    expect(Number(offset)).toBe(0)

    rerender(<Ring progress={-0.5} label="ring" />)
    const c2 = container.querySelectorAll('circle')[1] as SVGCircleElement
    // Negative clamped to 0 → offset == circumference (full circle empty)
    const stroke = c2.getAttribute('stroke-dasharray')
    expect(c2.getAttribute('stroke-dashoffset')).toBe(stroke)
  })

  it('exposes an accessible label when supplied', () => {
    const { getByRole } = render(<Ring progress={0.5} label="3 of 5 quests" />)
    const node = getByRole('img')
    expect(node).toHaveAttribute('aria-label', '3 of 5 quests')
  })

  it('renders center child content', () => {
    const { container } = render(
      <Ring progress={0.5}>
        <span>5</span>
      </Ring>,
    )
    expect(container.textContent).toBe('5')
  })
})
