/**
 * Booking Intent Service — 10-minute scarcity hold (BOOK-FR-007).
 *
 * The buyer enters Step 3 (Review & Pay) → POST /booking-intents → row
 * inserted with state='held' and expires_at = now()+10min. The Razorpay
 * launch only fires after this lands. On back / exit → DELETE releases the
 * hold. On expiry → 60s sweeper marks state='expired'. createBooking
 * consumes the intent atomically; if 0 rows update, hold expired and we
 * throw 410.
 *
 * Capacity rule: held + confirmed seats ≤ capacity for the relevant
 * scheduled_date or event_occurrence. Itinerary intents skip this check
 * entirely (digital good).
 */

import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'

const HOLD_TTL_MINUTES = 10

export type IntentTarget =
  | { kind: 'scheduled_date'; scheduledDateId: string }
  | { kind: 'event_occurrence'; eventOccurrenceId: string }
  | { kind: 'itinerary' }

export type BookingIntent = {
  id: string
  userId: string
  contentId: string
  scheduledDateId: string | null
  eventOccurrenceId: string | null
  travellers: number
  state: 'held' | 'consumed' | 'expired' | 'released'
  expiresAt: string
  createdAt: string
}

type Row = Record<string, unknown>

function rowToIntent(row: Row): BookingIntent {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    contentId: row.content_id as string,
    scheduledDateId: (row.scheduled_date_id as string | null) ?? null,
    eventOccurrenceId: (row.event_occurrence_id as string | null) ?? null,
    travellers: row.travellers as number,
    state: row.state as BookingIntent['state'],
    expiresAt: row.expires_at as string,
    createdAt: row.created_at as string,
  }
}

// ─── Capacity ────────────────────────────────────────────────────────────────

/**
 * Compute remaining seats for a scheduled_date or event_occurrence.
 * Counts confirmed bookings + currently-held intents against capacity.
 * Itinerary purchases never call this — they're digital goods with no scarcity.
 */
export async function remainingCapacityForScheduledDate(
  scheduledDateId: string,
): Promise<{ capacity: number; remaining: number }> {
  const { data: sd, error } = await supabase
    .from('scheduled_dates')
    .select('capacity, spots_booked')
    .eq('id', scheduledDateId)
    .single()

  if (error || !sd) {
    throw new AppError('not-found', 404, 'Scheduled date not found')
  }

  const capacity = sd.capacity as number
  const confirmed = sd.spots_booked as number

  const { data: heldRows, error: heldError } = await supabase
    .from('booking_intents')
    .select('travellers')
    .eq('scheduled_date_id', scheduledDateId)
    .eq('state', 'held')
    .gt('expires_at', new Date().toISOString())

  if (heldError) {
    throw new AppError('db-error', 500, 'Failed to read held intents')
  }

  const held = (heldRows ?? []).reduce(
    (sum, r) => sum + ((r.travellers as number) ?? 0),
    0,
  )

  return { capacity, remaining: Math.max(0, capacity - confirmed - held) }
}

async function remainingCapacityForEventOccurrence(
  eventOccurrenceId: string,
): Promise<{ capacity: number; remaining: number }> {
  const { data: eo, error } = await supabase
    .from('event_occurrences')
    .select('capacity, spots_booked')
    .eq('content_id', eventOccurrenceId)
    .single()

  if (error || !eo) {
    throw new AppError('not-found', 404, 'Event occurrence not found')
  }

  const capacity = (eo.capacity as number | null) ?? 0
  if (capacity <= 0) {
    throw new AppError('unprocessable', 422, 'Event has no capacity set')
  }
  const confirmed = (eo.spots_booked as number | null) ?? 0

  const { data: heldRows, error: heldError } = await supabase
    .from('booking_intents')
    .select('travellers')
    .eq('event_occurrence_id', eventOccurrenceId)
    .eq('state', 'held')
    .gt('expires_at', new Date().toISOString())

  if (heldError) {
    throw new AppError('db-error', 500, 'Failed to read held intents')
  }

  const held = (heldRows ?? []).reduce(
    (sum, r) => sum + ((r.travellers as number) ?? 0),
    0,
  )

  return { capacity, remaining: Math.max(0, capacity - confirmed - held) }
}

// ─── createIntent ────────────────────────────────────────────────────────────

