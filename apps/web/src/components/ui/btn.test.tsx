import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Btn, BtnLink } from './btn'

describe('Btn', () => {
  it('renders the primary variant by default with the right CSS classes', () => {
    render(<Btn>Sign up</Btn>)
    const button = screen.getByRole('button', { name: 'Sign up' })
    expect(button.className).toContain('ch-btn')
    expect(button.className).toContain('ch-btn-primary')
    expect(button).toHaveAttribute('type', 'button')
  })

  it.each(['primary', 'ink', 'ghost'] as const)('renders %s variant', (v) => {
    render(<Btn variant={v}>Press</Btn>)
    const button = screen.getByRole('button', { name: 'Press' })
    expect(button.className).toContain(`ch-btn-${v}`)
  })

  it('disables and shows aria-busy while loading', () => {
    render(<Btn loading>Saving</Btn>)
    const button = screen.getByRole('button', { name: 'Saving' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('fires onClick on press', async () => {
    const onClick = vi.fn()
    render(<Btn onClick={onClick}>Tap</Btn>)
    await userEvent.click(screen.getByRole('button', { name: 'Tap' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('honors size prop on font-size + padding', () => {
    render(<Btn size="lg">Big</Btn>)
    const button = screen.getByRole('button', { name: 'Big' })
    expect(button.style.fontSize).toBe('15px')
    expect(button.style.padding).toBe('12px 22px')
  })
})

describe('BtnLink', () => {
  it('renders an anchor with the right href', () => {
    render(<BtnLink href="/discover">Discover</BtnLink>)
    const link = screen.getByRole('link', { name: 'Discover' })
    expect(link).toHaveAttribute('href', '/discover')
    expect(link.className).toContain('ch-btn-primary')
  })

  it('adds noopener noreferrer rel when target=_blank', () => {
    render(
      <BtnLink href="https://example.com" target="_blank">
        Open
      </BtnLink>,
    )
    const link = screen.getByRole('link', { name: 'Open' })
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
