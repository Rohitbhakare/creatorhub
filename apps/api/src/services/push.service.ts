import { firebaseMessaging } from '../lib/firebase.js'
import { getDndStatus, getPreferences } from './notification.service.js'
import { getUserDeviceTokens } from './device.service.js'

// ─── Types ────────────────────────────────────────────────────

export interface PushPayload {
  type: 'new_follower' | 'new_comment' | 'new_like_milestone' | 'new_booking' | string
  title: string
  body: string
  category: string
  data?: Record<string, string>
  targetRoute?: string
}

// ─── Send Push ───────────────────────────────────────────────

/**
 * Send a push notification to a single user.
 * Fire-and-forget — never throws. All errors are caught and logged.
 */
export async function sendPush(userId: string, payload: PushPayload): Promise<void> {
  try {
    // 1. Check DND — transactional (bookings_trips) bypasses DND
    const dnd = await getDndStatus(userId)
    if (dnd && payload.category !== 'bookings_trips') {
      return
    }

    // 2. Check user push preference for this category
    const prefs = await getPreferences(userId)
    const pref = prefs.find((p) => p.category === payload.category && p.channel === 'push')
    if (pref && !pref.enabled) {
      return
    }

    // 3. Get device tokens
    const tokens = await getUserDeviceTokens(userId)
    if (tokens.length === 0) {
      return
    }

    // 4. Build data map — merge targetRoute into data if provided
    const dataMap: Record<string, string> = {
      type: payload.type,
      category: payload.category,
      ...(payload.data ?? {}),
    }
    if (payload.targetRoute !== undefined) {
      dataMap.targetRoute = payload.targetRoute
    }

    // 5. Send via Firebase multicast
    await firebaseMessaging.sendEachForMulticast({
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: dataMap,
    })
  } catch (err) {
    // Fire-and-forget — never propagate push errors to callers
    console.error('[push] Failed to send push notification to user', userId, err)
  }
}

// ─── Send Push Batch ─────────────────────────────────────────

/**
 * Send a push notification to multiple users in parallel.
 * Uses Promise.allSettled — never rejects.
 */
export async function sendPushBatch(userIds: string[], payload: PushPayload): Promise<void> {
  await Promise.allSettled(userIds.map((uid) => sendPush(uid, payload)))
}
