import { z } from 'zod'
import { VERTICALS, MAX_BIO_LENGTH, USERNAME_CHANGE_COOLDOWN_DAYS } from '../constants/index.js'

// ─── Common ──────────────────────────────────────────────────
export const uuidSchema = z.string().uuid()
export const cursorSchema = z.string().optional()
export const limitSchema = z.coerce.number().int().min(1).max(50).default(20)

// ─── Auth ────────────────────────────────────────────────────
export const registerSchema = z.object({
  firebase_token: z.string().min(1),
  device_info: z
    .object({
      platform: z.enum(['ios', 'android', 'web']),
      device_id: z.string().optional(),
      app_version: z.string().optional(),
    })
    .optional(),
})

export const refreshSchema = z.object({
  refresh_token: z.string().min(1),
})

// ─── User ────────────────────────────────────────────────────
export const usernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores')

export const updateUserSchema = z
  .object({
    display_name: z.string().min(1).max(50),
    bio: z.string().max(MAX_BIO_LENGTH),
    email: z.string().email(),
    avatar_url: z.string().url(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided')

export const changeUsernameSchema = z.object({
  username: usernameSchema,
})

export const changePhoneSchema = z.object({
  firebase_token: z.string().min(1, 'Firebase token required for phone verification'),
})

// ─── Onboarding ──────────────────────────────────────────────
export const setLocationSchema = z.object({
  city_id: z.string().min(1),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  source: z.enum(['gps', 'manual']),
})

export const setVerticalsSchema = z.object({
  verticals: z
    .array(z.enum(VERTICALS))
    .min(3, 'Select at least 3 verticals')
    .max(8),
})

// Travel-only launch — onboarding picks sub-categories instead of verticals.
// Active set: road_trips, biking, trekking, food_trails. Min 2 required.
export const setTravelSubCategoriesSchema = z.object({
  travel_sub_categories: z
    .array(z.string().min(1).max(40))
    .min(2, 'Pick at least 2 trip types')
    .max(4),
})

// ─── Cities ──────────────────────────────────────────────────
export const searchCitiesSchema = z.object({
  q: z.string().min(1),
  limit: limitSchema,
})

export const nearbyCitySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
})

// ─── Upload ──────────────────────────────────────────────────
export const signedUrlSchema = z.object({
  file_name: z.string().min(1).max(255),
  content_type: z.enum([
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'application/pdf',
  ]),
  purpose: z.enum(['avatar', 'content_image', 'content_video', 'kyc_document']),
  content_id: uuidSchema.optional(),
})

// ─── Places ──────────────────────────────────────────────────
export const placesAutocompleteSchema = z.object({
  input: z.string().min(2),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
})

// ─── Content ────────────────────────────────────────────────
import {
  CONTENT_TYPES,
  VERTICALS as VERTICALS_CONST,
  MAX_POST_TEXT_LENGTH,
  MAX_IMAGES_PER_POST,
  MAX_IMAGES_PER_EXPERIENCE,
  MIN_EVENT_TITLE_LENGTH,
  MAX_EVENT_TITLE_LENGTH,
  MAX_EVENT_DESCRIPTION_LENGTH,
  MIN_EVENT_CAPACITY,
  MAX_EVENT_CAPACITY,
  MAX_EVENT_VENUE_NAME_LENGTH,
  MAX_EVENT_VENUE_ADDRESS_LENGTH,
  SEASONS,
  TRIP_STYLES,
  AUDIENCES,
  GROUP_SIZES,
  DIFFICULTY_LEVELS,
} from '../constants/index.js'

// Discoverability facets — stored on content.facets JSONB. Strict to keep
// the JSONB bag from accumulating stray keys at the validation boundary.
export const facetsSchema = z
  .object({
    season: z.enum(SEASONS).nullable().optional(),
    trip_style: z.enum(TRIP_STYLES).nullable().optional(),
    audience: z.enum(AUDIENCES).nullable().optional(),
    group_size: z.enum(GROUP_SIZES).nullable().optional(),
    difficulty: z.enum(DIFFICULTY_LEVELS).nullable().optional(),
  })
  .strict()

export const createContentSchema = z.object({
  type: z.enum(CONTENT_TYPES),
  vertical: z.enum(VERTICALS_CONST),
})

export const updatePostSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    description: z.string().max(280).optional(),
    body: z.string().max(MAX_POST_TEXT_LENGTH).optional(),
    tags: z.array(z.string().max(50)).max(5).optional(),
    starting_city_id: z.string().optional(),
    sub_category_id: z.string().optional(),
    leaf_type: z.string().optional(),
    visibility: z.enum(['public', 'unlisted', 'private']).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided')

export const updateItinerarySchema = z
  .object({
    title: z.string().min(5).max(100).optional(),
    description: z.string().max(280).optional(),
    tags: z.array(z.string().max(50)).max(5).optional(),
    starting_city_id: z.string().optional(),
    destination_city_ids: z.array(z.string()).optional(),
    sub_category_id: z.string().optional(),
    leaf_type: z.string().optional(),
    duration_minutes: z.number().int().min(0).optional(),
    day_count: z.number().int().min(1).max(30).optional(),
    pricing_model: z.enum(['free', 'paid']).optional(),
    price_paisa: z.number().int().min(0).optional(),
    visibility: z.enum(['public', 'unlisted', 'private']).optional(),
    vertical_data: z.record(z.unknown()).optional(),
    facets: facetsSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided')

export const publishContentSchema = z.object({
  tnc_accepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Terms & Conditions' }),
  }),
})

export const addMediaSchema = z.object({
  media_type: z.enum(['image', 'video', 'audio']),
  url: z.string().url(),
  thumbnail_url: z.string().url().optional(),
  alt_text: z.string().max(200).optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  duration_seconds: z.number().int().optional(),
  file_size_bytes: z.number().int().optional(),
  display_order: z.number().int().min(0).default(0),
})

export const reorderMediaSchema = z.object({
  media_ids: z.array(uuidSchema).min(1),
})

// ─── Itinerary Days & Spots ─────────────────────────────────
export const updateDaySchema = z
  .object({
    title: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided')

export const addSpotSchema = z.object({
  google_place_id: z.string().optional(),
  name: z.string().min(1).max(200),
  category: z.string().max(50).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  thumbnail_url: z.string().url().optional(),
  creator_note: z.string().max(500).optional(),
  duration_minutes: z.number().int().min(0).optional(),
  stop_type: z.enum(['regular', 'overnight', 'meal', 'viewpoint', 'activity']).default('regular'),
})

export const updateSpotSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    category: z.string().max(50).optional(),
    creator_note: z.string().max(500).optional(),
    duration_minutes: z.number().int().min(0).optional(),
    stop_type: z.enum(['regular', 'overnight', 'meal', 'viewpoint', 'activity']).optional(),
    spot_order: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided')

export const createItineraryDraftSchema = z.object({
  vertical: z.enum(VERTICALS_CONST),
  day_count: z.number().int().min(1).max(30).default(1),
})

export const reorderSpotsSchema = z.object({
  spot_ids: z.array(uuidSchema).min(1),
})

// ─── Event ──────────────────────────────────────────────────
export const updateEventSchema = z
  .object({
    title: z.string().min(MIN_EVENT_TITLE_LENGTH).max(MAX_EVENT_TITLE_LENGTH).optional(),
    description: z.string().max(MAX_EVENT_DESCRIPTION_LENGTH).optional(),
    start_at: z.string().datetime({ offset: true }).optional(),
    end_at: z.string().datetime({ offset: true }).optional(),
    timezone: z.string().optional(),
    venue_name: z.string().min(1).max(MAX_EVENT_VENUE_NAME_LENGTH).optional(),
    venue_address: z.string().max(MAX_EVENT_VENUE_ADDRESS_LENGTH).optional(),
    venue_lat: z.number().min(-90).max(90).optional(),
    venue_lng: z.number().min(-180).max(180).optional(),
    city_id: z.string().optional(),
    capacity: z.number().int().min(MIN_EVENT_CAPACITY).max(MAX_EVENT_CAPACITY).optional(),
    tags: z.array(z.string().max(50)).max(5).optional(),
    sub_category_id: z.string().optional(),
    leaf_type: z.string().optional(),
    visibility: z.enum(['public', 'unlisted', 'private']).optional(),
    what_to_bring: z.array(z.string().max(200)).max(30).optional(),
    vertical_data: z
      .object({
        dress_code: z.string().max(200).optional(),
        age_restriction: z.string().max(200).optional(),
      })
      .optional(),
    facets: facetsSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'At least one field must be provided')

export const eventListQuerySchema = z.object({
  city_id: z.string().optional(),
  from_date: z.string().datetime({ offset: true }).optional(),
  vertical: z.enum(VERTICALS_CONST).optional(),
  user_id: uuidSchema.optional(),
  include_past: z.coerce.boolean().default(false),
  cursor: cursorSchema,
  limit: limitSchema,
})

// ─── Content Query ──────────────────────────────────────────
export const contentListQuerySchema = z.object({
  type: z.enum(CONTENT_TYPES).optional(),
  vertical: z.enum(VERTICALS_CONST).optional(),
  status: z.enum(['draft', 'published']).optional(),
  user_id: uuidSchema.optional(),
  cursor: cursorSchema,
  limit: limitSchema,
})

// ─── Social: Comments ──────────────────────────────────────
export const addCommentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(500),
  parent_id: uuidSchema.optional(),
})

export const editCommentSchema = z.object({
  body: z.string().min(1, 'Comment cannot be empty').max(500),
})

// ─── Social: Saved Lists ───────────────────────────────────
export const createListSchema = z.object({
  name: z.string().min(1, 'List name cannot be empty').max(100),
})

export const renameListSchema = z.object({
  name: z.string().min(1, 'List name cannot be empty').max(100),
})

// ─── Social: Save / Unsave Content ─────────────────────────
export const saveContentSchema = z.object({
  list_ids: z.array(uuidSchema).default([]),
})

export const unsaveContentSchema = z.object({
  list_ids: z.array(uuidSchema).min(1, 'At least one list_id is required'),
})

// ─── Social: Share ─────────────────────────────────────────
export const recordShareSchema = z.object({
  platform: z.enum(['whatsapp', 'instagram', 'twitter', 'copy_link', 'other']),
})

// ─── Social: List Items Query ──────────────────────────────
export const listItemsQuerySchema = z.object({
  sort: z.enum(['recently_added', 'oldest', 'a_z', 'price_asc', 'price_desc']).default('recently_added'),
  type: z.string().optional(),
  cursor: cursorSchema,
  limit: limitSchema,
})

// ─── Posts feed (home Posts chip + Stories rail) ────────────
export const postsFeedQuerySchema = z.object({
  scope: z.enum(['near', 'following']).default('near'),
  city_id: z.string().optional(),
  sub_category_id: z.string().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  cursor: cursorSchema,
  limit: limitSchema,
})

// ─── Discover filters ──────────────────────────────────────
// 13-field filter set used by the rewritten /discover/category-browse
// and /discover/results screens. Coerce booleans/numbers so query strings
// from GoRouter deep-links round-trip cleanly.
export const DURATION_BUCKETS = ['day_trip', 'weekend', 'short', 'long'] as const
export const BUDGET_BUCKETS = ['free', 'lt2k', '2to5k', '5to15k', 'gt15k'] as const
export const TIME_WINDOWS = ['today', 'this_weekend', 'next_7d', 'this_month', 'custom'] as const
export const DISCOVER_SORTS = ['recent', 'trending', 'price_asc', 'price_desc'] as const

const csv = z.preprocess((v) => {
  if (typeof v === 'string') return v.split(',').filter(Boolean)
  return v
}, z.array(z.string()).optional())

export const discoverFiltersQuerySchema = z.object({
  // taxonomy
  vertical: z.enum(VERTICALS_CONST).optional(),
  sub_category_id: z.string().optional(),
  leaf_type: z.string().optional(),
  type: z.enum(CONTENT_TYPES).optional(),
  // time
  time_window: z.enum(TIME_WINDOWS).optional(),
  date_from: z.string().datetime({ offset: true }).optional(),
  date_to: z.string().datetime({ offset: true }).optional(),
  // duration / budget / facets (CSV)
  duration_buckets: csv.transform((v) =>
    v?.filter((s): s is (typeof DURATION_BUCKETS)[number] =>
      (DURATION_BUCKETS as readonly string[]).includes(s),
    ),
  ),
  budget_buckets: csv.transform((v) =>
    v?.filter((s): s is (typeof BUDGET_BUCKETS)[number] =>
      (BUDGET_BUCKETS as readonly string[]).includes(s),
    ),
  ),
  seasons: csv.transform((v) =>
    v?.filter((s): s is (typeof SEASONS)[number] => (SEASONS as readonly string[]).includes(s)),
  ),
  months: z.preprocess(
    (v) => (typeof v === 'string' ? v.split(',').map((s) => parseInt(s, 10)) : v),
    z.array(z.number().int().min(1).max(12)).optional(),
  ),
  difficulties: csv.transform((v) =>
    v?.filter((s): s is (typeof DIFFICULTY_LEVELS)[number] =>
      (DIFFICULTY_LEVELS as readonly string[]).includes(s),
    ),
  ),
  group_sizes: csv.transform((v) =>
    v?.filter((s): s is (typeof GROUP_SIZES)[number] =>
      (GROUP_SIZES as readonly string[]).includes(s),
    ),
  ),
  // place
  destination_city_id: z.string().optional(),
  destination_lat: z.coerce.number().min(-90).max(90).optional(),
  destination_lng: z.coerce.number().min(-180).max(180).optional(),
  starting_city_id: z.string().optional(),
  distance_km: z.coerce.number().int().refine((n) => [25, 50, 100, 250].includes(n)).optional(),
  user_lat: z.coerce.number().min(-90).max(90).optional(),
  user_lng: z.coerce.number().min(-180).max(180).optional(),
  // free-text & sort & pagination
  q: z.string().min(1).max(200).optional(),
  sort: z.enum(DISCOVER_SORTS).optional(),
  cursor: cursorSchema,
  limit: limitSchema,
})

// ─── Discover: destination resolve (Google Places fallback) ─
export const resolveDestinationSchema = z.object({
  place_id: z.string().min(1),
})

// Export types inferred from schemas
export type RegisterInput = z.infer<typeof registerSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type ChangeUsernameInput = z.infer<typeof changeUsernameSchema>
export type SetLocationInput = z.infer<typeof setLocationSchema>
export type SetVerticalsInput = z.infer<typeof setVerticalsSchema>
export type SignedUrlInput = z.infer<typeof signedUrlSchema>
export type PlacesAutocompleteInput = z.infer<typeof placesAutocompleteSchema>
export type CreateContentInput = z.infer<typeof createContentSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>
export type UpdateItineraryInput = z.infer<typeof updateItinerarySchema>
export type PublishContentInput = z.infer<typeof publishContentSchema>
export type AddMediaInput = z.infer<typeof addMediaSchema>
export type ReorderMediaInput = z.infer<typeof reorderMediaSchema>
export type UpdateDayInput = z.infer<typeof updateDaySchema>
export type AddSpotInput = z.infer<typeof addSpotSchema>
export type UpdateSpotInput = z.infer<typeof updateSpotSchema>
export type ContentListQueryInput = z.infer<typeof contentListQuerySchema>
export type CreateItineraryDraftInput = z.infer<typeof createItineraryDraftSchema>
export type ReorderSpotsInput = z.infer<typeof reorderSpotsSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type EventListQueryInput = z.infer<typeof eventListQuerySchema>

export type SetTravelSubCategoriesInput = z.infer<typeof setTravelSubCategoriesSchema>
export type PostsFeedQueryInput = z.infer<typeof postsFeedQuerySchema>
export type DiscoverFiltersQueryInput = z.infer<typeof discoverFiltersQuerySchema>
export type ResolveDestinationInput = z.infer<typeof resolveDestinationSchema>

export type AddCommentInput = z.infer<typeof addCommentSchema>
export type EditCommentInput = z.infer<typeof editCommentSchema>
export type CreateListInput = z.infer<typeof createListSchema>
export type RenameListInput = z.infer<typeof renameListSchema>
export type SaveContentInput = z.infer<typeof saveContentSchema>
export type UnsaveContentInput = z.infer<typeof unsaveContentSchema>
export type RecordShareInput = z.infer<typeof recordShareSchema>
export type ListItemsQueryInput = z.infer<typeof listItemsQuerySchema>

// ─── Reviews ────────────────────────────────────────────────
export {
  submitReviewSchema,
  submitCreatorResponseSchema,
  reviewListQuerySchema,
} from './review.schemas.js'
export type {
  SubmitReviewInput,
  SubmitCreatorResponseInput,
  ReviewListQueryInput,
} from './review.schemas.js'

// ─── Payouts ────────────────────────────────────────────────
export { PAYOUT_STATUSES, listPayoutsQuerySchema } from './payout.js'
export type { ListPayoutsQueryInput } from './payout.js'

// ─── Admin (E4.1) ───────────────────────────────────────────
export {
  adminLoginSchema,
  adminChangePasswordSchema,
  createAdminSchema,
  updateAdminSchema,
  adminReasonSchema,
  featureToggleSchema,
  forceReleasePayoutSchema,
  createCollectionSchema,
  updateCollectionSchema,
  appendCollectionItemSchema,
  analyticsWindowSchema,
  auditLogQuerySchema,
} from './admin.js'
export type {
  AdminLoginInput,
  AdminChangePasswordInput,
  CreateAdminInput,
  UpdateAdminInput,
  CreateCollectionInput,
  UpdateCollectionInput,
  AppendCollectionItemInput,
  AnalyticsWindowInput,
  AuditLogQueryInput,
  AdminReasonInput,
  FeatureToggleInput,
  ForceReleasePayoutInput,
} from './admin.js'

// suppress unused import warning
void USERNAME_CHANGE_COOLDOWN_DAYS
