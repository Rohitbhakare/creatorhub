/**
 * Public API surface — re-exports from feature-organised modules so callers
 * import from `@/lib/api` rather than reaching into internals.
 */
import { apiFetch, apiFetchPublic } from '../api-client'
import type {
  Booking,
  BookingIntent,
  ContentDetail,
  CreatorProfile,
  Notification,
  QuestSummary,
  StudioMetrics,
} from './types'

export * from './types'
export * from './feed'

// ───────── Public surface (guest-friendly) ─────────

export async function fetchCreatorProfile(username: string): Promise<CreatorProfile | null> {
  return apiFetchPublic<CreatorProfile>(`/api/v1/users/by-username/${encodeURIComponent(username)}`, {
    next: { revalidate: 60, tags: [`creator:${username}`] },
  })
}

export async function fetchContentDetail(contentId: string): Promise<ContentDetail | null> {
  return apiFetchPublic<ContentDetail>(`/api/v1/content/${encodeURIComponent(contentId)}`, {
    next: { revalidate: 30, tags: [`content:${contentId}`] },
  })
}

export async function fetchPopularCities(): Promise<{ name: string; count: number }[]> {
  try {
    const data = await apiFetchPublic<{ items: { name: string; count: number }[] }>(
      `/api/v1/cities/popular`,
      { next: { revalidate: 3600 } },
    )
    return data?.items ?? []
  } catch {
    return []
  }
}

// ───────── Authed surface ─────────

export async function fetchMyBookings(): Promise<Booking[]> {
  try {
    const data = await apiFetch<{ items: Booking[] }>(`/api/v1/bookings/me`, {
      next: { revalidate: 0 },
    })
    return data.items
  } catch {
    return []
  }
}

export async function fetchStudioMetrics(): Promise<StudioMetrics | null> {
  try {
    return await apiFetch<StudioMetrics>(`/api/v1/studio/metrics`, { next: { revalidate: 60 } })
  } catch {
    return null
  }
}

export async function fetchQuestSummary(): Promise<QuestSummary | null> {
  try {
    return await apiFetch<QuestSummary>(`/api/v1/social/quests/summary`, {
      next: { revalidate: 0 },
    })
  } catch {
    return null
  }
}

export async function fetchNotifications(): Promise<Notification[]> {
  try {
    const data = await apiFetch<{ items: Notification[] }>(`/api/v1/notifications`, {
      next: { revalidate: 0 },
    })
    return data.items
  } catch {
    return []
  }
}

// ───────── Booking — concurrency-safe seat hold ─────────

export interface CreateBookingIntentInput {
  content_id: string
  scheduled_date_id?: string
  event_occurrence_id?: string
  travellers?: number
}

/**
 * Creates a server-side booking intent (seat hold). Backed by
 * /api/v1/booking-intents which uses an INSERT … RETURNING in a transaction
 * with a row lock on the scheduled_date / event_occurrence row, preventing
 * two concurrent users from holding the same last seat.
 *
 * Caller must pass an Idempotency-Key on retry to avoid double-holds.
 */
export async function createBookingIntent(
  input: CreateBookingIntentInput,
  idempotencyKey: string,
): Promise<BookingIntent> {
  return apiFetch<BookingIntent>(`/api/v1/booking-intents`, {
    method: 'POST',
    body: input,
    idempotencyKey,
    timeoutMs: 8_000,
    retries: 0, // never retry creation — would risk a duplicate hold
  })
}

export async function releaseBookingIntent(intentId: string): Promise<void> {
  await apiFetch<{ released: boolean }>(`/api/v1/booking-intents/${intentId}`, {
    method: 'DELETE',
    retries: 1,
  })
}

// ───────── Utility re-exports ─────────

export { formatPrice, formatPriceShort } from '../format'
