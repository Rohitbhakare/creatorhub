import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderWithProviders, screen, userEvent, waitFor } from '@/test-helpers'
import { BookCta } from './book-cta'

describe('BookCta', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ intentId: 'intent-1' }), { status: 200 }),
    )
  })

  it('renders the price + GST line for paid content', () => {
    renderWithProviders(
      <BookCta
        contentId="c-1"
        contentType="experience"
        priceInPaisa={250000}
        isFree={false}
        isAuthenticated={true}
      />,
    )
    expect(screen.getByText('From')).toBeInTheDocument()
    expect(screen.getByText('₹2,500')).toBeInTheDocument()
    expect(
      screen.getByText(/GST included · UPI/),
    ).toBeInTheDocument()
  })

  it('renders Free + self-paced caption for free content', () => {
    renderWithProviders(
      <BookCta
        contentId="c-1"
        contentType="itinerary"
        priceInPaisa={0}
        isFree={true}
        isAuthenticated={true}
      />,
    )
    expect(screen.getByText('Free · self-paced')).toBeInTheDocument()
    expect(
      screen.getByText('Free · no payment needed'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Save & open' }),
    ).toBeInTheDocument()
  })

  it('renders type-specific CTA labels', () => {
    const { rerender } = renderWithProviders(
      <BookCta
        contentId="c-1"
        contentType="itinerary"
        priceInPaisa={650000}
        isFree={false}
        isAuthenticated={true}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Unlock this trip' }),
    ).toBeInTheDocument()

    rerender(
      <BookCta
        contentId="c-1"
        contentType="experience"
        priceInPaisa={250000}
        isFree={false}
        isAuthenticated={true}
      />,
    )
    expect(
      screen.getByRole('button', { name: 'Book this experience' }),
    ).toBeInTheDocument()
  })

  it('shows the cancellation guarantee strip', () => {
    renderWithProviders(
      <BookCta
        contentId="c-1"
        contentType="experience"
        priceInPaisa={250000}
        isFree={false}
        isAuthenticated={true}
      />,
    )
    expect(
      screen.getByText('Cancellable up to 24 h before · 100% refund guarantee'),
    ).toBeInTheDocument()
  })

  it('opens sign-in modal for guests with title + price in copy', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <BookCta
        contentId="c-1"
        contentTitle="Bali in 5 Days"
        contentType="experience"
        priceInPaisa={650000}
        isFree={false}
        isAuthenticated={false}
      />,
    )
    await user.click(
      screen.getByRole('button', { name: 'Book this experience' }),
    )
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: 'Sign in' })).toBeInTheDocument()
    })
    expect(
      screen.getByText(/Book\s+“Bali in 5 Days”\s+—\s+₹6,500/),
    ).toBeInTheDocument()
    // No POST to booking until sign-in completes
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('renders schedule date picker when scheduledDates are provided', () => {
    renderWithProviders(
      <BookCta
        contentId="c-1"
        contentType="experience"
        priceInPaisa={250000}
        isFree={false}
        scheduledDates={[
          {
            id: 'sd-1',
            startsAt: '2026-05-01T10:00:00Z',
            endsAt: '2026-05-01T16:00:00Z',
            capacity: 10,
            seatsBooked: 2,
            seatsHeld: 0,
            status: 'open',
          },
        ]}
        isAuthenticated={true}
      />,
    )
    expect(screen.getByText('Pick a date')).toBeInTheDocument()
  })
})
