import { supabase } from '../lib/supabase.js'
import { posthogTrack } from '../lib/posthog.js'

// ─── Core track call ─────────────────────────────────────────────────────────
// Writes to analytics_events (Postgres) + forwards to PostHog.
// Both writes are fire-and-forget — analytics must never fail a request.

export function track(params: {
  userId?: string | null
  sessionId?: string | null
  eventName: string
  properties?: Record<string, unknown>
  platform?: string
}): void {
  const { userId, sessionId, eventName, properties = {}, platform = 'mobile' } = params

  // Persist to Postgres (90-day rolling retention via cron)
  supabase
    .from('analytics_events')
    .insert({
      user_id: userId ?? null,
      session_id: sessionId ?? null,
      event_name: eventName,
      properties,
      platform,
    })
    .then()

  // Forward to PostHog
  const distinctId = userId ?? sessionId ?? 'anonymous'
  posthogTrack(distinctId, eventName, { ...properties, platform })
}

// ─── Named event helpers ──────────────────────────────────────────────────────
// Keeps call sites clean — no magic string duplication.

export function trackContentView(userId: string | null, contentId: string, contentType: string): void {
  track({ userId, eventName: 'content_viewed', properties: { content_id: contentId, content_type: contentType } })
}

export function trackLike(userId: string, contentId: string, liked: boolean): void {
  track({ userId, eventName: liked ? 'content_liked' : 'content_unliked', properties: { content_id: contentId } })
}

export function trackFollow(userId: string, targetId: string, followed: boolean): void {
  track({ userId, eventName: followed ? 'creator_followed' : 'creator_unfollowed', properties: { target_id: targetId } })
}

export function trackShare(userId: string | null, contentId: string, platform: string): void {
  track({ userId, eventName: 'content_shared', properties: { content_id: contentId, share_platform: platform } })
}

export function trackSave(userId: string, contentId: string, saved: boolean): void {
  track({ userId, eventName: saved ? 'content_saved' : 'content_unsaved', properties: { content_id: contentId } })
}

export function trackBookingStarted(userId: string, experienceId: string): void {
  track({ userId, eventName: 'booking_started', properties: { experience_id: experienceId } })
}

export function trackContentPublished(userId: string, contentId: string, contentType: string): void {
  track({ userId, eventName: 'content_published', properties: { content_id: contentId, content_type: contentType } })
}

export function trackPayoutProcessed(userId: string, amountPaisa: number): void {
  track({ userId, eventName: 'payout_processed', properties: { amount_paisa: amountPaisa } })
}
