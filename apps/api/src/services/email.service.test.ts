import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────────────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn() }
  return { supabase: mockSupabase }
})

vi.mock('./notification.service.js', () => ({
  getPreferences: vi.fn(),
}))

// Mock global fetch
const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

import { sendEmail, sendBookingConfirmationEmail, sendKycApprovalEmail, sendKycRejectionEmail } from './email.service.js'
import { supabase } from '../lib/supabase.js'
import { getPreferences } from './notification.service.js'

// ─── Mock helpers ──────────────────────────────────────────────

function mockChain(data: unknown, error: unknown = null) {
  const resolvedVal = { data, error }
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: (
      onFulfilled: (val: typeof resolvedVal) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolvedVal).then(onFulfilled, onRejected),
  }
  return chain
}

function mockFetchOk() {
  fetchMock.mockResolvedValue({
    ok: true,
    text: vi.fn().mockResolvedValue(''),
  })
}

function mockFetchFail() {
  fetchMock.mockResolvedValue({
    ok: false,
    status: 400,
    text: vi.fn().mockResolvedValue('{"errors":[{"message":"Bad request"}]}'),
  })
}

// ─── Fixtures ──────────────────────────────────────────────────

const USER_ID = 'user-email-001'
const BOOKING_ID = 'booking-email-001'

beforeEach(() => {
  vi.resetAllMocks()
  process.env['SENDGRID_API_KEY'] = 'SG.test-api-key'
})

// ── sendEmail ──────────────────────────────────────────────────

describe('sendEmail', () => {
  it('calls SendGrid API with correct payload', async () => {
    mockFetchOk()

    await sendEmail({
      to: 'user@example.com',
      subject: 'Test Subject',
      htmlBody: '<p>Hello</p>',
      textBody: 'Hello',
    })

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('sendgrid.com')

    const body = JSON.parse(opts.body as string) as Record<string, unknown>
    expect(body['subject']).toBe('Test Subject')
    const personalizations = body['personalizations'] as Array<{ to: Array<{ email: string }> }>
    expect(personalizations[0]?.to[0]?.email).toBe('user@example.com')
    const from = body['from'] as { email: string; name: string }
    expect(from.email).toBe('noreply@creatorhub.in')
  })

  it('never throws when SendGrid returns error status', async () => {
    mockFetchFail()

    await expect(
      sendEmail({ to: 'user@example.com', subject: 'Test', htmlBody: '<p>test</p>' }),
    ).resolves.toBeUndefined()
  })

  it('never throws when fetch itself throws (network error)', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'))

    await expect(
      sendEmail({ to: 'user@example.com', subject: 'Test', htmlBody: '<p>test</p>' }),
    ).resolves.toBeUndefined()
  })

  it('skips sending when SENDGRID_API_KEY is not configured', async () => {
    delete process.env['SENDGRID_API_KEY']

    await sendEmail({ to: 'user@example.com', subject: 'Test', htmlBody: '<p>test</p>' })

    expect(fetchMock).not.toHaveBeenCalled()
  })
})

// ── sendBookingConfirmationEmail ───────────────────────────────

describe('sendBookingConfirmationEmail', () => {
  it('sends booking confirmation email with amounts in rupees', async () => {
    vi.mocked(getPreferences).mockResolvedValue([
      { category: 'bookings_trips', channel: 'email', enabled: true },
    ])
    const fromMock = vi.mocked(supabase.from)
    // user fetch
    fromMock.mockReturnValueOnce(
      mockChain({ email: 'alice@example.com', display_name: 'Alice' }) as never,
    )
    // booking fetch
    fromMock.mockReturnValueOnce(
      mockChain({
        id: BOOKING_ID,
        total_paisa: 650000,
        base_price_paisa: 500000,
        platform_fee_paisa: 85000,
        gst_paisa: 90000,
        start_date: '2026-05-01T06:00:00Z',
        content: { title: 'Himalayan Trek' },
      }) as never,
    )
    mockFetchOk()

    await sendBookingConfirmationEmail(USER_ID, BOOKING_ID)

    expect(fetchMock).toHaveBeenCalledOnce()
    const [, opts] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(opts.body as string) as Record<string, unknown>
    expect(body['subject']).toBe('Booking Confirmed — Himalayan Trek')

    // Verify HTML contains formatted amounts
    const content = body['content'] as Array<{ type: string; value: string }>
    const htmlContent = content.find((c) => c.type === 'text/html')
    expect(htmlContent?.value).toContain('₹5,000')
  })

  it('skips when email preference is disabled', async () => {
    vi.mocked(getPreferences).mockResolvedValue([
      { category: 'bookings_trips', channel: 'email', enabled: false },
    ])

    await sendBookingConfirmationEmail(USER_ID, BOOKING_ID)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('never throws when a dependency throws (fire-and-forget)', async () => {
    vi.mocked(getPreferences).mockRejectedValue(new Error('DB down'))

    await expect(sendBookingConfirmationEmail(USER_ID, BOOKING_ID)).resolves.toBeUndefined()
  })
})

// ── sendKycApprovalEmail ───────────────────────────────────────

describe('sendKycApprovalEmail', () => {
  it('sends KYC approval email with correct subject', async () => {
    vi.mocked(getPreferences).mockResolvedValue([])
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain({ email: 'creator@example.com', display_name: 'Riya' }) as never,
    )
    mockFetchOk()

    await sendKycApprovalEmail(USER_ID)

    expect(fetchMock).toHaveBeenCalledOnce()
    const [, opts] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(opts.body as string) as Record<string, unknown>
    expect(body['subject']).toBe('KYC Verified — You can now publish paid experiences')
  })

  it('skips when user has no email', async () => {
    vi.mocked(getPreferences).mockResolvedValue([])
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ email: null, display_name: 'Riya' }) as never)

    await sendKycApprovalEmail(USER_ID)

    expect(fetchMock).not.toHaveBeenCalled()
  })
})

// ── sendKycRejectionEmail ──────────────────────────────────────

describe('sendKycRejectionEmail', () => {
  it('sends KYC rejection email with reason in HTML', async () => {
    vi.mocked(getPreferences).mockResolvedValue([])
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain({ email: 'creator@example.com', display_name: 'Arjun' }) as never,
    )
    mockFetchOk()

    await sendKycRejectionEmail(USER_ID, 'PAN card photo is blurry')

    expect(fetchMock).toHaveBeenCalledOnce()
    const [, opts] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(opts.body as string) as Record<string, unknown>
    expect(body['subject']).toBe('Action required — KYC verification needs attention')

    const content = body['content'] as Array<{ type: string; value: string }>
    const htmlContent = content.find((c) => c.type === 'text/html')
    expect(htmlContent?.value).toContain('PAN card photo is blurry')
  })

  it('escapes HTML in rejection reason to prevent XSS', async () => {
    vi.mocked(getPreferences).mockResolvedValue([])
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(
      mockChain({ email: 'creator@example.com', display_name: 'Test' }) as never,
    )
    mockFetchOk()

    await sendKycRejectionEmail(USER_ID, '<script>alert("xss")</script>')

    const [, opts] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(opts.body as string) as Record<string, unknown>
    const content = body['content'] as Array<{ type: string; value: string }>
    const htmlContent = content.find((c) => c.type === 'text/html')
    expect(htmlContent?.value).not.toContain('<script>')
    expect(htmlContent?.value).toContain('&lt;script&gt;')
  })
})
