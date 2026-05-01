import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PrevNextChapterFooter } from './prev-next-chapter'

describe('PrevNextChapterFooter', () => {
  it('renders both cards with kickers + titles', () => {
    render(
      <PrevNextChapterFooter
        prev={{ href: '/content/x#day-1', kicker: 'Prologue', title: 'Why Konkan, why now' }}
        next={{ href: '/content/x#day-2', kicker: 'Day 2', title: 'Murud-Janjira: the fort that stayed' }}
      />,
    )
    expect(screen.getByText(/Prologue/)).toBeInTheDocument()
    expect(screen.getByText('Why Konkan, why now')).toBeInTheDocument()
    expect(screen.getByText(/Day 2/)).toBeInTheDocument()
    expect(screen.getByText('Murud-Janjira: the fort that stayed')).toBeInTheDocument()
  })

  it('returns null when both prev and next are absent', () => {
    const { container } = render(<PrevNextChapterFooter />)
    expect(container.firstChild).toBeNull()
  })

  it('renders only the next card when prev is missing', () => {
    render(
      <PrevNextChapterFooter
        next={{ href: '/content/x#day-2', kicker: 'Day 2', title: 'Next chapter' }}
      />,
    )
    expect(screen.queryByText(/Prologue/)).not.toBeInTheDocument()
    expect(screen.getByText('Next chapter')).toBeInTheDocument()
  })

  it('uses semantic rel attributes on the cards', () => {
    render(
      <PrevNextChapterFooter
        prev={{ href: '/p', kicker: 'Prev', title: 'Prev title' }}
        next={{ href: '/n', kicker: 'Next', title: 'Next title' }}
      />,
    )
    expect(screen.getByText('Prev title').closest('a')).toHaveAttribute('rel', 'prev')
    expect(screen.getByText('Next title').closest('a')).toHaveAttribute('rel', 'next')
  })

  it('wraps in a <nav aria-label="Chapter navigation">', () => {
    const { container } = render(
      <PrevNextChapterFooter
        prev={{ href: '/p', kicker: 'P', title: 'P' }}
        next={{ href: '/n', kicker: 'N', title: 'N' }}
      />,
    )
    const nav = container.querySelector('nav')
    expect(nav).toHaveAttribute('aria-label', 'Chapter navigation')
  })
})
