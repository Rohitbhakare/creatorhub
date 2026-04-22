// Admin feature/unfeature toggles (E4.1, T7 · ADM-FR-011).
//
// Simple manual curation: sets `users.featured` / `content.featured`
// booleans. No algorithmic ranking — plan §7 + SRS DD-039 are explicit
// that editorial decisions in MVP come from platform staff, not data.
//
// Audit: every flip writes a `feature_user` / `unfeature_user` (or
// `feature_content` / `unfeature_content`) row via `recordAdminAudit`.

import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'

// ─── Users ─────────────────────────────────────────────────────

/**
 * Set the `featured` flag on a user row. Throws 404 if the user does
 * not exist (we check after the update so we surface DB errors
 * unambiguously).
 */
export async function setUserFeatured(
  userId: string,
  featured: boolean,
): Promise<void> {
  const { data, error } = await supabase
    .from('users')
    .update({ featured, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[admin-features.setUserFeatured] supabase error:', error.message)
    throw new AppError('db-error', 500, 'Failed to update user featured flag')
  }
  if (!data) throw new AppError('not-found', 404, 'User not found')
}

// ─── Content ───────────────────────────────────────────────────

/**
 * Set the `featured` flag on a content row. Refuses to feature content
 * that is not published (`status='published'`) so that draft or removed
 * posts cannot silently land on the home page.
 */
export async function setContentFeatured(
  contentId: string,
  featured: boolean,
): Promise<void> {
  // Status guard only applies when featuring. Unfeaturing is always
  // safe — it's the corrective action for a bad feature decision.
  if (featured) {
    const { data: row, error: lookupErr } = await supabase
      .from('content')
      .select('id, status')
      .eq('id', contentId)
      .maybeSingle()

    if (lookupErr) {
      console.error('[admin-features.setContentFeatured] lookup failed:', lookupErr.message)
      throw new AppError('db-error', 500, 'Failed to fetch content')
    }
    if (!row) throw new AppError('not-found', 404, 'Content not found')
    if (row.status !== 'published') {
      throw new AppError(
        'conflict',
        409,
        'Only published content can be featured',
      )
    }
  }

  const { data, error } = await supabase
    .from('content')
    .update({ featured, updated_at: new Date().toISOString() })
    .eq('id', contentId)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[admin-features.setContentFeatured] supabase error:', error.message)
    throw new AppError('db-error', 500, 'Failed to update content featured flag')
  }
  if (!data) throw new AppError('not-found', 404, 'Content not found')
}
