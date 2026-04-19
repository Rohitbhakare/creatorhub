import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase.js', () => ({
  supabase: { from: vi.fn() },
}))

vi.mock('./push.service.js', () => ({
  sendPush: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./email.service.js', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./notification.service.js', () => ({
  getPreferences: vi.fn(),
}))

import {
  notifyPayoutsEnabled,
  notifyPayoutProcessed,
  notifyPayoutFailed,
  notifyLinkedAccountActionRequired,
} from './payout-notifications.service.js'
import { supabase } from '../lib/supabase.js'
import { sendPush } from './push.service.js'
import { sendEmail } from './email.service.js'
import { getPreferences } from './notification.service.js'

const USER_ID = '11111111-1111-1111-1111-111111111111'

function mockUserLookup(data: { email: string | null; display_name: string | null } | null) {
  vi.mocked(supabase.from).mockReturnValueOnce({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  // default: email preference enabled
  vi.mocked(getPreferences).mockResolvedValue([
    { category: 'bookings_trips', channel: 'email', enabled: true },
  ] as never)
})

describe('notifyPayoutsEnabled', () => {
  it('sends push and email when user has email and prefs allow', async () => {
    mockUserLookup({ email: 'asha@example.com', display_name: 'Asha' })
    await notifyPayoutsEnabled(USER_ID)
    expect(sendPush).toHaveBeenCalledWith(USER_ID, expect.objectContaining({
      type: 'payouts_enabled',
      category: 'bookings_trips',
      targetRoute: '/studio/earnings',
    }))
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'asha@example.com',
      subject: expect.stringContaining('payouts are enabled'),
    }))
  })

  it('skips email when user has no email', async () => {
    mockUserLookup({ email: null, display_name: 'Asha' })
    await notifyPayoutsEnabled(USER_ID)
    expect(sendPush).toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('skips email when preference is disabled', async () => {
    mockUserLookup({ email: 'asha@example.com', display_name: 'Asha' })
    vi.mocked(getPreferences).mockResolvedValueOnce([
      { category: 'bookings_trips', channel: 'email', enabled: false },
    ] as never)
    await notifyPayoutsEnabled(USER_ID)
    expect(sendPush).toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('swallows errors silently', async () => {
    vi.mocked(sendPush).mockRejectedValueOnce(new Error('push failed'))
    await expect(notifyPayoutsEnabled(USER_ID)).resolves.toBeUndefined()
  })
})

describe('notifyPayoutProcessed', () => {
  it('formats net amount in rupees', async () => {
    mockUserLookup({ email: 'asha@example.com', display_name: 'Asha' })
    await notifyPayoutProcessed(USER_ID, {
      amountPaisa: 500000,
      tdsPaisa: 5000,
      bookingTitle: 'Sunset Trek',
    })
    expect(sendPush).toHaveBeenCalledWith(USER_ID, expect.objectContaining({
      type: 'payout_processed',
      title: expect.stringContaining('₹4,950'),
      body: expect.stringContaining('Sunset Trek'),
    }))
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      subject: expect.stringContaining('₹4,950'),
    }))
  })

  it('omits TDS line when TDS is zero', async () => {
    mockUserLookup({ email: 'asha@example.com', display_name: 'Asha' })
    await notifyPayoutProcessed(USER_ID, {
      amountPaisa: 100000,
      tdsPaisa: 0,
      bookingTitle: null,
    })
    const emailCall = vi.mocked(sendEmail).mock.calls[0]?.[0] as { htmlBody: string } | undefined
    expect(emailCall?.htmlBody).not.toContain('TDS')
  })
})

describe('notifyPayoutFailed', () => {
  it('bypasses email preference for action-required path', async () => {
    mockUserLookup({ email: 'asha@example.com', display_name: 'Asha' })
    vi.mocked(getPreferences).mockResolvedValueOnce([
      { category: 'bookings_trips', channel: 'email', enabled: false },
    ] as never)
    await notifyPayoutFailed(USER_ID, { reason: 'beneficiary_rejected', bookingTitle: 'Trek' })
    expect(sendPush).toHaveBeenCalledWith(USER_ID, expect.objectContaining({
      type: 'payout_failed',
    }))
    expect(sendEmail).toHaveBeenCalled()
  })

  it('includes reason in push and email when provided', async () => {
    mockUserLookup({ email: 'asha@example.com', display_name: 'Asha' })
    await notifyPayoutFailed(USER_ID, { reason: 'insufficient_funds', bookingTitle: null })
    const pushCall = vi.mocked(sendPush).mock.calls[0]?.[1] as { body: string } | undefined
    expect(pushCall?.body).toContain('insufficient_funds')
  })
})

describe('notifyLinkedAccountActionRequired', () => {
  it('routes to /kyc for needs_clarification', async () => {
    mockUserLookup({ email: 'asha@example.com', display_name: 'Asha' })
    await notifyLinkedAccountActionRequired(USER_ID, { reason: 'needs_clarification' })
    expect(sendPush).toHaveBeenCalledWith(USER_ID, expect.objectContaining({
      type: 'payout_action_required',
      targetRoute: '/kyc',
      title: expect.stringContaining('needs more info'),
    }))
  })

  it('uses distinct subject for rejected vs suspended', async () => {
    mockUserLookup({ email: 'asha@example.com', display_name: 'Asha' })
    await notifyLinkedAccountActionRequired(USER_ID, { reason: 'rejected' })
    const pushCall = vi.mocked(sendPush).mock.calls[0]?.[1] as { title: string } | undefined
    expect(pushCall?.title).toContain('rejected')
  })
})
