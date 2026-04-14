import type { Vertical, ContentType, ContentStatus } from '../constants/index.js'

// ─── City ────────────────────────────────────────────────────
export type City = {
  id: string          // stable slug: 'in.mh.pune'
  name: string
  state: string
  country: string
  lat?: number
  lng?: number
}

// ─── User ────────────────────────────────────────────────────
export type KycStatus = 'not_started' | 'pending' | 'verified' | 'rejected' | 'expired'

export type UserProfile = {
  id: string
  phone: string
  display_name: string | null
  username: string | null
  bio: string | null
  email: string | null
  avatar_url: string | null
  is_creator: boolean
  kyc_status: KycStatus
  current_city: City | null
  active_verticals: Vertical[]
  onboarding_completed_at: string | null
  username_changed_at: string | null
  follower_count: number
  following_count: number
  content_count: number
  created_at: string
}

export type PublicProfile = {
  id: string
  display_name: string | null
  username: string | null
  bio: string | null
  avatar_url: string | null
  is_creator: boolean
  current_city: City | null
  active_verticals: Vertical[]
  featured: boolean
  follower_count: number
  following_count: number
  content_count: number
  is_following: boolean | null    // null for guests
  created_at: string
}

// ─── Content ─────────────────────────────────────────────────
export type PricingModel = 'free' | 'paid'
export type Visibility = 'public' | 'unlisted' | 'private'

export type ContentBase = {
  id: string
  user_id: string
  type: ContentType
  vertical: Vertical
  status: ContentStatus
  visibility: Visibility
  pricing_model: PricingModel
  title: string
  description: string | null
  cover_image_url: string | null
  starting_city: City | null
  tags: string[]
  like_count: number
  comment_count: number
  save_count: number
  view_count: number
  created_at: string
  published_at: string | null
}

// ─── Content Media ──────────────────────────────────────────
export type MediaType = 'image' | 'video' | 'audio'

export type ContentMedia = {
  id: string
  content_id: string
  media_type: MediaType
  url: string
  thumbnail_url: string | null
  alt_text: string | null
  width: number | null
  height: number | null
  duration_seconds: number | null
  file_size_bytes: number | null
  display_order: number
}

// ─── Content Detail Types ───────────────────────────────────
import type { SpotStopType } from '../constants/index.js'

export type ItinerarySpot = {
  id: string
  itinerary_day_id: string
  spot_order: number
  google_place_id: string | null
  name: string
  category: string | null
  lat: number
  lng: number
  thumbnail_url: string | null
  creator_note: string | null
  duration_minutes: number | null
  stop_type: SpotStopType
  is_free_preview: boolean
}

export type ItineraryDay = {
  id: string
  content_id: string
  day_number: number
  title: string | null
  description: string | null
  total_distance_km: number | null
  estimated_hours: number | null
  spots: ItinerarySpot[]
}

export type PostDetail = ContentBase & {
  type: 'post'
  body: string | null
  media: ContentMedia[]
  creator: PublicProfile
}

export type ItineraryDetail = ContentBase & {
  type: 'self_paced_itinerary'
  duration_minutes: number | null
  price_paisa: number
  sub_category_id: string | null
  destination_city_ids: string[]
  days: ItineraryDay[]
  media: ContentMedia[]
  creator: PublicProfile
}

// ─── Content List Item ──────────────────────────────────────
export type ContentListItem = ContentBase & {
  creator: {
    id: string
    display_name: string | null
    username: string | null
    avatar_url: string | null
  }
  price_paisa: number
  duration_minutes: number | null
}

// ─── Draft ──────────────────────────────────────────────────
export type DraftSummary = {
  id: string
  type: ContentType
  title: string | null
  updated_at: string
}

// ─── Places ─────────────────────────────────────────────────
export type PlacePrediction = {
  place_id: string
  description: string
  main_text: string
  secondary_text: string
}

export type PlaceDetails = {
  place_id: string
  name: string
  formatted_address: string
  lat: number
  lng: number
  photo_url: string | null
  types: string[]
}

// ─── Signed URL ─────────────────────────────────────────────
export type SignedUrlResult = {
  upload_url: string
  public_url: string
  file_path: string
}

// ─── API Responses ───────────────────────────────────────────
export type ApiSuccess<T> = {
  success: true
  data: T
}

export type ApiSuccessWithMeta<T> = {
  success: true
  data: T
  meta: {
    next_cursor: string | null
    has_more: boolean
    per_page: number
  }
}

export type ApiError = {
  success: false
  error: {
    type: string
    title: string
    status: number
    detail: string
    instance: string
    errors?: Array<{ field: string; message: string; code: string }>
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ─── Event ───────────────────────────────────────────────────
export type CreatorSummary = {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
}

export type AttendeeItem = {
  id: string
  display_name: string | null
  avatar_url: string | null
}

export type EventVerticalData = {
  // Optional extras in content.vertical_data JSONB
  // what_to_bring is a typed TEXT[] column on event_occurrences, not here
  dress_code?: string | null
  age_restriction?: string | null
}

export type EventOccurrence = {
  content_id: string
  // nullable during draft; non-null after publish (enforced at application layer)
  start_at: string | null
  end_at: string | null
  timezone: string
  venue_name: string | null
  venue_address: string | null
  venue_lat: number | null
  venue_lng: number | null
  city_id: string | null
  capacity: number | null
  spots_booked: number
  rsvp_count: number
  is_free: boolean
  what_to_bring: string[]
}

export type EventDetail = ContentBase & {
  type: 'event'
  price_paisa: number
  start_at: string
  end_at: string
  timezone: string
  venue_name: string
  venue_address: string
  venue_lat: number
  venue_lng: number
  city_id: string
  capacity: number
  spots_booked: number
  is_free: boolean
  has_rsvpd: boolean
  what_to_bring: string[]
  media: ContentMedia[]
  creator: CreatorSummary
  attendees: AttendeeItem[]
  attendee_count: number
  vertical_data: EventVerticalData
}

export type EventListItem = {
  id: string
  title: string
  start_at: string
  end_at: string
  venue_name: string
  city_id: string
  capacity: number
  spots_booked: number
  is_free: boolean
  cover_image_url: string | null
  creator: CreatorSummary
}

export type EventDraftData = {
  id: string
  title: string | null
  start_at: string | null
  end_at: string | null
  timezone: string | null
  venue_name: string | null
  venue_address: string | null
  venue_lat: number | null
  venue_lng: number | null
  city_id: string | null
  capacity: number | null
  what_to_bring: string[]
  vertical_data: EventVerticalData
  updated_at: string
}

// ─── Auth ────────────────────────────────────────────────────
export type TokenPair = {
  access_token: string
  refresh_token: string
  expires_in: number
}

export type AuthResult = {
  user: UserProfile
  tokens: TokenPair
  is_new_user: boolean
}
