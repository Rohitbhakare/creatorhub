import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/test-helpers'
import { FilterSheet } from './filter-sheet'

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

describe('FilterSheet — URL-driven open (E5.2 T7)', () => {
  beforeEach(() => {
    mockReplace.mockClear()
    mockPush.mockClear()
    urlParams = new URLSearchParams()
  })

  it('hideTrigger removes the in-component "Filters" button', () => {
    render(<FilterSheet subCategories={[]} hideTrigger urlParamControlsOpen />)
    expect(screen.queryByRole('button', { name: /^Filters$/i })).not.toBeInTheDocument()
  })

  it('opens the dialog when ?filters=open is in the URL', async () => {
    urlParams = new URLSearchParams('filters=open')
    render(<FilterSheet subCategories={[]} hideTrigger urlParamControlsOpen />)
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Filters' })).toBeInTheDocument()
    })
  })

  it('strips ?filters=open when the close button is clicked', async () => {
    urlParams = new URLSearchParams('filters=open')
    render(<FilterSheet subCategories={[]} hideTrigger urlParamControlsOpen />)
    const close = await screen.findByLabelText('Close filters')
    close.click()
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/discover', { scroll: false })
    })
  })

  it('does not auto-open without the urlParamControlsOpen flag', () => {
    urlParams = new URLSearchParams('filters=open')
    render(<FilterSheet subCategories={[]} hideTrigger />)
    expect(screen.queryByRole('dialog', { name: 'Filters' })).not.toBeInTheDocument()
  })
})
