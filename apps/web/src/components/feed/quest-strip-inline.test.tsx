import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { QuestStripInline } from './quest-strip-inline'
import type { QuestSummary } from '@/lib/api/types'

const SUMMARY: QuestSummary = {
  completedToday: 2,
  totalToday: 3,
  streakDays: 5,
  level: 4,
  xp: 1280,
  xpToNextLevel: 1500,
  brokenStreakAlert: false,
}

describe('QuestStripInline', () => {
  it('renders all four cards', () => {
    const { container } = render(<QuestStripInline summary={SUMMARY} />)
    const strip = container.querySelector('.ch-quest-strip')
    expect(strip).toBeInTheDocument()
    expect(strip?.children).toHaveLength(4)
  })

  it('shows the level badge with the right level', () => {
    render(<QuestStripInline summary={SUMMARY} />)
    expect(screen.getByText('L4')).toBeInTheDocument()
  })

  it('shows xp progress + remaining-to-next-level', () => {
    render(<QuestStripInline summary={SUMMARY} />)
    expect(screen.getByText(/1280/)).toBeInTheDocument()
    expect(screen.getByText(/220 to L5/)).toBeInTheDocument()
  })

  it('shows the streak count and rolling-window viz', () => {
    render(<QuestStripInline summary={SUMMARY} streakWindow={7} />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText(/5 of last 7 days/)).toBeInTheDocument()
  })

  it('flags broken-streak warning when set', () => {
    render(<QuestStripInline summary={{ ...SUMMARY, brokenStreakAlert: true }} />)
    expect(screen.getByText(/keep the streak alive/i)).toBeInTheDocument()
  })

  it('shows the active-quest CTA with remaining count', () => {
    render(<QuestStripInline summary={SUMMARY} />)
    const cta = screen.getByRole('link', { name: /Earn XP/i })
    expect(cta).toHaveAttribute('href', '/quests')
    expect(within(cta).getByText(/Read 1 more story/i)).toBeInTheDocument()
    expect(within(cta).getByText('2 / 3')).toBeInTheDocument()
  })

  it('flips the CTA copy when daily quests are done', () => {
    render(<QuestStripInline summary={{ ...SUMMARY, completedToday: 3 }} />)
    expect(screen.getByText(/Daily quests done/i)).toBeInTheDocument()
  })

  it('handles xpToNextLevel of zero without dividing by zero', () => {
    render(<QuestStripInline summary={{ ...SUMMARY, xp: 0, xpToNextLevel: 0 }} />)
    expect(screen.getByText(/0 to L5/)).toBeInTheDocument()
  })
})
