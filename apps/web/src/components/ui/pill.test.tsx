import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Pill } from './pill'

describe('Pill', () => {
  it('applies the default ch-pill class', () => {
    const { container } = render(<Pill>POST</Pill>)
    const span = container.firstChild as HTMLElement
    expect(span.className).toContain('ch-pill')
    expect(span.className).not.toContain('ch-pill-coral')
  })

  it.each(['coral', 'glass', 'tint', 'ink'] as const)('applies the %s variant class', (v) => {
    const { container } = render(<Pill variant={v}>X</Pill>)
    const span = container.firstChild as HTMLElement
    expect(span.className).toContain(`ch-pill-${v}`)
  })

  it('renders a leading dot when dot prop is set', () => {
    const { container } = render(<Pill dot>Live</Pill>)
    const span = container.firstChild as HTMLElement
    // First child of the pill is the dot span
    expect(span.children).toHaveLength(1)
    const dot = span.children[0] as HTMLElement
    expect(dot.style.borderRadius).toBe('999px')
  })
})
