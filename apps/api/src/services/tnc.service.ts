import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'

/**
 * Record user's consent to T&Cs for a specific content item.
 * Idempotent — does nothing if already consented.
 */
export async function recordConsent(
  userId: string,
  contentId: string,
  ipAddress: string | null,
  userAgent: string | null,
): Promise<void> {
  const { error } = await supabase.from('tnc_consents').upsert(
    {
      user_id: userId,
      content_id: contentId,
      ip_address: ipAddress,
      user_agent: userAgent,
      consented_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,content_id' },
  )

  if (error) {
    throw new AppError('db-error', 500, 'Failed to record T&C consent')
  }
}

/**
 * Check if user has already consented to T&Cs for a content item.
 */
export async function hasConsented(
  userId: string,
  contentId: string,
): Promise<boolean> {
  const { count, error } = await supabase
    .from('tnc_consents')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('content_id', contentId)

  if (error) {
    throw new AppError('db-error', 500, 'Failed to check T&C consent')
  }

  return (count ?? 0) > 0
}
