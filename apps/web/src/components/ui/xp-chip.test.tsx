import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { XPChip } from './xp-chip'
import { StreakChip } from './streak-chip'
import { Tag } from './tag'

describe('XPChip', () => {
  it('shows level + xp/max', () => {
    const { container, getByLabelText } = render(<XPChip level={3} xp={120} nextLevelXp={200} />)
    expect(container.textContent).toContain('3')
    expect(container.textContent).toContain('120/200 XP')
    expect(getByLabelText('Level 3, 120 of 200 XP')).toBeInTheDocument()
  })

  it('handles zero next-level-xp without dividing by zero', () => {
    const { container } = render(<XPChip level={1} xp={0} nextLevelXp={0} />)
    expect(container.textContent).toContain('0/0')
  })
})

describe('StreakChip', () => {
  it('shows the day count and full-fire glyph by default', () => {
    const { container, getByLabelText } = render(<StreakChip days={7} />)
    expect(container.textContent).toContain('7d')
    expect(getByLabelText('7-day streak')).toBeInTheDocument()
  })

  it('switches to at-risk styling when atRisk', () => {
    const { container, getByLabelText } = render(<StreakChip days={3} atRisk />)
    expect(getByLabelText('3-day streak — at risk')).toBeInTheDocument()
    const span = container.firstChild as HTMLElement
    expect(span.style.opacity).toBe('0.7')
  })
})

describe('Tag', () => {
  it('prefixes a hash when hash prop is set', () => {
    const { container } = render(<Tag hash>roadtrip</Tag>)
    expect(container.textContent).toBe('#roadtrip')
  })

  it.each(['default', 'tint', 'ink'] as const)('renders %s tone', (tone) => {
    const { container } = render(<Tag tone={tone}>label</Tag>)
    const span = container.firstChild as HTMLElement
    expect(span.style.background).toBeTruthy()
  })
})
