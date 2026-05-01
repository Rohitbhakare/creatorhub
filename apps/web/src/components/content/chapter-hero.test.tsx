import { describe, it, expect, vi } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChapterHero } from './chapter-hero'
import type { ChapterStory } from '@/lib/api/feed'
import type { ContentDetail, ItinerarySpot } from '@/lib/api/types'

const SPOTS: ItinerarySpot[] = [
  { id: 's1', dayNumber: 1, orderIndex: 0, name: 'Leaving the highway', description: 'Air shifts to salt and jackfruit.', distanceFromPreviousKm: null, durationFromPreviousMin: null, lat: null, lng: null, thumbnailUrl: null },
  { id: 's2', dayNumber: 2, orderIndex: 0, name: 'Velas at first light', description: 'A 5:30am call.', distanceFromPreviousKm: 14, durationFromPreviousMin: null, lat: null, lng: null, thumbnailUrl: null },
  { id: 's3', dayNumber: 3, orderIndex: 0, name: "Aji's kitchen", description: 'No menu.', distanceFromPreviousKm: 0, durationFromPreviousMin: null, lat: null, lng: null, thumbnailUrl: null },
  { id: 's4', dayNumber: 4, orderIndex: 0, name: 'The cliff at Guhagar', description: 'Sunset 6:42.', distanceFromPreviousKm: 38, durationFromPreviousMin: null, lat: null, lng: null, thumbnailUrl: null },
]

const STORY: ChapterStory = {
  content: {
    id: 'c-1',
    type: 'itinerary',
    title: 'Konkan in 4 quiet days',
    coverImageUrl: null,
    durationDays: 4,
    distanceKm: 280,
    rating: 4.8,
    isFree: true,
    priceInPaisa: 0,
    description: null,
    body: null,
    endsAt: null,
    startsAt: null,
    creator: { id: 'u-1', displayName: 'Aanya Ravi', username: 'aanyar', avatarUrl: null, vertical: 'travel' },
    spots: SPOTS,
    tags: [],
    slug: 'konkan-in-4-quiet-days',
  } as unknown as ContentDetail,
  chapters: SPOTS,
}

describe('ChapterHero', () => {
  it('renders the first chapter on mount', () => {
    render(<ChapterHero story={STORY} autoAdvanceMs={0} />)
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Leaving the highway')
    expect(screen.getByText(/Konkan in 4 quiet days/)).toBeInTheDocument()
    expect(screen.getByText(/Chapter 01\/04/)).toBeInTheDocument()
  })

  it('exposes one tab per chapter with the right active state', () => {
    render(<ChapterHero story={STORY} autoAdvanceMs={0} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(4)
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false')
  })

  it('clicking a chapter dot updates the active tab', async () => {
    const user = userEvent.setup()
    render(<ChapterHero story={STORY} autoAdvanceMs={0} />)
    const tabs = screen.getAllByRole('tab')
    await user.click(tabs[2] as HTMLElement)
    // aria-selected updates synchronously with React state — no animation in the way.
    expect(tabs[2]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'false')
  })

  it('auto-advances after the interval elapses', () => {
    vi.useFakeTimers()
    try {
      render(<ChapterHero story={STORY} autoAdvanceMs={1000} />)
      const tabs = screen.getAllByRole('tab')
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
      act(() => {
        vi.advanceTimersByTime(1000)
      })
      // Tab state flips synchronously even if AnimatePresence is mid-swap.
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    } finally {
      vi.useRealTimers()
    }
  })

  it('arrow keys advance / reverse the chapter', async () => {
    const user = userEvent.setup()
    render(<ChapterHero story={STORY} autoAdvanceMs={0} />)
    const tabs = screen.getAllByRole('tab')
    await user.keyboard('{ArrowRight}')
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowLeft}')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('wraps from last → first on right arrow', async () => {
    const user = userEvent.setup()
    render(<ChapterHero story={STORY} autoAdvanceMs={0} />)
    const tabs = screen.getAllByRole('tab')
    for (let i = 0; i < 4; i++) await user.keyboard('{ArrowRight}')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('eventually shows the new chapter heading after the AnimatePresence swap', async () => {
    const user = userEvent.setup()
    render(<ChapterHero story={STORY} autoAdvanceMs={0} />)
    await user.click(screen.getAllByRole('tab')[2] as HTMLElement)
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent("Aji's kitchen")
    })
  })
})
