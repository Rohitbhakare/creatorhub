import { z } from 'zod'
import { ADMIN_ROLES } from '../types/admin.js'

// ─── Auth ──────────────────────────────────────────────────────
export const adminLoginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(128),
})

export const adminChangePasswordSchema = z
  .object({
    current_password: z.string().min(1).max(128),
    new_password: z
      .string()
      .min(12, 'At least 12 characters')
      .max(128)
      .regex(/[a-z]/, 'Must include a lowercase letter')
      .regex(/[A-Z]/, 'Must include an uppercase letter')
      .regex(/\d/, 'Must include a number')
      .regex(/[^A-Za-z0-9]/, 'Must include a symbol'),
  })
  .refine((d) => d.current_password !== d.new_password, {
    message: 'New password must differ from current password',
    path: ['new_password'],
  })

// ─── Admin user management (super_admin only) ─────────────────
export const createAdminSchema = z.object({
  email: z.string().email().max(254),
  full_name: z.string().min(2).max(100),
  role: z.enum(ADMIN_ROLES),
})

export const updateAdminSchema = z
  .object({
    role: z.enum(ADMIN_ROLES).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, 'At least one field must be provided')

// ─── Existing admin action bodies (now under session) ─────────
export const adminReasonSchema = z.object({
  reason: z.string().min(3).max(500),
})

export const featureToggleSchema = z.object({
  reason: z.string().min(3).max(500).optional(),
})

export const forceReleasePayoutSchema = z.object({
  payout_id: z.string().uuid(),
  reason: z.string().min(3).max(500),
})

// ─── Editorial collections ─────────────────────────────────────
const slugSchema = z
  .string()
  .min(3)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and hyphens only')

export const createCollectionSchema = z.object({
  slug: slugSchema,
  title: z.string().min(3).max(100),
  subtitle: z.string().max(200).optional(),
  cover_image_url: z.string().url().optional(),
  priority: z.number().int().min(0).max(1000).default(0),
  source: z.enum(['algorithmic', 'manual']).default('manual'),
  content_ids: z.array(z.string().uuid()).max(200).default([]),
})

export const updateCollectionSchema = z
  .object({
    slug: slugSchema.optional(),
    title: z.string().min(3).max(100).optional(),
    subtitle: z.string().max(200).nullable().optional(),
    cover_image_url: z.string().url().nullable().optional(),
    is_active: z.boolean().optional(),
    priority: z.number().int().min(0).max(1000).optional(),
    content_ids: z.array(z.string().uuid()).max(200).optional(),
  })
  .refine((d) => Object.keys(d).length > 0, 'At least one field must be provided')

export const appendCollectionItemSchema = z.object({
  content_id: z.string().uuid(),
})

// ─── Analytics query params ────────────────────────────────────
export const analyticsWindowSchema = z.object({
  window: z.enum(['7d', '30d']).default('7d'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

// ─── Audit log query params ────────────────────────────────────
export const auditLogQuerySchema = z.object({
  admin_id: z.string().uuid().optional(),
  action: z.string().max(60).optional(),
  target_type: z.string().max(30).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// ─── Inferred types ────────────────────────────────────────────
export type AdminLoginInput = z.infer<typeof adminLoginSchema>
export type AdminChangePasswordInput = z.infer<typeof adminChangePasswordSchema>
export type CreateAdminInput = z.infer<typeof createAdminSchema>
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>
export type AppendCollectionItemInput = z.infer<typeof appendCollectionItemSchema>
export type AnalyticsWindowInput = z.infer<typeof analyticsWindowSchema>
export type AuditLogQueryInput = z.infer<typeof auditLogQuerySchema>
export type AdminReasonInput = z.infer<typeof adminReasonSchema>
export type FeatureToggleInput = z.infer<typeof featureToggleSchema>
export type ForceReleasePayoutInput = z.infer<typeof forceReleasePayoutSchema>