export async function createIntent(
  userId: string,
  contentId: string,
  target: IntentTarget,
  travellers: number,
): Promise<BookingIntent> {
  if (travellers < 1 || travellers > 20) {
    throw new AppError('validation', 422, 'travellers must be between 1 and 20')
  }

  // Validate content exists + published + paid (cheap guard — createBooking
  // re-validates).
  const { data: content, error: contentError } = await supabase
    .from('content')
    .select('id, user_id, status, pricing_model')
    .eq('id', contentId)
    .is('deleted_at', null)
    .single()

  if (contentError || !content) {
    throw new AppError('not-found', 404, 'Content not found')
  }
  if (content.status !== 'published') {
    throw new AppError('not-found', 404, 'Content not found')
  }
  if (content.pricing_model !== 'paid') {
    throw new AppError('unprocessable', 422, 'This content is not paid')
  }
  if (content.user_id === userId) {
    throw new AppError('unprocessable', 422, 'You cannot book your own content')
  }

  // Capacity guard (itineraries skip).
  if (target.kind === 'scheduled_date') {
    const { remaining } = await remainingCapacityForScheduledDate(
      target.scheduledDateId,
    )
    if (remaining < travellers) {
      throw new AppError(
        'capacity-exceeded',
        409,
        `Only ${remaining.toString()} spot(s) remaining`,
      )
    }
  } else if (target.kind === 'event_occurrence') {
    const { remaining } = await remainingCapacityForEventOccurrence(
      target.eventOccurrenceId,
    )
    if (remaining < travellers) {
      throw new AppError(
        'capacity-exceeded',
        409,
        `Only ${remaining.toString()} spot(s) remaining`,
      )
    }
  }

  const expiresAt = new Date(Date.now() + HOLD_TTL_MINUTES * 60_000).toISOString()
  const insertRow: Record<string, unknown> = {
    user_id: userId,
    content_id: contentId,
    travellers,
    state: 'held',
    expires_at: expiresAt,
  }
  if (target.kind === 'scheduled_date') {
    insertRow.scheduled_date_id = target.scheduledDateId
  } else if (target.kind === 'event_occurrence') {
    insertRow.event_occurrence_id = target.eventOccurrenceId
  }

  const { data: row, error } = await supabase
    .from('booking_intents')
    .insert(insertRow)
    .select('*')
    .single()

  if (error || !row) {
    throw new AppError('db-error', 500, 'Failed to create booking intent')
  }

  return rowToIntent(row as Row)
}

// ─── releaseIntent ───────────────────────────────────────────────────────────

/**
 * User backed out — flip held → released so the held seats free up
 * immediately (don't wait for expiry).
 */
export async function releaseIntent(intentId: string, userId: string): Promise<void> {
  const { data: intent, error: fetchError } = await supabase
    .from('booking_intents')
    .select('id, user_id, state')
    .eq('id', intentId)
    .maybeSingle()

  if (fetchError || !intent) {
    throw new AppError('not-found', 404, 'Booking intent not found')
  }
  if ((intent.user_id as string) !== userId) {
    throw new AppError('forbidden', 403, 'Not your intent')
  }
  // Idempotent — anything other than held is a no-op.
  if (intent.state !== 'held') return

  const { error } = await supabase
    .from('booking_intents')
    .update({ state: 'released' })
    .eq('id', intentId)
    .eq('state', 'held')

  if (error) {
    throw new AppError('db-error', 500, 'Failed to release intent')
  }
}

// ─── consumeIntent ───────────────────────────────────────────────────────────

/**
 * Atomically transition held → consumed. Used by createBooking on payment
 * launch. Throws 410 (gone) if the hold has expired or already been consumed
 * — the caller should bounce the user back to Step 1 with a "spots released"
 * toast.
 */
export async function consumeIntent(
  intentId: string,
  userId: string,
): Promise<BookingIntent> {
  const nowIso = new Date().toISOString()
  const { data: row, error } = await supabase
    .from('booking_intents')
    .update({ state: 'consumed' })
    .eq('id', intentId)
    .eq('user_id', userId)
    .eq('state', 'held')
    .gt('expires_at', nowIso)
    .select('*')
    .maybeSingle()

  if (error) {
    throw new AppError('db-error', 500, 'Failed to consume intent')
  }
  if (!row) {
    throw new AppError(
      'gone',
      410,
      'Your hold has expired — please reselect dates',
    )
  }

  return rowToIntent(row as Row)
}

// ─── sweepExpiredIntents ─────────────────────────────────────────────────────

/**
 * Cron-driven (60s). Marks any held intent past expires_at as 'expired'.
 * Pure bookkeeping — release-on-back already keeps the active path clean;
 * this just stops idle held rows from clogging capacity reads.
 */
export async function sweepExpiredIntents(): Promise<{ count: number }> {
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from('booking_intents')
    .update({ state: 'expired' })
    .eq('state', 'held')
    .lt('expires_at', nowIso)
    .select('id')

  if (error) {
    throw new AppError('db-error', 500, 'Failed to sweep expired intents')
  }

  return { count: (data ?? []).length }
}
