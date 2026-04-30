import { describe, it, expect, vi } from 'vitest'
import { render, screen, userEvent } from '@/test-helpers'
import { FeedChipRail } from './feed-chip-rail'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

describe('FeedChipRail', () => {
  it('renders all 3 scope chips and 5 type chips', () => {
    render(<FeedChipRail scope="near-you" type={undefined} isGuest={false} />)

    // Scope chips
    expect(screen.getByRole('button', { name: 'Near you' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Following' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'All' }).length).toBeGreaterThan(0)

    // Type chips
    expect(screen.getByRole('button', { name: 'Posts' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Itineraries' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Experiences' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Events' })).toBeInTheDocument()
  })

  it('highlights the active scope', () => {
    render(<FeedChipRail scope="near-you" type={undefined} isGuest={false} />)
    expect(
      screen.getByRole('button', { name: 'Near you', pressed: true }),
    ).toBeInTheDocument()
  })

  it('renders Following as a sign-in link when isGuest is true', () => {
    render(<FeedChipRail scope="near-you" type={undefined} isGuest={true} />)
    const followingLink = screen.getByRole('link', { name: /Following/i })
    expect(followingLink).toHaveAttribute('href', '/signin?next=/')
  })

  it('navigates with router.push when a type chip is clicked', async () => {
    const user = userEvent.setup()
    mockPush.mockClear()
    render(<FeedChipRail scope="near-you" type={undefined} isGuest={false} />)

    await user.click(screen.getByRole('button', { name: 'Itineraries' }))

    expect(mockPush).toHaveBeenCalledWith(
      '/?scope=near-you&type=itinerary',
      expect.objectContaining({ scroll: false }),
    )
  })

  it('preserves the city query param when navigating', async () => {
    const user = userEvent.setup()
    mockPush.mockClear()
    render(
      <FeedChipRail
        scope="near-you"
        type={undefined}
        isGuest={false}
        preserve={{ city: 'Mumbai' }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Posts' }))

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/^\/\?scope=near-you&type=post&city=Mumbai$/),
      expect.any(Object),
    )
  })

  it('removes the type param when clicking the All filter', async () => {
    const user = userEvent.setup()
    mockPush.mockClear()
    render(<FeedChipRail scope="near-you" type="post" isGuest={false} />)

    // The "All" chip in the type rail (second occurrence — first is the
    // scope All). Use getAllByRole + last() to pick the type-rail one.
    const allChips = screen.getAllByRole('button', { name: 'All' })
    await user.click(allChips[allChips.length - 1]!)

    // No type=… in the URL when "All" is selected
    expect(mockPush).toHaveBeenCalledWith(
      '/?scope=near-you',
      expect.any(Object),
    )
  })
})
