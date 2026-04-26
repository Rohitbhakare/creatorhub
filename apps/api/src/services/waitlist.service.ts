/**
 * Waitlist Service (BOOK-FR-009).
 *
 * Buyers join a waitlist for sold-out scheduled_dates / event_occurrences.
 * On cancel/refund, the booking flow calls notifyNext() with the freed
 * opening — we pick the oldest un-notified entry, fire WhatsApp + push,
 * stamp notified_at. There is no auto-rebooking; the buyer must come back
 * and pay within 24h before the next entry is eligible.
 */

import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import { sendWhatsApp } from './whatsapp.service.js'

export type WaitlistTarget =
  | { kind: 'scheduled_date'; scheduledDateId: string }
  | { kind: 'event_occurrence'; eventOccurrenceId: string }

export interface WaitlistEntry {
  id: string
  userId: string
  contentId: string
  scheduledDateId: string | null
  eventOccurrenceId: string | null
  notifiedAt: string | null
  createdAt: string
}

type Row = Record<string, unknown>

function rowToEntry(row: Row): WaitlistEntry {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    contentId: row.content_id as string,
    scheduledDateId: (row.scheduled_date_id as string | null) ?? null,
    eventOccurrenceId: (row.event_occurrence_id as string | null) ?? null,
    notifiedAt: (row.notified_at as string | null) ?? null,
    createdAt: row.created_at as string,
  }
}

// ─── join ────────────────────────────────────────────────────────────────────

/**
 * Idempotent insert — re-joining returns the existing row.
 * Validates the content is published and the opening exists.
 */
export async function joinWaitlist(
  userId: string,
  contentId: string,
  target: WaitlistTarget,
): Promise<WaitlistEntry> {
  // Verify content is published and not the user's own.
  const { data: content, error: contentError } = await supabase
    .from('content')
    .select('id, user_id, status')
    .eq('id', contentId)
    .is('deleted_at', null)
    .maybeSingle()

  if (contentError || !content) {
    throw new AppError('not-found', 404, 'Content not found')
  }
  if ((content as Row).status !== 'published') {
    throw new AppError('not-found', 404, 'Content not found')
  }
  if ((content as Row).user_id === userId) {
    throw new AppError('unprocessable', 422, 'You cannot waitlist your own content')
  }

  // Verify opening exists and belongs to this content.
  if (target.kind === 'scheduled_date') {
    const { data: sd } = await supabase
      .from('scheduled_dates')
      .select('id, content_id')
      .eq('id', target.scheduledDateId)
      .eq('content_id', contentId)
      .maybeSingle()
    if (!sd) throw new AppError('not-found', 404, 'Scheduled date not found')
  } else {
    const { data: occ } = await supabase
      .from('event_occurrences')
      .select('content_id')
      .eq('content_id', target.eventOccurrenceId)
      .maybeSingle()
    if (!occ) throw new AppError('not-found', 404, 'Event occurrence not found')
    if ((occ as Row).content_id !== contentId) {
      throw new AppError('unprocessable', 422, 'Event occurrence does not belong to this content')
    }
  }

  // Idempotent insert — try insert, fall back to existing row on unique violation.
  const insertRow: Record<string, unknown> = {
    user_id: userId,
    content_id: contentId,
  }
  if (target.kind === 'scheduled_date') {
    insertRow['scheduled_date_id'] = target.scheduledDateId
  } else {
    insertRow['event_occurrence_id'] = target.eventOccurrenceId
  }

  const { data: inserted, error: insertError } = await supabase
    .from('waitlist_entries')
    .insert(insertRow)
    .select('*')
    .maybeSingle()

  if (insertError) {
    // Unique violation → fetch existing row.
    const code = (insertError as { code?: string }).code
    if (code === '23505') {
      const existingQuery = supabase
        .from('waitlist_entries')
        .select('*')
        .eq('user_id', userId)
      const existing =
        target.kind === 'scheduled_date'
          ? await existingQuery.eq('scheduled_date_id', target.scheduledDateId).maybeSingle()
          : await existingQuery.eq('event_occurrence_id', target.eventOccurrenceId).maybeSingle()
      if (existing.data) return rowToEntry(existing.data as Row)
    }
    throw new AppError('db-error', 500, 'Failed to join waitlist')
  }

  if (!inserted) throw new AppError('db-error', 500, 'Failed to join waitlist')
  return rowToEntry(inserted as Row)
}

// ─── leave ───────────────────────────────────────────────────────────────────

export async function leaveWaitlist(entryId: string, userId: string): Promise<void> {
  const { error, data } = await supabase
    .from('waitlist_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', userId)
    .select('id')

  if (error) throw new AppError('db-error', 500, 'Failed to leave waitlist')
  if (!data || data.length === 0) {
    throw new AppError('not-found', 404, 'Waitlist entry not found')
  }
}

// ─── listMine ────────────────────────────────────────────────────────────────

export async function listMyWaitlist(userId: string): Promise<WaitlistEntry[]> {
  const { data, error } = await supabase
    .from('waitlist_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new AppError('db-error', 500, 'Failed to fetch waitlist')
  return (data ?? []).map((row) => rowToEntry(row as Row))
}

// ─── notifyNext (called from refund.service on cancel) ───────────────────────

/**
 * Find the oldest un-notified waitlist entry for the freed opening, fire a
 * WhatsApp nudge, and stamp notified_at. Fire-and-forget — never throws.
 *
 * Returns the entry id we notified, or null if no one was waiting.
 */
export async function notifyWaitlistNext(target: WaitlistTarget): Promise<string | null> {
  try {
    const query = supabase
      .from('waitlist_entries')
      .select('id, user_id, content_id')
      .is('notified_at', null)
      .order('created_at', { ascending: true })
      .limit(1)

    const filtered =
      target.kind === 'scheduled_date'
        ? query.eq('scheduled_date_id', target.scheduledDateId)
        : query.eq('event_occurrence_id', target.eventOccurrenceId)

    const { data: rows, error } = await filtered
    if (error || !rows || rows.length === 0) return null

    const entry = rows[0] as Row
    const entryId = entry.id as string
    const userId = entry.user_id as string
    const contentId = entry.content_id as string

    // Stamp first to prevent re-nudging on retries.
    const stamp = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('waitlist_entries')
      .update({ notified_at: stamp })
      .eq('id', entryId)
      .is('notified_at', null)

    if (updateError) return null

    // Fetch user phone + content title for the template.
    const [userRes, contentRes] = await Promise.all([
      supabase.from('users').select('phone, display_name').eq('id', userId).maybeSingle(),
      supabase.from('content').select('title').eq('id', contentId).maybeSingle(),
    ])

    const phone = userRes.data?.phone as string | undefined
    if (!phone) return entryId

    const buyerName = (userRes.data?.display_name as string | null) ?? 'Traveler'
    const title = (contentRes.data?.title as string | null) ?? 'a trip you wanted'

    void sendWhatsApp(phone, 'waitlist_opened', [buyerName, title])
    return entryId
  } catch (err) {
    console.error('[waitlist] notifyNext failed', err)
    return null
  }
}
