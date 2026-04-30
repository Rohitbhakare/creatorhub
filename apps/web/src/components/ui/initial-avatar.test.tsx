import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { InitialAvatar } from './initial-avatar'

describe('InitialAvatar', () => {
  it('renders two-letter initials from the display name', () => {
    const { container } = render(<InitialAvatar name="Saanvi Krishnan" />)
    expect(container.textContent).toBe('SK')
  })

  it('falls back to a single letter when the name is one word', () => {
    const { container } = render(<InitialAvatar name="Krishnan" />)
    expect(container.textContent).toBe('K')
  })

  it('falls back to a placeholder glyph when the name is empty', () => {
    const { container } = render(<InitialAvatar name="" />)
    expect(container.textContent).toBe('·')
  })

  it('hides the initials when a profile photo URL is supplied', () => {
    const { container } = render(<InitialAvatar name="Saanvi" url="https://x/y.jpg" />)
    expect(container.textContent).toBe('')
    const div = container.firstChild as HTMLElement
    expect(div.style.backgroundImage).toContain('url(')
  })

  it('scales font-size with diameter', () => {
    const { container } = render(<InitialAvatar name="X X" size={80} />)
    const div = container.firstChild as HTMLElement
    expect(div.style.width).toBe('80px')
    expect(div.style.fontSize).toBe('34px') // round(80 * 0.42)
  })
})
