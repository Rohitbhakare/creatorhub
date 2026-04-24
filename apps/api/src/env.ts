import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Supabase — required in all environments
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Firebase Admin — required in all environments (auth won't work without it)
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z.string().min(1).transform((key) => key.replace(/\\n/g, '\n')),
  FIREBASE_CLIENT_EMAIL: z.string().email(),

  // App session tokens — required in all environments
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  // Payments — required in production only (E2.3 scope)
  // In dev, placeholder values are acceptable; payment calls will fail at runtime.
  RAZORPAY_KEY_ID: z.string().min(1).optional(),
  RAZORPAY_KEY_SECRET: z.string().min(1).optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1).optional(),

  // Google Places — required in production only
  // In dev, placeholder value is acceptable; autocomplete calls will fail at runtime.
  GOOGLE_PLACES_API_KEY: z.string().min(1).optional(),

  // Admin — legacy shared secret for Retool. Kept during dual-auth
  // window (T5 + T23). Once the admin app is cutover this can be
  // removed.
  ADMIN_SECRET: z.string().min(16).optional(),

  // Admin panel (E4.1) — separate HS256 signing secret for admin
  // session cookies so that a mobile/web user token leak cannot mint
  // admin sessions. 4h TTL, no refresh.
  ADMIN_SESSION_SECRET: z.string().min(32, 'ADMIN_SESSION_SECRET must be at least 32 characters').optional(),

  // Firebase Web API key — required to call the Identity Toolkit
  // REST endpoint for server-side password verification
  // (/accounts:signInWithPassword). The Admin SDK does not expose
  // this method directly.
  FIREBASE_WEB_API_KEY: z.string().min(1).optional(),

  // Internal cron — secret header for Fly scheduled machines / GitHub Actions
  // that invoke payout release + reconciliation jobs
  INTERNAL_CRON_KEY: z.string().min(16).optional(),

  // WhatsApp Business (Meta Cloud API) — optional; skipped in dev
  WHATSAPP_TOKEN: z.string().min(1).optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),

  // SendGrid — optional; skipped in dev
  SENDGRID_API_KEY: z.string().min(1).optional(),

  // Tax — GSTIN of CreatorHub (for buyer invoices)
  CREATORHUB_GSTIN: z.string().optional(),

  // KYC — 32-byte hex key used to AES-256-GCM encrypt bank account
  // numbers before insert into `kyc_submissions.bank_account_number_encrypted`.
  // Optional in dev (falls back to a zero key so local inserts succeed)
  // but MUST be set in production.
  KYC_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/, 'KYC_ENCRYPTION_KEY must be 64 hex chars (32 bytes)')
    .optional(),

  // PostHog — optional everywhere; no-op when absent (ANL-FR-001)
  POSTHOG_API_KEY: z.string().min(1).optional(),
  POSTHOG_HOST: z.string().url().default('https://app.posthog.com'),

  // Observability — optional everywhere
  SENTRY_DSN: z.string().url().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
