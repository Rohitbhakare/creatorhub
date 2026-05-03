/**
 * Public API surface — re-exports from feature-organised modules so callers
 * import from `@/lib/api` rather than reaching into internals.
 */
import { cache } from 'react'
import { apiFetch, apiFetchPublic } from '../api-client'
import type {
  Booking,
  BookingIntent,
  ContentDetail,
  ContentType,
  CreatorProfile,
  Notification,
  QuestSummary,
  StudioMetrics,
} from './types'
import {
  listOf,
  transformBooking,
  transformContentDetail,
  transformCreatorProfile,
  transformNotification,
} from './transforms'

export * from './types'
export * from './feed'
export * from './discover'

// ───────── Public surface (guest-friendly) ─────────

export async function fetchCreatorProfile(username: string): Promise<CreatorProfile | null> {
  const raw = await apiFetchPublic<unknown>(
    `/api/v1/users/by-username/${encodeURIComponent(username)}`,
    { next: { revalidate: 60, tags: [`creator:${username}`] } },
  )
  if (!raw) return null
  return transformCreatorProfile(raw as Parameters<typeof transformCreatorProfile>[0])
}

export async function fetchContentDetail(contentId: string): Promise<ContentDetail | null> {
  const raw = await apiFetchPublic<unknown>(
    `/api/v1/content/${encodeURIComponent(contentId)}`,
    { next: { revalidate: 30, tags: [`content:${contentId}`] } },
  )
  if (!raw) return null
  try {
    return transformContentDetail(raw as Parameters<typeof transformContentDetail>[0])
  } catch {
    return null
  }
}

/**
 * Active cities for the home/discover chip rail. Calls the discover/cities
 * endpoint which returns `{ cities: [{ city_id, name, state, content_count }] }`
 * ordered by content_count desc.
 */
export interface PopularCity {
  id: string | null
  name: string
  count: number
}

export async function fetchPopularCities(): Promise<PopularCity[]> {
  try {
    const data = await apiFetchPublic<{ cities?: unknown[] }>(`/api/v1/discover/cities`, {
      next: { revalidate: 3600, tags: ['cities'] },
    })
    const rows = Array.isArray(data?.cities) ? data.cities : []
    return rows
      .map((c) => {
        if (typeof c !== 'object' || c === null) return null
        const r = c as {
          city_id?: string
          name?: string
          content_count?: number
          count?: number
        }
        if (!r.name) return null
        return {
          id: typeof r.city_id === 'string' ? r.city_id : null,
          name: r.name,
          count: r.content_count ?? r.count ?? 0,
        }
      })
      .filter((c): c is PopularCity => c !== null)
  } catch {
    return []
  }
}

// ───────── Authed surface ─────────

export async function fetchMyBookings(): Promise<Booking[]> {
  try {
    const data = await apiFetch<unknown>(`/api/v1/bookings/me`, { next: { revalidate: 0 } })
    return listOf(data, transformBooking)
  } catch {
    return []
  }
}

/**
 * Fetch a single booking by id (for the confirmation page, E5.4 T6).
 * 401 + 404 paths return null so the page can map them to redirect/notFound().
 */
export async function fetchBookingById(id: string): Promise<Booking | null> {
  try {
    const raw = await apiFetch<unknown>(`/api/v1/bookings/${encodeURIComponent(id)}`, {
      next: { revalidate: 0 },
    })
    if (!raw) return null
    return transformBooking(raw as Parameters<typeof transformBooking>[0])
  } catch {
    return null
  }
}

export async function fetchStudioMetrics(): Promise<StudioMetrics | null> {
  try {
    return await apiFetch<StudioMetrics>(`/api/v1/studio/metrics`, { next: { revalidate: 60 } })
  } catch {
    return null
  }
}

export interface StudioContent {
  id: string
  slug?: string | null
  type: ContentType
  title: string
  status: 'draft' | 'published' | 'archived' | 'rejected'
  publishedAt: string | null
  views: number
  saves: number
  bookings: number
  priceInPaisa: number
  isFree: boolean
}

export async function fetchStudioContents(): Promise<StudioContent[]> {
  try {
    const data = await apiFetch<{ items: StudioContent[] }>(`/api/v1/studio/content`, {
      next: { revalidate: 30 },
    })
    return data.items
  } catch {
    return []
  }
}

export interface StudioBookingRow {
  id: string
  contentId: string
  contentTitle: string
  travellerName: string
  travellerEmail: string
  pax: number
  status: Booking['status']
  totalPaisa: number
  startsAt: string | null
  bookedAt: string
}

export async function fetchStudioBookings(): Promise<StudioBookingRow[]> {
  try {
    const data = await apiFetch<{ items: StudioBookingRow[] }>(
      `/api/v1/studio/bookings`,
      { next: { revalidate: 30 } },
    )
    return data.items
  } catch {
    return []
  }
}

export interface StudioReview {
  id: string
  contentId: string
  contentTitle: string
  reviewerName: string
  rating: number
  body: string
  createdAt: string
  reply: string | null
}

export async function fetchStudioReviews(): Promise<StudioReview[]> {
  try {
    const data = await apiFetch<{ items: StudioReview[] }>(`/api/v1/studio/reviews`, {
      next: { revalidate: 30 },
    })
    return data.items
  } catch {
    return []
  }
}

export interface PayoutRow {
  id: string
  bookingId: string
  date: string
  grossPaisa: number
  platformFeePaisa: number
  tdsPaisa: number
  gstPaisa: number
  netPaisa: number
  utr: string | null
  status: 'pending' | 'initiated' | 'settled' | 'failed'
}

export async function fetchPayouts(): Promise<PayoutRow[]> {
  try {
    const data = await apiFetch<{ items: PayoutRow[] }>(`/api/v1/creators/me/payouts`, {
      next: { revalidate: 60 },
    })
    return data.items
  } catch {
    return []
  }
}

export interface AchievementSummary {
  id: string
  name: string
  description: string
  unlocked: boolean
  progress?: { current: number; total: number }
  xpReward: number
}

export async function fetchAchievements(): Promise<AchievementSummary[]> {
  try {
    const data = await apiFetch<{ items: AchievementSummary[] }>(
      `/api/v1/social/quests/achievements`,
      { next: { revalidate: 60 } },
    )
    return data.items
  } catch {
    return []
  }
}

export interface LeaderboardRow {
  rank: number
  userId: string
  displayName: string
  avatarUrl: string | null
  city: string | null
  xp: number
  isMe: boolean
}

export async function fetchLeaderboard(scope: 'city' | 'national' | 'all-time'): Promise<LeaderboardRow[]> {
  try {
    const data = await apiFetch<{ items: LeaderboardRow[] }>(
      `/api/v1/social/quests/leaderboard?scope=${scope}`,
      { next: { revalidate: 60 } },
    )
    return data.items
  } catch {
    return []
  }
}

// Per-request memoised so the home page can await this for the header
// streak chip AND have <HomeFeed> re-read it for QuestStripInline without
// hitting the API twice in one render.
export const fetchQuestSummary = cache(_fetchQuestSummary)

async function _fetchQuestSummary(): Promise<QuestSummary | null> {
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
    const data = await apiFetch<unknown>(`/api/v1/notifications`, { next: { revalidate: 0 } })
    return listOf(data, transformNotification)
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
