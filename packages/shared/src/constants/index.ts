// ─── Business rules ──────────────────────────────────────────
export const PLATFORM_FEE_RATE = 0.17 // 17%
export const GST_RATE = 0.18          // 18%
export const TDS_RATE = 0.01          // 1% (Sec 194-O)
export const PAYOUT_HOLD_HOURS = 48   // 48h dispute window before payout

// ─── Content limits ──────────────────────────────────────────
export const MAX_IMAGES_PER_POST = 5
export const MAX_IMAGES_PER_EXPERIENCE = 10
export const MAX_POST_TEXT_LENGTH = 10000
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

// ─── Events ──────────────────────────────────────────────────
export const MAX_EVENT_TITLE_LENGTH = 100
export const MIN_EVENT_TITLE_LENGTH = 5
export const MAX_EVENT_DESCRIPTION_LENGTH = 500
export const MAX_EVENT_CAPACITY = 10_000
export const MIN_EVENT_CAPACITY = 1
export const MAX_EVENT_VENUE_NAME_LENGTH = 200
export const MAX_EVENT_VENUE_ADDRESS_LENGTH = 500
export const MAX_EVENT_IMAGES = 5

// ─── Discoverability facets (DISC-FR-023a row-2 chips) ─────
// Stored in content.facets JSONB. Powers feed-card context chips and
// future filter/search. Keep enums stable — schema changes are breaking.

export const SEASONS = [
  'spring',
  'summer',
  'monsoon',
  'autumn',
  'winter',
  'year_round',
] as const
export type Season = (typeof SEASONS)[number]

export const TRIP_STYLES = [
  'adventure',
  'chill',
  'cultural',
  'nightlife',
  'wellness',
  'foodie',
  'offbeat',
] as const
export type TripStyle = (typeof TRIP_STYLES)[number]

export const AUDIENCES = ['solo', 'couple', 'family', 'friends', 'group'] as const
export type Audience = (typeof AUDIENCES)[number]

// Derived server-side from price_paisa — never persisted
export const BUDGET_TIERS = ['free', '₹', '₹₹', '₹₹₹', '₹₹₹₹'] as const
export type BudgetTier = (typeof BUDGET_TIERS)[number]

// Paisa thresholds for budget tier bucketing (exclusive upper bound)
export const BUDGET_TIER_THRESHOLDS_PAISA = {
  low: 100_000,   // <  ₹1,000  → ₹
  mid: 250_000,   // <  ₹2,500  → ₹₹
  high: 500_000,  // <  ₹5,000  → ₹₹₹
                  // >= ₹5,000  → ₹₹₹₹
} as const

// Reading speed for deriving read_time_min from post body
export const WORDS_PER_MINUTE = 200

// ─── 3-level taxonomy ────────────────────────────────────────────

export const GROUP_SIZES = ['solo', 'pair', 'small_group', 'large_group'] as const
export type GroupSize = typeof GROUP_SIZES[number]

export const DIFFICULTY_LEVELS = ['easy', 'moderate', 'hard', 'expert'] as const
export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number]

export const TRAVEL_SUB_CATEGORIES = [
  'road_trips', 'trekking', 'adventure', 'heritage', 'food_trails',
  'wildlife', 'photo_walks', 'wellness', 'family', 'luxury', 'offbeat', 'nightlife',
] as const

export const STORIES_SUB_CATEGORIES = [
  'travel_stories', 'photo_essays', 'tips_guides',
] as const
