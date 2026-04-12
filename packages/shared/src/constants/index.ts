// ─── Business rules ──────────────────────────────────────────
export const PLATFORM_FEE_RATE = 0.17 // 17%
export const GST_RATE = 0.18          // 18%
export const TDS_RATE = 0.01          // 1% (Sec 194-O)
export const PAYOUT_HOLD_HOURS = 48   // 48h dispute window before payout

// ─── Content limits ──────────────────────────────────────────
export const MAX_IMAGES_PER_POST = 5
export const MAX_IMAGES_PER_EXPERIENCE = 10
export const MAX_POST_TEXT_LENGTH = 1000
export const MAX_EXPERIENCE_DESCRIPTION_LENGTH = 2000
export const MAX_BIO_LENGTH = 280

// ─── Auth ────────────────────────────────────────────────────
export const USERNAME_CHANGE_COOLDOWN_DAYS = 30
export const OTP_EXPIRY_MINUTES = 10
export const OTP_MAX_ATTEMPTS = 5
export const OTP_RESEND_COOLDOWN_SECONDS = 30
export const OTP_MAX_RESENDS = 3
export const SESSION_MOBILE_DAYS = 90
export const SESSION_WEB_DAYS = 30

// ─── Verticals ───────────────────────────────────────────────
export const VERTICALS = [
  'travel',
  'stories',
  'food',
  'fitness',
  'education',
  'photography',
  'music',
  'wellness',
] as const

export type Vertical = (typeof VERTICALS)[number]

// Verticals enabled in MVP (RLS enforced server-side)
export const MVP_VERTICALS: Vertical[] = ['travel', 'stories']

// Threshold for "soon" label vs "coming soon"
export const VERTICAL_SOON_THRESHOLD = 10

// ─── Content ─────────────────────────────────────────────────
export const CONTENT_TYPES = ['post', 'event', 'scheduled_experience', 'self_paced_itinerary'] as const
export type ContentType = (typeof CONTENT_TYPES)[number]

export const CONTENT_STATUSES = [
  'draft',
  'under_review',
  'published',
  'unpublished',
  'archived',
  'rejected',
  'taken_down',
] as const
export type ContentStatus = (typeof CONTENT_STATUSES)[number]

// ─── Content creation ───────────────────────────────────────
export const MAX_TITLE_LENGTH = 100
export const MIN_TITLE_LENGTH = 5           // itinerary/experience; posts allow 1
export const MAX_DESCRIPTION_LENGTH = 280
export const MAX_TAGS = 5
export const MAX_TAG_LENGTH = 50
export const MAX_ITINERARY_DAYS = 30
export const MAX_SPOTS_PER_DAY = 20
export const MAX_CREATOR_NOTE_LENGTH = 500
export const AUTO_SAVE_INTERVAL_MS = 30_000 // 30 seconds (server-side)
export const POST_AUTO_SAVE_INTERVAL_MS = 10_000 // 10 seconds (local)

// ─── Spot stop types ────────────────────────────────────────
export const SPOT_STOP_TYPES = ['regular', 'overnight', 'meal', 'viewpoint', 'activity'] as const
export type SpotStopType = (typeof SPOT_STOP_TYPES)[number]

// ─── Cancellation policies ──────────────────────────────────
export const CANCELLATION_POLICIES = ['flexible', 'moderate', 'strict'] as const
export type CancellationPolicy = (typeof CANCELLATION_POLICIES)[number]

// ─── Places API ─────────────────────────────────────────────
export const PLACES_AUTOCOMPLETE_DEBOUNCE_MS = 300
export const PLACES_MIN_QUERY_LENGTH = 2
export const PLACES_RATE_LIMIT_PER_HOUR = 100

// ─── Pagination ──────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 50

// ─── Geo ─────────────────────────────────────────────────────
export const NEARBY_RADIUS_KM = 50
export const NEARBY_CITY_DETECTION_RADIUS_KM = 100
