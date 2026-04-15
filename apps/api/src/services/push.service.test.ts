import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ──────────────────────────────────────────────────────────────

// Mock Firebase messaging
vi.mock('../lib/firebase.js', () => ({
  firebaseMessaging: {
    sendEachForMulticast: vi.fn(),
  },
}))

// Mock notification service
vi.mock('./notification.service.js', () => ({
  getDndStatus: vi.fn(),
  getPreferences: vi.fn(),
}))

// Mock device service
vi.mock('./device.service.js', () => ({
  getUserDeviceTokens: vi.fn(),
}))

import { sendPush, sendPushBatch } from './push.service.js'
import { firebaseMessaging } from '../lib/firebase.js'
import { getDndStatus, getPreferences } from './notification.service.js'
import { getUserDeviceTokens } from './device.service.js'

// ─── Fixtures ──────────────────────────────────────────────────────────

const USER_A = 'aaa-111-aaa-111-aaa111aa1111'
const USER_B = 'bbb-222-bbb-222-bbb222bb2222'

const PAYLOAD = {
  type: 'new_follower',
  title: 'New follower',
  body: 'Someone started following you',
  category: 'activity_own_content',
  data: { targetRoute: '/profile/aaa' },
}

beforeEach(() => {
  vi.resetAllMocks()
})

// ── sendPush ───────────────────────────────────────────────────────────

describe('sendPush', () => {
  it('sends push notification to all device tokens', async () => {
    vi.mocked(getDndStatus).mockResolvedValue(false)
    vi.mocked(getPreferences).mockResolvedValue([
      { category: 'activity_own_content', channel: 'push', enabled: true },
    ])
    vi.mocked(getUserDeviceTokens).mockResolvedValue(['token1', 'token2'])
    vi.mocked(firebaseMessaging.sendEachForMulticast).mockResolvedValue({
      successCount: 2,
      failureCount: 0,
      responses: [],
    })

    await sendPush(USER_A, PAYLOAD)

    expect(firebaseMessaging.sendEachForMulticast).toHaveBeenCalledWith(
      expect.objectContaining({
        tokens: ['token1', 'token2'],
        notification: { title: PAYLOAD.title, body: PAYLOAD.body },
      }),
    )
  })

  it('skips sending when DND is enabled and category is not bookings_trips', async () => {
    vi.mocked(getDndStatus).mockResolvedValue(true)

    await sendPush(USER_A, PAYLOAD) // category = activity_own_content

    expect(firebaseMessaging.sendEachForMulticast).not.toHaveBeenCalled()
  })

  it('sends even when DND is enabled if category is bookings_trips', async () => {
    vi.mocked(getDndStatus).mockResolvedValue(true)
    vi.mocked(getPreferences).mockResolvedValue([
      { category: 'bookings_trips', channel: 'push', enabled: true },
    ])
    vi.mocked(getUserDeviceTokens).mockResolvedValue(['token1'])
    vi.mocked(firebaseMessaging.sendEachForMulticast).mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      responses: [],
    })

    await sendPush(USER_A, { ...PAYLOAD, category: 'bookings_trips', type: 'new_booking' })

    expect(firebaseMessaging.sendEachForMulticast).toHaveBeenCalled()
  })

  it('skips sending when push preference is disabled for category', async () => {
    vi.mocked(getDndStatus).mockResolvedValue(false)
    vi.mocked(getPreferences).mockResolvedValue([
      { category: 'activity_own_content', channel: 'push', enabled: false },
    ])

    await sendPush(USER_A, PAYLOAD)

    expect(getUserDeviceTokens).not.toHaveBeenCalled()
    expect(firebaseMessaging.sendEachForMulticast).not.toHaveBeenCalled()
  })

  it('skips sending when user has no registered device tokens', async () => {
    vi.mocked(getDndStatus).mockResolvedValue(false)
    vi.mocked(getPreferences).mockResolvedValue([
      { category: 'activity_own_content', channel: 'push', enabled: true },
    ])
    vi.mocked(getUserDeviceTokens).mockResolvedValue([])

    await sendPush(USER_A, PAYLOAD)

    expect(firebaseMessaging.sendEachForMulticast).not.toHaveBeenCalled()
  })

  it('never throws when Firebase sendEachForMulticast throws (fire-and-forget)', async () => {
    vi.mocked(getDndStatus).mockResolvedValue(false)
    vi.mocked(getPreferences).mockResolvedValue([
      { category: 'activity_own_content', channel: 'push', enabled: true },
    ])
    vi.mocked(getUserDeviceTokens).mockResolvedValue(['token1'])
    vi.mocked(firebaseMessaging.sendEachForMulticast).mockRejectedValue(new Error('Firebase error'))

    // Must not throw
    await expect(sendPush(USER_A, PAYLOAD)).resolves.toBeUndefined()
  })

  it('never throws when a dependency service throws (fire-and-forget)', async () => {
    vi.mocked(getDndStatus).mockRejectedValue(new Error('DB down'))

    await expect(sendPush(USER_A, PAYLOAD)).resolves.toBeUndefined()
  })
})

// ── sendPushBatch ──────────────────────────────────────────────────────

describe('sendPushBatch', () => {
  it('sends push to all users in parallel', async () => {
    vi.mocked(getDndStatus).mockResolvedValue(false)
    vi.mocked(getPreferences).mockResolvedValue([
      { category: 'activity_own_content', channel: 'push', enabled: true },
    ])
    vi.mocked(getUserDeviceTokens).mockResolvedValue(['token1'])
    vi.mocked(firebaseMessaging.sendEachForMulticast).mockResolvedValue({
      successCount: 1,
      failureCount: 0,
      responses: [],
    })

    await sendPushBatch([USER_A, USER_B], PAYLOAD)

    expect(firebaseMessaging.sendEachForMulticast).toHaveBeenCalledTimes(2)
  })

  it('never rejects even when some users fail (Promise.allSettled)', async () => {
    vi.mocked(getDndStatus).mockRejectedValue(new Error('DB error'))

    await expect(sendPushBatch([USER_A, USER_B], PAYLOAD)).resolves.toBeUndefined()
  })
})
