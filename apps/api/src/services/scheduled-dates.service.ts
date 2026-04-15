import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'

// ─── Types ───────────────────────────────────────────────────────

export type ScheduledDate = {
  id: string
  contentId: string
  startDate: string
  endDate: string
  capacity: number
  spotsBooked: number
  spotsLeft: number
  isSoldOut: boolean
  isActive: boolean
}

type AddDateInput = {
  startDate: string
  endDate: string
  capacity: number
}

type UpdateDateInput = {
  capacity?: number
  isActive?: boolean
}

// ─── Ownership helper ─────────────────────────────────────────────

/**
 * Verify the content row belongs to userId. Returns the content row.
 */
async function verifyContentOwner(
  contentId: string,
  userId: string,
): Promise<void> {
  const { data: content, error } = await supabase
    .from('content')
    .select('id, user_id')
    .eq('id', contentId)
    .eq('type', 'scheduled_experience')
    .is('deleted_at', null)
    .single()

  if (error || !content) {
    throw new AppError('not-found', 404, 'Experience not found')
  }

  if (content.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You do not own this experience')
  }
}

/**
 * Verify the scheduled_date row belongs to an experience owned by userId.
 * Returns the date row.
 */
async function verifyDateOwner(
  dateId: string,
  userId: string,
): Promise<Record<string, unknown>> {
  const { data: dateRow, error } = await supabase
    .from('scheduled_dates')
    .select('id, content_id, start_date, end_date, capacity, spots_booked, is_active')
    .eq('id', dateId)
    .single()

  if (error || !dateRow) {
    throw new AppError('not-found', 404, 'Scheduled date not found')
  }

  // Verify content ownership
  await verifyContentOwner(dateRow.content_id as string, userId)

  return dateRow
}

// ─── mapRow ───────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): ScheduledDate {
  const capacity = row.capacity as number
  const spotsBooked = row.spots_booked as number
  const spotsLeft = Math.max(0, capacity - spotsBooked)
  return {
    id: row.id as string,
    contentId: row.content_id as string,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    capacity,
    spotsBooked,
    spotsLeft,
    isSoldOut: spotsLeft === 0,
    isActive: row.is_active as boolean,
  }
}

// ─── addScheduledDate ─────────────────────────────────────────────

export async function addScheduledDate(
  contentId: string,
  userId: string,
  data: AddDateInput,
): Promise<{ id: string }> {
  await verifyContentOwner(contentId, userId)

  // Validate capacity range (1–100)
  if (data.capacity < 1 || data.capacity > 100) {
    throw new AppError('validation-failed', 400, 'Capacity must be between 1 and 100', [
      { field: 'capacity', message: 'Capacity must be between 1 and 100', code: 'invalid_range' },
    ])
  }

  // startDate must be in the future (compare date strings — both are YYYY-MM-DD)
  const today = new Date().toISOString().slice(0, 10)
  if (data.startDate <= today) {
    throw new AppError('validation-failed', 400, 'Start date must be in the future', [
      { field: 'start_date', message: 'Start date must be in the future', code: 'in_past' },
    ])
  }

  // endDate must be >= startDate
  if (data.endDate < data.startDate) {
    throw new AppError('validation-failed', 400, 'End date must be on or after start date', [
      { field: 'end_date', message: 'End date must be on or after start date', code: 'invalid_range' },
    ])
  }

  const { data: inserted, error } = await supabase
    .from('scheduled_dates')
    .insert({
      content_id: contentId,
      start_date: data.startDate,
      end_date: data.endDate,
      capacity: data.capacity,
    })
    .select('id')
    .single()

  if (error || !inserted) {
    throw new AppError('db-error', 500, 'Failed to add scheduled date')
  }

  return { id: inserted.id as string }
}

// ─── updateScheduledDate ──────────────────────────────────────────

export async function updateScheduledDate(
  dateId: string,
  userId: string,
  data: UpdateDateInput,
): Promise<void> {
  const dateRow = await verifyDateOwner(dateId, userId)

  const updates: Record<string, unknown> = {}

  if (data.capacity !== undefined) {
    const spotsBooked = dateRow.spots_booked as number
    if (data.capacity < spotsBooked) {
      throw new AppError('validation-failed', 400, 'Capacity cannot be less than current bookings', [
        {
          field: 'capacity',
          message: `Capacity cannot be less than ${String(spotsBooked)} (current bookings)`,
          code: 'below_booked',
        },
      ])
    }
    updates.capacity = data.capacity
  }

  if (data.isActive !== undefined) {
    updates.is_active = data.isActive
  }

  if (Object.keys(updates).length === 0) {
    return
  }

  const { error } = await supabase
    .from('scheduled_dates')
    .update(updates)
    .eq('id', dateId)

  if (error) {
    throw new AppError('db-error', 500, 'Failed to update scheduled date')
  }
}

// ─── deleteScheduledDate ──────────────────────────────────────────

export async function deleteScheduledDate(
  dateId: string,
  userId: string,
): Promise<void> {
  const dateRow = await verifyDateOwner(dateId, userId)

  const spotsBooked = dateRow.spots_booked as number

  if (spotsBooked > 0) {
    // Has bookings — soft-delete only (set is_active=false)
    const { error } = await supabase
      .from('scheduled_dates')
      .update({ is_active: false })
      .eq('id', dateId)

    if (error) {
      throw new AppError('db-error', 500, 'Failed to deactivate scheduled date')
    }
    return
  }

  // No bookings — hard delete
  const { error } = await supabase
    .from('scheduled_dates')
    .delete()
    .eq('id', dateId)

  if (error) {
    throw new AppError('db-error', 500, 'Failed to delete scheduled date')
  }
}

// ─── listScheduledDates ───────────────────────────────────────────

export async function listScheduledDates(
  contentId: string,
): Promise<ScheduledDate[]> {
  const { data, error } = await supabase
    .from('scheduled_dates')
    .select('id, content_id, start_date, end_date, capacity, spots_booked, is_active')
    .eq('content_id', contentId)
    .eq('is_active', true)
    .order('start_date', { ascending: true })

  if (error) {
    throw new AppError('db-error', 500, 'Failed to list scheduled dates')
  }

  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>))
}

// ─── getAvailableDates ────────────────────────────────────────────

export async function getAvailableDates(
  contentId: string,
): Promise<ScheduledDate[]> {
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('scheduled_dates')
    .select('id, content_id, start_date, end_date, capacity, spots_booked, is_active')
    .eq('content_id', contentId)
    .eq('is_active', true)
    .gte('start_date', today)
    .order('start_date', { ascending: true })

  if (error) {
    throw new AppError('db-error', 500, 'Failed to fetch available dates')
  }

  // Filter out sold-out dates
  return (data ?? [])
    .map((row) => mapRow(row as Record<string, unknown>))
    .filter((d) => !d.isSoldOut)
}
