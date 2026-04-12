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

// Export types inferred from schemas
export type RegisterInput = z.infer<typeof registerSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type ChangeUsernameInput = z.infer<typeof changeUsernameSchema>
export type SetLocationInput = z.infer<typeof setLocationSchema>
export type SetVerticalsInput = z.infer<typeof setVerticalsSchema>
export type SignedUrlInput = z.infer<typeof signedUrlSchema>
export type PlacesAutocompleteInput = z.infer<typeof placesAutocompleteSchema>

// suppress unused import warning
void USERNAME_CHANGE_COOLDOWN_DAYS
