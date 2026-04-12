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

// ─── Pagination ──────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 50

// ─── Geo ─────────────────────────────────────────────────────
export const NEARBY_RADIUS_KM = 50
export const NEARBY_CITY_DETECTION_RADIUS_KM = 100
