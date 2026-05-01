import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/test-helpers'
import { BookingsDrawer } from './bookings-drawer'
import type { StudioBookingRow } from '@/lib/api'

const mockReplace = vi.fn()
let urlParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: mockReplace,
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/studio',
  useSearchParams: () => urlParams,
}))

const ROWS: StudioBookingRow[] = [
  {
    id: 'b1',
    contentId: 'c1',
    contentTitle: 'Konkan in 4 quiet days',
    travellerName: 'Rohan Patil',
    travellerEmail: 'r@example.com',
    pax: 2,
    status: 'confirmed',
    totalPaisa: 38_000_00,
    startsAt: '2026-06-15T08:00:00+05:30',
    bookedAt: '2026-04-20T10:00:00+05:30',
  },
]

describe('BookingsDrawer', () => {
  beforeEach(() => {
    mockReplace.mockClear()
    urlParams = new URLSearchParams()
  })

  it('renders the trigger link by default', () => {
    render(<BookingsDrawer bookings={ROWS} />)
    expect(screen.getByText(/View bookings/)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the dialog when ?bookings=open is in the URL', () => {
    urlParams = new URLSearchParams('bookings=open')
    render(<BookingsDrawer bookings={ROWS} />)
    expect(screen.getByRole('dialog', { name: 'Recent bookings' })).toBeInTheDocument()
  })

  it('renders booking rows with title + traveller + status', () => {
    urlParams = new URLSearchParams('bookings=open')
    render(<BookingsDrawer bookings={ROWS} />)
    expect(screen.getByText('Konkan in 4 quiet days')).toBeInTheDocument()
    expect(screen.getByText(/Rohan Patil/)).toBeInTheDocument()
    expect(screen.getByText('confirmed')).toBeInTheDocument()
  })

  it('shows an empty state when no bookings exist', () => {
    urlParams = new URLSearchParams('bookings=open')
    render(<BookingsDrawer bookings={[]} />)
    expect(screen.getByText(/No bookings yet/)).toBeInTheDocument()
  })

  it('clicking the close button strips ?bookings=open via router.replace', () => {
    urlParams = new URLSearchParams('bookings=open')
    render(<BookingsDrawer bookings={ROWS} />)
    const close = screen.getByLabelText('Close bookings drawer')
    close.click()
    expect(mockReplace).toHaveBeenCalledWith('/studio', { scroll: false })
  })

  it('caps the rendered list at 20 rows', () => {
    urlParams = new URLSearchParams('bookings=open')
    const base = ROWS[0]
    if (!base) throw new Error('expected fixture row')
    const many = Array.from({ length: 30 }, (_, i) => ({ ...base, id: `b${String(i)}` }))
    render(<BookingsDrawer bookings={many} />)
    const items = screen.getAllByText('Konkan in 4 quiet days')
    expect(items).toHaveLength(20)
  })
})
