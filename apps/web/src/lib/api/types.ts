/**
 * Shared API DTO types — mirror the Hono API contract.
 * Mobile parity types live in @creatorhub/shared; we duplicate the subset we
 * need on the web rather than pulling the whole package.
 */

export type ContentType = 'post' | 'itinerary' | 'experience' | 'event'
export type Vertical = 'travel' | 'stories'

export interface Creator {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  vertical: Vertical
  isVerified?: boolean
}

export interface ContentCard {
  id: string
  /** Human-readable URL slug (set by API once migration 031 lands). */
  slug?: string | null
  type: ContentType
  title: string
  summary?: string | null
  coverImageUrl: string | null
  priceInPaisa: number
  isFree: boolean
  status?: string
  city?: string | null
  durationDays?: number | null
  distanceKm?: number | null
  rating?: number | null
  saveCount?: number | null
  viewCount?: number | null
  startsAt?: string | null
  creator?: Creator
  tags?: string[]
}

export interface ContentDetail extends ContentCard {
  description: string | null
  body: string | null
  endsAt: string | null
  creator: Creator
  spots?: ItinerarySpot[]
  scheduledDates?: ScheduledDate[]
  eventOccurrences?: EventOccurrence[]
}

export interface ItinerarySpot {
  id: string
  dayNumber: number
  orderIndex: number
  name: string
  description: string | null
  lat: number | null
  lng: number | null
  distanceFromPreviousKm: number | null
  durationFromPreviousMin: number | null
  thumbnailUrl: string | null
}

export interface ScheduledDate {
  id: string
  startsAt: string
  endsAt: string
  capacity: number
  seatsBooked: number
  seatsHeld: number
  status: 'open' | 'sold_out' | 'cancelled' | 'completed'
}

export interface EventOccurrence {
  id: string
  startsAt: string
  endsAt: string
  capacity: number | null
  rsvpCount: number
  status: 'open' | 'closed' | 'cancelled' | 'completed'
}

export interface CreatorProfile extends Creator {
  bio: string | null
  coverUrl: string | null
  followerCount: number
  contentCount: number
  averageRating: number | null
  isCreator: boolean
  links?: { instagram?: string; youtube?: string; website?: string }
  content?: ContentCard[]
}

export interface FeedSection {
  id: string
  title: string
  subtitle?: string
  items: ContentCard[]
}

export interface SearchResult {
  contents: ContentCard[]
  creators: Creator[]
  cities: { name: string; count: number }[]
  total: number
}

export interface City {
  id: string
  name: string
  state: string
  contentCount: number
}

export interface BookingIntent {
  intent_id: string
  expires_at: string
  travellers: number
}

export interface BookingDraft {
  intentId: string
  contentId: string
  scheduledDateId?: string
  eventOccurrenceId?: string
  travellers: number
  expiresAt: string
  pricePaisa: number
  platformFeePaisa: number
  gstPaisa: number
  totalPaisa: number
}

export interface Booking {
  id: string
  contentId: string
  contentTitle: string
  contentType: ContentType
  creator: Creator
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'refund_pending'
  startsAt: string | null
  travellers: number
  totalPaisa: number
  bookedAt: string
}

export interface StudioMetrics {
  earningsLast30dPaisa: number
  bookingsLast30d: number
  savesLast30d: number
  followerCount: number
  earningsTrend: { date: string; valuePaisa: number }[]
  recentActivity: { id: string; type: string; message: string; at: string }[]
}

export interface QuestSummary {
  completedToday: number
  totalToday: number
  streakDays: number
  level: number
  xp: number
  xpToNextLevel: number
  brokenStreakAlert: boolean
}

export interface Notification {
  id: string
  actorId: string | null
  actorName: string
  actorAvatarUrl: string | null
  verb: string
  message: string
  href: string | null
  isRead: boolean
  createdAt: string
}
