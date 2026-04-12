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
} from '../constants/index.js'

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
    duration_minutes: z.number().int().min(0).optional(),
    day_count: z.number().int().min(1).max(30).optional(),
    pricing_model: z.enum(['free', 'paid']).optional(),
    price_paisa: z.number().int().min(0).optional(),
    visibility: z.enum(['public', 'unlisted', 'private']).optional(),
    vertical_data: z.record(z.unknown()).optional(),
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

// ─── Content Query ──────────────────────────────────────────
export const contentListQuerySchema = z.object({
  type: z.enum(CONTENT_TYPES).optional(),
  vertical: z.enum(VERTICALS_CONST).optional(),
  status: z.enum(['draft', 'published']).optional(),
  user_id: uuidSchema.optional(),
  cursor: cursorSchema,
  limit: limitSchema,
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

// suppress unused import warning
void USERNAME_CHANGE_COOLDOWN_DAYS
