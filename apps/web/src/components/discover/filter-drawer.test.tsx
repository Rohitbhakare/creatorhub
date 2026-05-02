import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test-helpers'
import { FilterSheet } from './filter-sheet'
import { FilterSheetProvider } from './filter-sheet-context'

const mockReplace = vi.fn()
const mockPush = vi.fn()
let urlParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/discover',
  useSearchParams: () => urlParams,
}))

describe('FilterSheet — context-driven open (post E5.2/PERF-fix)', () => {
  beforeEach(() => {
    mockReplace.mockClear()
    mockPush.mockClear()
    urlParams = new URLSearchParams()
  })

  it('hideTrigger removes the in-component "Filters" button', () => {
    render(
      <FilterSheetProvider>
        <FilterSheet subCategories={[]} hideTrigger urlParamControlsOpen />
      </FilterSheetProvider>,
    )
    expect(screen.queryByRole('button', { name: /^Filters$/i })).not.toBeInTheDocument()
  })

  it('opens the dialog when initialOpen=true (deep-link from ?filters=open)', async () => {
    render(
      <FilterSheetProvider initialOpen>
        <FilterSheet subCategories={[]} hideTrigger urlParamControlsOpen />
      </FilterSheetProvider>,
    )
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument()
    })
  })

  it('strips stale ?filters=open from URL when close button is clicked', async () => {
    urlParams = new URLSearchParams('filters=open')
    render(
      <FilterSheetProvider initialOpen>
        <FilterSheet subCategories={[]} hideTrigger urlParamControlsOpen />
      </FilterSheetProvider>,
    )
    const close = await screen.findByLabelText('Close filters')
    close.click()
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/discover', { scroll: false })
    })
  })

  it('does not auto-open without urlParamControlsOpen + initialOpen', () => {
    urlParams = new URLSearchParams('filters=open')
    render(<FilterSheet subCategories={[]} hideTrigger />)
    expect(screen.queryByRole('dialog', { name: 'Filters' })).not.toBeInTheDocument()
  })
})
