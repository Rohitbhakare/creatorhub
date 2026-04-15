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

import { sendWhatsApp, sendBookingConfirmation } from './whatsapp.service.js'
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
  fetchMock.mockResolvedValue({ ok: true, text: vi.fn().mockResolvedValue('') })
}

function mockFetchFail(status = 400) {
  fetchMock.mockResolvedValue({
    ok: false,
    status,
    text: vi.fn().mockResolvedValue('{"error":"bad request"}'),
  })
}

// ─── Fixtures ──────────────────────────────────────────────────

const USER_ID = 'user-wa-001'
const BOOKING_ID = 'booking-wa-001'

beforeEach(() => {
  vi.resetAllMocks()
  process.env['WHATSAPP_TOKEN'] = 'test-wa-token'
  process.env['WHATSAPP_PHONE_NUMBER_ID'] = '1234567890'
})

// ── sendWhatsApp ───────────────────────────────────────────────

describe('sendWhatsApp', () => {
  it('calls Meta Cloud API with correct payload', async () => {
    mockFetchOk()

    await sendWhatsApp('+919876543210', 'booking_confirmation', ['Alice', 'Himalayan Trek', '1 May 2026', '₹5,000'])

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toContain('1234567890/messages')
    expect(url).toContain('graph.facebook.com')

    const body = JSON.parse(opts.body as string) as Record<string, unknown>
    expect(body['messaging_product']).toBe('whatsapp')
    expect((body['template'] as Record<string, unknown>)['name']).toBe('booking_confirmation')
    // Phone should have + stripped
    expect(body['to']).toBe('919876543210')
  })

  it('strips leading + from phone number', async () => {
    mockFetchOk()

    await sendWhatsApp('+911234567890', 'test_template', [])

    const [, opts] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(opts.body as string) as Record<string, unknown>
    expect(body['to']).toBe('911234567890')
  })

  it('never throws when Meta API returns error status', async () => {
    mockFetchFail(400)

    // Must not throw
    await expect(sendWhatsApp('+919876543210', 'booking_confirmation', [])).resolves.toBeUndefined()
  })

  it('never throws when fetch itself throws (network error)', async () => {
    fetchMock.mockRejectedValue(new Error('Network failure'))

    await expect(sendWhatsApp('+919876543210', 'booking_confirmation', [])).resolves.toBeUndefined()
  })

  it('skips sending when WHATSAPP_TOKEN is not configured', async () => {
    delete process.env['WHATSAPP_TOKEN']

    await sendWhatsApp('+919876543210', 'booking_confirmation', [])

    expect(fetchMock).not.toHaveBeenCalled()
  })
})

// ── sendBookingConfirmation ────────────────────────────────────

describe('sendBookingConfirmation', () => {
  it('sends booking confirmation to user phone', async () => {
    vi.mocked(getPreferences).mockResolvedValue([
      { category: 'bookings_trips', channel: 'whatsapp', enabled: true },
    ])
    const fromMock = vi.mocked(supabase.from)
    // user fetch
    fromMock.mockReturnValueOnce(
      mockChain({ phone: '+919876543210', display_name: 'Alice' }) as never,
    )
    // booking fetch
    fromMock.mockReturnValueOnce(
      mockChain({
        id: BOOKING_ID,
        total_paisa: 500000,
        start_date: '2026-05-01T06:00:00Z',
        content: { title: 'Himalayan Trek' },
      }) as never,
    )
    mockFetchOk()

    await sendBookingConfirmation(USER_ID, BOOKING_ID)

    expect(fetchMock).toHaveBeenCalledOnce()
    const [, opts] = fetchMock.mock.calls[0] as [string, RequestInit]
    const body = JSON.parse(opts.body as string) as Record<string, unknown>
    const components = (body['template'] as Record<string, unknown>)['components'] as Array<Record<string, unknown>>
    const params = components[0]?.['parameters'] as Array<{ text: string }>
    expect(params[0]?.text).toBe('Alice')
    expect(params[1]?.text).toBe('Himalayan Trek')
  })

  it('skips when whatsapp preference is disabled', async () => {
    vi.mocked(getPreferences).mockResolvedValue([
      { category: 'bookings_trips', channel: 'whatsapp', enabled: false },
    ])

    await sendBookingConfirmation(USER_ID, BOOKING_ID)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('skips when user has no phone number', async () => {
    vi.mocked(getPreferences).mockResolvedValue([])
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ phone: null, display_name: 'Alice' }) as never)

    await sendBookingConfirmation(USER_ID, BOOKING_ID)

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('never throws when a dependency throws (fire-and-forget)', async () => {
    vi.mocked(getPreferences).mockRejectedValue(new Error('DB down'))

    await expect(sendBookingConfirmation(USER_ID, BOOKING_ID)).resolves.toBeUndefined()
  })
})
