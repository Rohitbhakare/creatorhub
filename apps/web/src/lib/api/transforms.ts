import 'server-only'
import type {
  Booking,
  ContentCard,
  ContentDetail,
  ContentType,
  Creator,
  CreatorProfile,
  ItinerarySpot,
  Notification,
  ScheduledDate,
  Vertical,
} from './types'

/**
 * The Hono API speaks snake_case and embeds metadata in different field
 * names than our web DTOs. These transforms keep the boundary clean — UI
 * code only ever sees camelCase typed objects, regardless of how the API
 * shape evolves.
 */

interface RawCreator {
  id?: string
  username?: string | null
  display_name?: string | null
  avatar_url?: string | null
  vertical?: string | null
  is_verified?: boolean
  bio?: string | null
  cover_url?: string | null
  follower_count?: number
  content_count?: number
  average_rating?: number | null
  is_creator?: boolean
  links?: { instagram?: string; youtube?: string; website?: string }
  content?: RawContent[]
}

interface RawContent {
  id?: string
  type?: ContentType
  title?: string
  summary?: string | null
  description?: string | null
  body?: string | null
  cover_image_url?: string | null
  cover_url?: string | null
  price_paisa?: number
  price_in_paisa?: number
  pricing_model?: 'free' | 'paid'
  is_free?: boolean
  status?: string
  starting_city_id?: string | null
  city?: string | null
  duration_days?: number | null
  duration_minutes?: number | null
  distance_km?: number | null
  rating?: number | null
  average_rating?: number | null
  save_count?: number | null
  view_count?: number | null
  like_count?: number | null
  start_at?: string | null
  starts_at?: string | null
  end_at?: string | null
  ends_at?: string | null
  published_at?: string | null
  creator?: RawCreator
  tags?: string[] | Record<string, unknown>
  vertical?: string | null
  scheduled_dates?: RawScheduledDate[]
  spots?: RawSpot[]
}

interface RawScheduledDate {
  id?: string
  starts_at?: string
  ends_at?: string
  capacity?: number
  seats_booked?: number
  seats_held?: number
  status?: string
}

interface RawSpot {
  id?: string
  day_number?: number
  order_index?: number
  name?: string
  description?: string | null
  lat?: number | null
  lng?: number | null
  distance_from_previous_km?: number | null
  duration_from_previous_min?: number | null
  thumbnail_url?: string | null
}

interface RawNotification {
  id?: string
  actor_id?: string | null
  actor_name?: string
  actor_avatar_url?: string | null
  verb?: string
  message?: string
  href?: string | null
  is_read?: boolean
  created_at?: string
}

interface RawBooking {
  id?: string
  content_id?: string
  content_title?: string
  content_type?: ContentType
  creator?: RawCreator
  status?: Booking['status']
  starts_at?: string | null
  travellers?: number
  total_paisa?: number
  booked_at?: string
}

const VALID_VERTICALS: Vertical[] = ['travel', 'stories']

function asVertical(v?: string | null): Vertical {
  return v && VALID_VERTICALS.includes(v as Vertical) ? (v as Vertical) : 'travel'
}

function tagsToArray(tags?: string[] | Record<string, unknown> | null): string[] {
  if (!tags) return []
  if (Array.isArray(tags)) return tags.filter((t): t is string => typeof t === 'string')
  // tags object — collect non-null string values from known keys
  const out: string[] = []
  for (const v of Object.values(tags)) {
    if (typeof v === 'string' && v.length > 0) out.push(v)
  }
  return out
}

function locationLabel(raw: RawContent): string | null {
  const tagsObj = raw.tags
  if (tagsObj && !Array.isArray(tagsObj) && typeof tagsObj === 'object') {
    const label = tagsObj['location_label']
    if (typeof label === 'string') return label
  }
  return raw.city ?? null
}

export function transformCreator(raw: RawCreator | undefined): Creator | undefined {
  if (!raw?.id) return undefined
  return {
    id: raw.id,
    username: raw.username ?? '',
    displayName: raw.display_name ?? '',
    avatarUrl: raw.avatar_url ?? null,
    vertical: asVertical(raw.vertical),
    ...(raw.is_verified !== undefined ? { isVerified: raw.is_verified } : {}),
  }
}

