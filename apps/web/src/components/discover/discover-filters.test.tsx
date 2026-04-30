import { describe, it, expect, vi } from 'vitest'
import { render, screen, userEvent, waitFor } from '@/test-helpers'
import { DiscoverFilters } from './discover-filters'

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
  usePathname: () => '/discover',
  useSearchParams: () => new URLSearchParams(),
}))

describe('DiscoverFilters', () => {
  it('renders the sort dropdown with the 5 sort options', () => {
    render(<DiscoverFilters sort="relevance" cities={[]} />)
    const sort = screen.getByLabelText('Sort')
    expect(sort).toBeInTheDocument()
    expect(sort).toHaveValue('relevance')

    // 5 options: relevance, newest, price_asc, price_desc, rating
    const opts = screen.getAllByRole('option')
    expect(opts.map((o) => o.getAttribute('value'))).toEqual([
      'relevance',
      'newest',
      'price_asc',
      'price_desc',
      'rating',
    ])
  })

  it('navigates to the new sort when sort dropdown changes', async () => {
    const user = userEvent.setup()
    mockPush.mockClear()
    render(<DiscoverFilters sort="relevance" cities={[]} />)
    await user.selectOptions(screen.getByLabelText('Sort'), 'newest')

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('sort=newest'),
      expect.objectContaining({ scroll: false }),
    )
  })

  it('shows a Filters button without a count when no filters are active', () => {
    render(<DiscoverFilters sort="relevance" cities={['Mumbai']} />)
    const btn = screen.getByRole('button', { name: /Filters/i })
    expect(btn).toBeInTheDocument()
    // The active-count badge is not rendered when nothing is active.
    expect(btn.textContent).toMatch(/^\s*Filters\s*$/i)
  })

  it('shows the filter count badge when filters are active', () => {
    render(
      <DiscoverFilters
        sort="relevance"
        priceMin="0"
        priceMax="2000"
        city="Mumbai"
        cities={['Mumbai']}
      />,
    )
    const btn = screen.getByRole('button', { name: /Filters/i })
    // priceMin + priceMax + city = 3 active filters
    expect(btn).toHaveTextContent('3')
  })

  it('opens the popover on Filters click and exposes the city dropdown', async () => {
    const user = userEvent.setup()
    render(
      <DiscoverFilters sort="relevance" cities={['Mumbai', 'Pune']} />,
    )
    await user.click(screen.getByRole('button', { name: /Filters/i }))

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument()
    })
    // Two comboboxes are visible: the always-on Sort + the popover City.
    const dialog = screen.getByRole('dialog', { name: 'Filters' })
    const cityDropdown = dialog.querySelector('select')
    if (!cityDropdown) throw new Error('city dropdown not found in popover')
    // Default + 2 cities = 3 options inside the popover dropdown.
    expect(cityDropdown.querySelectorAll('option')).toHaveLength(3)
    const defaultOpt = cityDropdown.querySelector('option[value=""]')
    if (!defaultOpt) throw new Error('default city option missing')
    expect(defaultOpt.textContent).toBe('Anywhere in India')
  })

  it('renders 5 price preset chips', async () => {
    const user = userEvent.setup()
    render(<DiscoverFilters sort="relevance" cities={[]} />)
    await user.click(screen.getByRole('button', { name: /Filters/i }))

    expect(screen.getByRole('button', { name: 'Free' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Under ₹2k' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '₹2k–5k' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '₹5k–10k' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Over ₹10k' })).toBeInTheDocument()
  })

  it('navigates with priceMin/priceMax when a price preset is clicked', async () => {
    const user = userEvent.setup()
    mockPush.mockClear()
    render(<DiscoverFilters sort="relevance" cities={[]} />)
    await user.click(screen.getByRole('button', { name: /Filters/i }))
    await user.click(screen.getByRole('button', { name: '₹2k–5k' }))

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/priceMin=2000.*priceMax=5000|priceMax=5000.*priceMin=2000/),
      expect.any(Object),
    )
  })

  it('shows a Clear filters button only when filters are active', async () => {
    const user = userEvent.setup()
    const { rerender } = render(
      <DiscoverFilters sort="relevance" cities={[]} />,
    )
    await user.click(screen.getByRole('button', { name: /Filters/i }))
    expect(screen.queryByRole('button', { name: /Clear filters/i })).toBeNull()

    rerender(
      <DiscoverFilters sort="relevance" priceMin="0" priceMax="2000" cities={[]} />,
    )
    expect(
      screen.getByRole('button', { name: /Clear filters/i }),
    ).toBeInTheDocument()
  })
})
