import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'

// ─── Types ────────────────────────────────────────────────────

export type DeletionStatus = 'none' | 'pending' | 'cancelled' | 'executed'

export interface DeletionStatusResult {
  status: DeletionStatus
  scheduledFor?: string
  requestedAt?: string
}

export interface UserDataExport {
  exportedAt: string
  profile: Record<string, unknown>
  content: unknown[]
  bookings: unknown[]
  reviewsWritten: unknown[]
  savedLists: unknown[]
  notificationPreferences: unknown[]
}

export type ConsentType = 'terms_of_service' | 'privacy_policy' | 'content_tnc'

export interface ConsentStatusResult {
  terms_of_service: string | null
  privacy_policy: string | null
  content_tnc: string | null
}

// ─── requestDeletion ──────────────────────────────────────────

/**
 * Request account deletion with a 30-day grace period.
 * Creates a deletion_requests row scheduled for 30 days later.
 * Idempotent — if a pending request already exists, returns existing.
 */
export async function requestDeletion(userId: string): Promise<{ scheduledFor: string }> {
  // Check for existing pending request
  const { data: existing } = await supabase
    .from('deletion_requests')
    .select('id, status, scheduled_for')
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    if (existing.status === 'pending') {
      return { scheduledFor: existing.scheduled_for as string }
    }
    if (existing.status === 'executed') {
      throw new AppError('unprocessable', 422, 'Account has already been deleted')
    }
    // cancelled — allow re-request by updating
    const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const { error } = await supabase
      .from('deletion_requests')
      .update({
        status: 'pending',
        requested_at: new Date().toISOString(),
        scheduled_for: scheduledFor,
        cancelled_at: null,
      })
      .eq('user_id', userId)

    if (error) {
      throw new AppError('db-error', 500, 'Failed to re-request account deletion')
    }

    console.warn(
      JSON.stringify({
        level: 'info',
        event: 'deletion_requested',
        userId,
        scheduledFor,
      }),
    )

    return { scheduledFor }
  }

  // Create new request
  const scheduledFor = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase.from('deletion_requests').insert({
    user_id: userId,
    scheduled_for: scheduledFor,
    status: 'pending',
  })

  if (error) {
    throw new AppError('db-error', 500, 'Failed to request account deletion')
  }

  console.warn(
    JSON.stringify({
      level: 'info',
      event: 'deletion_requested',
      userId,
      scheduledFor,
    }),
  )

  return { scheduledFor }
}

// ─── cancelDeletion ───────────────────────────────────────────

/**
 * Cancel a pending deletion request (within grace period).
 */
export async function cancelDeletion(userId: string): Promise<void> {
  const { data: request } = await supabase
    .from('deletion_requests')
    .select('id, status')
    .eq('user_id', userId)
    .maybeSingle()

  if (!request || request.status !== 'pending') {
    throw new AppError('not-found', 404, 'No pending deletion request found')
  }

  const { error } = await supabase
    .from('deletion_requests')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (error) {
    throw new AppError('db-error', 500, 'Failed to cancel deletion request')
  }

  console.warn(
    JSON.stringify({
      level: 'info',
      event: 'deletion_cancelled',
      userId,
    }),
  )
}

// ─── getDeletionStatus ────────────────────────────────────────

/**
 * Get the current deletion status for a user.
 */
export async function getDeletionStatus(userId: string): Promise<DeletionStatusResult> {
  const { data, error } = await supabase
    .from('deletion_requests')
    .select('status, scheduled_for, requested_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new AppError('db-error', 500, 'Failed to fetch deletion status')
  }

  if (!data) {
    return { status: 'none' }
  }

  const result: DeletionStatusResult = {
    status: data.status as DeletionStatus,
  }

  if (data.scheduled_for) {
    result.scheduledFor = data.scheduled_for as string
  }
  if (data.requested_at) {
    result.requestedAt = data.requested_at as string
  }

  return result
}

// ─── exportUserData ───────────────────────────────────────────

/**
 * Export all user data as a structured JSON object (DPDPA data portability).
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  // Fetch all data concurrently
  const [
    profileResult,
    contentResult,
    bookingsResult,
    reviewsResult,
    savedListsResult,
    notifPrefsResult,
  ] = await Promise.all([
    // Profile
    supabase
      .from('users')
      .select(
        'id, username, display_name, bio, avatar_url, phone_number, email, is_creator, kyc_status, onboarding_completed_at, created_at',
      )
      .eq('id', userId)
      .single(),

    // Content created by user
    supabase
      .from('content')
      .select('id, type, title, description, status, created_at, published_at')
      .eq('user_id', userId),

    // Bookings made by user
    supabase
      .from('bookings')
      .select('id, content_id, status, total_amount_paisa, created_at, booked_for')
      .eq('user_id', userId),

    // Reviews written by user
    supabase
      .from('reviews')
      .select('id, content_id, rating, body, created_at')
      .eq('reviewer_id', userId),

    // Saved lists
    supabase
      .from('saved_lists')
      .select('id, name, is_public, created_at')
      .eq('user_id', userId),

    // Notification preferences
    supabase
      .from('user_notification_preferences')
      .select('category, channel, enabled')
      .eq('user_id', userId),
  ])

  // Log any DB errors but do not throw — partial export is still useful
  if (profileResult.error) {
    console.warn(JSON.stringify({ level: 'warn', event: 'export_profile_error', userId }))
  }

  return {
    exportedAt: new Date().toISOString(),
    profile: (profileResult.data as Record<string, unknown>) ?? {},
    content: (contentResult.data as unknown[]) ?? [],
    bookings: (bookingsResult.data as unknown[]) ?? [],
    reviewsWritten: (reviewsResult.data as unknown[]) ?? [],
    savedLists: (savedListsResult.data as unknown[]) ?? [],
    notificationPreferences: (notifPrefsResult.data as unknown[]) ?? [],
  }
}

// ─── recordConsent ────────────────────────────────────────────

/**
 * Record user's consent to a policy document version.
 */
export async function recordConsent(
  userId: string,
  consentType: ConsentType,
  version: string,
  ip: string | null,
  userAgent: string | null,
): Promise<void> {
  const { error } = await supabase.from('consent_logs').insert({
    user_id: userId,
    consent_type: consentType,
    version,
    ip_address: ip,
    user_agent: userAgent,
    consented_at: new Date().toISOString(),
  })

  if (error) {
    throw new AppError('db-error', 500, 'Failed to record consent')
  }
}

// ─── getConsentStatus ─────────────────────────────────────────

/**
 * Get the latest consent version for each consent type for a user.
 */
export async function getConsentStatus(userId: string): Promise<ConsentStatusResult> {
  const { data, error } = await supabase
    .from('consent_logs')
    .select('consent_type, version, consented_at')
    .eq('user_id', userId)
    .order('consented_at', { ascending: false })

  if (error) {
    throw new AppError('db-error', 500, 'Failed to fetch consent status')
  }

  const result: ConsentStatusResult = {
    terms_of_service: null,
    privacy_policy: null,
    content_tnc: null,
  }

  // Take the latest version for each type (results are ordered by consented_at desc)
  for (const row of data ?? []) {
    const type = row.consent_type as ConsentType
    if (type === 'terms_of_service' && result.terms_of_service === null) {
      result.terms_of_service = row.version as string
    } else if (type === 'privacy_policy' && result.privacy_policy === null) {
      result.privacy_policy = row.version as string
    } else if (type === 'content_tnc' && result.content_tnc === null) {
      result.content_tnc = row.version as string
    }
  }

  return result
}