export function transformContentCard(raw: RawContent): ContentCard {
  const priceInPaisa = raw.price_in_paisa ?? raw.price_paisa ?? 0
  const isFree =
    raw.is_free !== undefined
      ? raw.is_free
      : raw.pricing_model !== undefined
        ? raw.pricing_model === 'free'
        : priceInPaisa === 0
  const creator = transformCreator(raw.creator)
  return {
    id: raw.id ?? '',
    type: raw.type ?? 'post',
    title: raw.title ?? '',
    coverImageUrl: raw.cover_image_url ?? raw.cover_url ?? null,
    priceInPaisa,
    isFree,
    summary: raw.summary ?? raw.description ?? null,
    ...(raw.status !== undefined ? { status: raw.status } : {}),
    city: locationLabel(raw),
    durationDays: raw.duration_days ?? null,
    rating: raw.rating ?? raw.average_rating ?? null,
    saveCount: raw.save_count ?? raw.like_count ?? null,
    viewCount: raw.view_count ?? null,
    startsAt: raw.start_at ?? raw.starts_at ?? null,
    ...(creator ? { creator } : {}),
    tags: tagsToArray(raw.tags),
  }
}

export function transformScheduledDate(raw: RawScheduledDate): ScheduledDate {
  const status = (raw.status ?? 'open') as ScheduledDate['status']
  return {
    id: raw.id ?? '',
    startsAt: raw.starts_at ?? '',
    endsAt: raw.ends_at ?? '',
    capacity: raw.capacity ?? 0,
    seatsBooked: raw.seats_booked ?? 0,
    seatsHeld: raw.seats_held ?? 0,
    status,
  }
}

export function transformSpot(raw: RawSpot): ItinerarySpot {
  return {
    id: raw.id ?? '',
    dayNumber: raw.day_number ?? 1,
    orderIndex: raw.order_index ?? 0,
    name: raw.name ?? '',
    description: raw.description ?? null,
    lat: raw.lat ?? null,
    lng: raw.lng ?? null,
    distanceFromPreviousKm: raw.distance_from_previous_km ?? null,
    durationFromPreviousMin: raw.duration_from_previous_min ?? null,
    thumbnailUrl: raw.thumbnail_url ?? null,
  }
}

export function transformContentDetail(raw: RawContent): ContentDetail {
  const card = transformContentCard(raw)
  const creator = transformCreator(raw.creator)
  if (!creator) {
    throw new Error('content detail missing creator')
  }
  return {
    ...card,
    description: raw.description ?? null,
    body: raw.body ?? null,
    endsAt: raw.end_at ?? raw.ends_at ?? null,
    creator,
    spots: raw.spots ? raw.spots.map(transformSpot) : [],
    scheduledDates: raw.scheduled_dates ? raw.scheduled_dates.map(transformScheduledDate) : [],
  }
}

export function transformCreatorProfile(raw: RawCreator): CreatorProfile {
  return {
    id: raw.id ?? '',
    username: raw.username ?? '',
    displayName: raw.display_name ?? '',
    avatarUrl: raw.avatar_url ?? null,
    vertical: asVertical(raw.vertical),
    bio: raw.bio ?? null,
    coverUrl: raw.cover_url ?? null,
    followerCount: raw.follower_count ?? 0,
    contentCount: raw.content_count ?? 0,
    averageRating: raw.average_rating ?? null,
    isCreator: raw.is_creator ?? false,
    ...(raw.links ? { links: raw.links } : {}),
    ...(raw.content ? { content: raw.content.map(transformContentCard) } : {}),
  }
}

export function transformNotification(raw: RawNotification): Notification {
  return {
    id: raw.id ?? '',
    actorId: raw.actor_id ?? null,
    actorName: raw.actor_name ?? '',
    actorAvatarUrl: raw.actor_avatar_url ?? null,
    verb: raw.verb ?? '',
    message: raw.message ?? '',
    href: raw.href ?? null,
    isRead: raw.is_read ?? false,
    createdAt: raw.created_at ?? '',
  }
}

export function transformBooking(raw: RawBooking): Booking {
  const creator = transformCreator(raw.creator) ?? {
    id: '',
    username: '',
    displayName: '',
    avatarUrl: null,
    vertical: 'travel',
  }
  return {
    id: raw.id ?? '',
    contentId: raw.content_id ?? '',
    contentTitle: raw.content_title ?? '',
    contentType: raw.content_type ?? 'experience',
    creator,
    status: raw.status ?? 'confirmed',
    startsAt: raw.starts_at ?? null,
    travellers: raw.travellers ?? 1,
    totalPaisa: raw.total_paisa ?? 0,
    bookedAt: raw.booked_at ?? '',
  }
}

/**
 * Many endpoints return `data: [...]` directly. Use this to coerce a
 * `apiFetch<unknown>` response into a typed array via a transform.
 * The transform is responsible for narrowing the unknown input.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function listOf<T>(raw: unknown, fn: (r: any) => T): T[] {
  if (!Array.isArray(raw)) return []
  return (raw as unknown[]).map((item) => fn(item))
}
