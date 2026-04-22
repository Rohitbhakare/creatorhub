import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import { publish } from './content-state.service.js'
import type {
  CreateItineraryDraftInput,
  UpdateItineraryInput,
  UpdateDayInput,
  AddSpotInput,
  UpdateSpotInput,
} from '@creatorhub/shared'
import {
  MAX_ITINERARY_DAYS,
  MAX_SPOTS_PER_DAY,
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
} from '@creatorhub/shared'

// ─── Types ──────────────────────────────────────────────────

type Row = Record<string, unknown>

type CreatorSummary = {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
}

// ─── Ownership Helpers ──────────────────────────────────────

const DEFAULT_ALLOWED_TYPES = ['self_paced_itinerary'] as const

type OwnershipOpts = {
  requireDraft?: boolean
  allowedTypes?: readonly string[]
}

/**
 * Fetch content row and verify the user owns it.
 *
 * `allowedTypes` whitelists which content.type values are permitted. Defaults
 * to `['self_paced_itinerary']` for backwards compatibility with the existing
 * itinerary handlers. Experience day/spot routes pass
 * `['scheduled_experience']` so the same CRUD functions can persist to the
 * shared `itinerary_days` / `itinerary_spots` tables.
 */
async function verifyContentOwnership(
  contentId: string,
  userId: string,
  opts?: OwnershipOpts,
): Promise<Row> {
  const allowedTypes = opts?.allowedTypes ?? DEFAULT_ALLOWED_TYPES
  const { data: content, error } = await supabase
    .from('content')
    .select('*')
    .eq('id', contentId)
    .is('deleted_at', null)
    .single()

  if (error || !content) {
    throw new AppError('not-found', 404, 'Content not found')
  }

  if (content.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You do not own this content')
  }

  if (!allowedTypes.includes(content.type as string)) {
    throw new AppError(
      'unprocessable',
      422,
      `Content type "${String(content.type)}" is not supported by this endpoint`,
    )
  }

  if (opts?.requireDraft && content.status !== 'draft') {
    throw new AppError('unprocessable', 422, 'Only draft content can be edited')
  }

  return content
}

/**
 * Verify a day belongs to a content item owned by userId.
 * Returns the day row.
 */
async function verifyDayOwnership(
  dayId: string,
  contentId: string,
  userId: string,
  opts?: OwnershipOpts,
): Promise<Row> {
  const { data: day, error } = await supabase
    .from('itinerary_days')
    .select('*')
    .eq('id', dayId)
    .eq('content_id', contentId)
    .single()

  if (error || !day) {
    throw new AppError('not-found', 404, 'Day not found')
  }

  // Verify content ownership
  await verifyContentOwnership(contentId, userId, {
    requireDraft: true,
    ...(opts?.allowedTypes ? { allowedTypes: opts.allowedTypes } : {}),
  })

  return day
}

/**
 * Verify a spot belongs to a day which belongs to a content item owned by userId.
 * Returns the spot row.
 */
async function verifySpotOwnership(
  spotId: string,
  dayId: string,
  contentId: string,
  userId: string,
  opts?: OwnershipOpts,
): Promise<Row> {
  // First verify day + content ownership
  await verifyDayOwnership(dayId, contentId, userId, opts)

  const { data: spot, error } = await supabase
    .from('itinerary_spots')
    .select('*')
    .eq('id', spotId)
    .eq('itinerary_day_id', dayId)
    .single()

  if (error || !spot) {
    throw new AppError('not-found', 404, 'Spot not found')
  }

  return spot
}

// ─── createItineraryDraft ───────────────────────────────────

export async function createItineraryDraft(
  userId: string,
  input: CreateItineraryDraftInput,
): Promise<Row> {
  const dayCount = input.day_count ?? 1

  // Create the content row
  const { data: content, error: contentError } = await supabase
    .from('content')
    .insert({
      user_id: userId,
      type: 'self_paced_itinerary',
      vertical: input.vertical,
      status: 'draft',
      visibility: 'public',
      pricing_model: 'free',
      price_paisa: 0,
    })
    .select('*')
    .single()

  if (contentError || !content) {
    throw new AppError('db-error', 500, 'Failed to create itinerary draft')
  }

  // Create empty day rows
  if (dayCount > 0) {
    const dayRows = Array.from({ length: dayCount }, (_, i) => ({
      content_id: content.id as string,
      day_number: i + 1,
    }))

    const { error: dayError } = await supabase
      .from('itinerary_days')
      .insert(dayRows)

    if (dayError) {
      throw new AppError('db-error', 500, 'Failed to create itinerary days')
    }
  }

  return content
}

// ─── getItineraryDetail ─────────────────────────────────────

export async function getItineraryDetail(
  contentId: string,
  requesterId?: string | null,
): Promise<{
  content: Row
  days: Row[]
  media: Row[]
  creator: CreatorSummary
}> {
  // Fetch content
  const { data: content, error: contentError } = await supabase
    .from('content')
    .select('*')
    .eq('id', contentId)
    .is('deleted_at', null)
    .single()

  if (contentError || !content) {
    throw new AppError('not-found', 404, 'Content not found')
  }

  if (content.type !== 'self_paced_itinerary') {
    throw new AppError('not-found', 404, 'Content not found')
  }

  // Visibility check: non-owners can only see published + public content
  const isOwner = requesterId != null && content.user_id === requesterId
  if (!isOwner) {
    if (content.status !== 'published' || content.visibility === 'private') {
      throw new AppError('not-found', 404, 'Content not found')
    }
  }

  // Fetch days
  const { data: days } = await supabase
    .from('itinerary_days')
    .select('*')
    .eq('content_id', contentId)
    .order('day_number', { ascending: true })

  const allDays = days ?? []
  const dayIds = allDays.map((d) => d.id as string)

  // Fetch all spots for these days
  let spots: Row[] = []
  if (dayIds.length > 0) {
    const { data: spotData } = await supabase
      .from('itinerary_spots')
      .select('*')
      .in('itinerary_day_id', dayIds)
      .order('spot_order', { ascending: true })

    spots = spotData ?? []
  }

  // For paid itineraries where requester is NOT the owner:
  // only return spots with is_free_preview = true (Day 1 spots)
  const isPaid = content.pricing_model === 'paid'
  // TODO: check if requester is a buyer (bookings table) — for now, only owner sees all
  const isBuyer = false

  const filteredSpots = !isOwner && !isBuyer && isPaid
    ? spots.filter((s) => s.is_free_preview === true)
    : spots

  // Extract lat/lng from PostGIS point for each spot
  const spotsWithCoords = await extractSpotCoordinates(filteredSpots)

  // Group spots by day
  const spotsByDay = new Map<string, Row[]>()
  for (const spot of spotsWithCoords) {
    const dayId = spot.itinerary_day_id as string
    const existing = spotsByDay.get(dayId) ?? []
    existing.push(spot)
    spotsByDay.set(dayId, existing)
  }

  const daysWithSpots = allDays.map((day) => ({
    ...day,
    spots: spotsByDay.get(day.id as string) ?? [],
  }))

  // Fetch media
  const { data: media } = await supabase
    .from('content_media')
    .select('*')
    .eq('content_id', contentId)
    .order('display_order', { ascending: true })

  // Fetch creator profile
  const { data: creator } = await supabase
    .from('users')
    .select('id, display_name, username, avatar_url')
    .eq('id', content.user_id as string)
    .single()

  if (!creator) {
    throw new AppError('not-found', 404, 'Creator not found')
  }

  return {
    content,
    days: daysWithSpots,
    media: media ?? [],
    creator: {
      id: creator.id as string,
      display_name: (creator.display_name as string) ?? null,
      username: (creator.username as string) ?? null,
      avatar_url: (creator.avatar_url as string) ?? null,
    },
  }
}

/**
 * Extract lat/lng from PostGIS geography point column.
 * Supabase returns geography as GeoJSON string or object.
 * We parse it and add flat lat/lng fields.
 */
async function extractSpotCoordinates(spots: Row[]): Promise<Row[]> {
  if (spots.length === 0) return []

  const spotIds = spots.map((s) => s.id as string)

  // Use raw query via RPC to extract coordinates
  const { data, error } = await supabase.rpc('extract_spot_coords', {
    spot_ids: spotIds,
  })

  if (error || !data) {
    // Fallback: return spots without coordinates parsed
    return spots.map((s) => {
      const point = s.point
      if (point && typeof point === 'object') {
        const geo = point as { type?: string; coordinates?: number[] }
        if (geo.coordinates && geo.coordinates.length >= 2) {
          return {
            ...s,
            lng: geo.coordinates[0],
            lat: geo.coordinates[1],
            point: undefined,
          }
        }
      }
      return { ...s, point: undefined }
    })
  }

  // Build a map of spot_id -> {lat, lng}
  const coordMap = new Map<string, { lat: number; lng: number }>()
  for (const row of data as Array<{ id: string; lat: number; lng: number }>) {
    coordMap.set(row.id, { lat: row.lat, lng: row.lng })
  }

  return spots.map((s) => {
    const coords = coordMap.get(s.id as string)
    return {
      ...s,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
      point: undefined, // strip raw PostGIS column
    }
  })
}

// ─── updateItinerary ────────────────────────────────────────

export async function updateItinerary(
  contentId: string,
  userId: string,
  updates: UpdateItineraryInput,
): Promise<Row> {
  const content = await verifyContentOwnership(contentId, userId, { requireDraft: true })

  // Handle day_count changes
  if (updates.day_count != null) {
    await handleDayCountChange(contentId, content, updates.day_count)
  }

  // Build update payload (exclude day_count — that's handled above)
  const { day_count: _dayCount, ...contentUpdates } = updates

  if (Object.keys(contentUpdates).length > 0) {
    const { data, error } = await supabase
      .from('content')
      .update(contentUpdates)
      .eq('id', contentId)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error || !data) {
      throw new AppError('db-error', 500, 'Failed to update itinerary')
    }

    return data
  }

  // If only day_count was updated, re-fetch content
  const { data: refreshed, error: refreshError } = await supabase
    .from('content')
    .select('*')
    .eq('id', contentId)
    .single()

  if (refreshError || !refreshed) {
    throw new AppError('db-error', 500, 'Failed to fetch itinerary')
  }

  return refreshed
}

/**
 * Set the total day count for any content row that uses the shared
 * `itinerary_days` table. Adds empty days if growing, deletes excess (and
 * cascaded spots) if shrinking. Used by the experience day-plan step.
 */
export async function setDayCount(
  contentId: string,
  userId: string,
  newCount: number,
  opts?: OwnershipOpts,
): Promise<void> {
  const content = await verifyContentOwnership(contentId, userId, {
    requireDraft: true,
    ...(opts?.allowedTypes ? { allowedTypes: opts.allowedTypes } : {}),
  })
  await handleDayCountChange(contentId, content, newCount)
}

async function handleDayCountChange(
  contentId: string,
  _content: Row,
  newCount: number,
): Promise<void> {
  // Get current days
  const { data: currentDays, error } = await supabase
    .from('itinerary_days')
    .select('id, day_number')
    .eq('content_id', contentId)
    .order('day_number', { ascending: true })

  if (error) {
    throw new AppError('db-error', 500, 'Failed to fetch days')
  }

  const oldCount = currentDays?.length ?? 0

  if (newCount > oldCount) {
    // Add empty days
    const newDays = Array.from({ length: newCount - oldCount }, (_, i) => ({
      content_id: contentId,
      day_number: oldCount + i + 1,
    }))

    const { error: insertError } = await supabase
      .from('itinerary_days')
      .insert(newDays)

    if (insertError) {
      throw new AppError('db-error', 500, 'Failed to add days')
    }
  } else if (newCount < oldCount) {
    // Remove excess days (cascade deletes their spots)
    const daysToRemove = (currentDays ?? [])
      .filter((d) => (d.day_number as number) > newCount)
      .map((d) => d.id as string)

    if (daysToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('itinerary_days')
        .delete()
        .in('id', daysToRemove)

      if (deleteError) {
        throw new AppError('db-error', 500, 'Failed to remove excess days')
      }
    }
  }
}

// ─── addDay ─────────────────────────────────────────────────

export async function addDay(
  contentId: string,
  userId: string,
  opts?: OwnershipOpts,
): Promise<Row> {
  await verifyContentOwnership(contentId, userId, {
    requireDraft: true,
    ...(opts?.allowedTypes ? { allowedTypes: opts.allowedTypes } : {}),
  })

  // Get current max day_number
  const { data: days, error: countError } = await supabase
    .from('itinerary_days')
    .select('day_number')
    .eq('content_id', contentId)
    .order('day_number', { ascending: false })
    .limit(1)

  if (countError) {
    throw new AppError('db-error', 500, 'Failed to count days')
  }

  const maxDayNumber = days && days.length > 0 ? (days[0]!.day_number as number) : 0

  if (maxDayNumber >= MAX_ITINERARY_DAYS) {
    throw new AppError(
      'validation-failed',
      400,
      `Maximum ${String(MAX_ITINERARY_DAYS)} days allowed per itinerary`,
    )
  }

  const { data: day, error } = await supabase
    .from('itinerary_days')
    .insert({
      content_id: contentId,
      day_number: maxDayNumber + 1,
    })
    .select('*')
    .single()

  if (error || !day) {
    throw new AppError('db-error', 500, 'Failed to add day')
  }

  return day
}

// ─── updateDay ──────────────────────────────────────────────

export async function updateDay(
  dayId: string,
  contentId: string,
  userId: string,
  updates: UpdateDayInput,
  opts?: OwnershipOpts,
): Promise<Row> {
  await verifyDayOwnership(dayId, contentId, userId, opts)

  const { data, error } = await supabase
    .from('itinerary_days')
    .update(updates)
    .eq('id', dayId)
    .select('*')
    .single()

  if (error || !data) {
    throw new AppError('db-error', 500, 'Failed to update day')
  }

  return data
}

// ─── removeDay ──────────────────────────────────────────────

export async function removeDay(
  dayId: string,
  contentId: string,
  userId: string,
  opts?: OwnershipOpts,
): Promise<void> {
  const day = await verifyDayOwnership(dayId, contentId, userId, opts)
  const deletedDayNumber = day.day_number as number

  // Delete the day (cascade deletes spots)
  const { error } = await supabase
    .from('itinerary_days')
    .delete()
    .eq('id', dayId)

  if (error) {
    throw new AppError('db-error', 500, 'Failed to remove day')
  }

  // Renumber remaining days via RPC (Supabase client can't do decrement)
  const { error: rpcError } = await supabase.rpc('renumber_itinerary_days', {
    p_content_id: contentId,
    p_deleted_day_number: deletedDayNumber,
  })

  if (rpcError) {
    // Non-fatal: days might have gaps in numbering but still functional
    console.error('[itinerary] failed to renumber days:', rpcError.message)
  }
}

// ─── addSpot ────────────────────────────────────────────────

export async function addSpot(
  dayId: string,
  contentId: string,
  userId: string,
  spotData: AddSpotInput,
  opts?: OwnershipOpts,
): Promise<Row> {
  const day = await verifyDayOwnership(dayId, contentId, userId, opts)

  // Get current max spot_order in this day
  const { data: existingSpots, error: countError } = await supabase
    .from('itinerary_spots')
    .select('spot_order')
    .eq('itinerary_day_id', dayId)
    .order('spot_order', { ascending: false })
    .limit(1)

  if (countError) {
    throw new AppError('db-error', 500, 'Failed to count spots')
  }

  const maxOrder = existingSpots && existingSpots.length > 0
    ? (existingSpots[0]!.spot_order as number)
    : -1

  if (maxOrder + 1 >= MAX_SPOTS_PER_DAY) {
    throw new AppError(
      'validation-failed',
      400,
      `Maximum ${String(MAX_SPOTS_PER_DAY)} spots allowed per day`,
    )
  }

  const newOrder = maxOrder + 1

  // Day 1 spots get is_free_preview = true
  const isDayOne = (day.day_number as number) === 1

  // Insert with PostGIS point
  const { data: spot, error } = await supabase.rpc('insert_itinerary_spot', {
    p_itinerary_day_id: dayId,
    p_spot_order: newOrder,
    p_google_place_id: spotData.google_place_id ?? null,
    p_name: spotData.name,
    p_category: spotData.category ?? null,
    p_lng: spotData.lng,
    p_lat: spotData.lat,
    p_thumbnail_url: spotData.thumbnail_url ?? null,
    p_creator_note: spotData.creator_note ?? null,
    p_duration_minutes: spotData.duration_minutes ?? null,
    p_stop_type: spotData.stop_type ?? 'regular',
    p_is_free_preview: isDayOne,
  })

  if (error || !spot) {
    throw new AppError('db-error', 500, 'Failed to add spot')
  }

  // Return with flat lat/lng
  const result = Array.isArray(spot) ? spot[0] : spot
  return {
    ...(result as Row),
    lat: spotData.lat,
    lng: spotData.lng,
  }
}

// ─── updateSpot ─────────────────────────────────────────────

export async function updateSpot(
  spotId: string,
  dayId: string,
  contentId: string,
  userId: string,
  updates: UpdateSpotInput,
  opts?: OwnershipOpts,
): Promise<Row> {
  await verifySpotOwnership(spotId, dayId, contentId, userId, opts)

  const { data, error } = await supabase
    .from('itinerary_spots')
    .update(updates)
    .eq('id', spotId)
    .select('*')
    .single()

  if (error || !data) {
    throw new AppError('db-error', 500, 'Failed to update spot')
  }

  return data
}

// ─── removeSpot ─────────────────────────────────────────────

export async function removeSpot(
  spotId: string,
  dayId: string,
  contentId: string,
  userId: string,
  opts?: OwnershipOpts,
): Promise<void> {
  const spot = await verifySpotOwnership(spotId, dayId, contentId, userId, opts)
  const deletedOrder = spot.spot_order as number

  const { error } = await supabase
    .from('itinerary_spots')
    .delete()
    .eq('id', spotId)

  if (error) {
    throw new AppError('db-error', 500, 'Failed to remove spot')
  }

  // Renumber remaining spots in this day
  const { error: rpcError } = await supabase.rpc('renumber_itinerary_spots', {
    p_day_id: dayId,
    p_deleted_order: deletedOrder,
  })

  if (rpcError) {
    console.error('[itinerary] failed to renumber spots:', rpcError.message)
  }
}

// ─── reorderSpots ───────────────────────────────────────────

export async function reorderSpots(
  dayId: string,
  contentId: string,
  userId: string,
  spotIds: string[],
  opts?: OwnershipOpts,
): Promise<void> {
  await verifyDayOwnership(dayId, contentId, userId, opts)

  // Verify all spotIds belong to this day
  const { data: existingSpots, error: fetchError } = await supabase
    .from('itinerary_spots')
    .select('id')
    .eq('itinerary_day_id', dayId)

  if (fetchError) {
    throw new AppError('db-error', 500, 'Failed to fetch spots')
  }

  const existingIds = new Set((existingSpots ?? []).map((s) => s.id as string))

  for (const spotId of spotIds) {
    if (!existingIds.has(spotId)) {
      throw new AppError(
        'validation-failed',
        400,
        `Spot ${spotId} does not belong to this day`,
      )
    }
  }

  if (spotIds.length !== existingIds.size) {
    throw new AppError(
      'validation-failed',
      400,
      'All spots in the day must be included in the reorder list',
    )
  }

  // Update each spot_order
  for (let i = 0; i < spotIds.length; i++) {
    const { error } = await supabase
      .from('itinerary_spots')
      .update({ spot_order: i })
      .eq('id', spotIds[i]!)

    if (error) {
      throw new AppError('db-error', 500, 'Failed to reorder spots')
    }
  }
}

// ─── publishItinerary ───────────────────────────────────────

export async function publishItinerary(
  contentId: string,
  userId: string,
  tncAccepted: boolean,
): Promise<Row> {
  // Fetch content to do pre-publish validation
  const content = await verifyContentOwnership(contentId, userId, { requireDraft: true })

  // Title validation
  const title = content.title as string | null
  if (!title || title.trim().length < MIN_TITLE_LENGTH) {
    throw new AppError(
      'validation-failed',
      400,
      `Title must be at least ${String(MIN_TITLE_LENGTH)} characters`,
    )
  }
  if (title.trim().length > MAX_TITLE_LENGTH) {
    throw new AppError(
      'validation-failed',
      400,
      `Title must be at most ${String(MAX_TITLE_LENGTH)} characters`,
    )
  }

  // Vertical validation
  if (!content.vertical) {
    throw new AppError('validation-failed', 400, 'Vertical must be set')
  }

  // Fetch days
  const { data: days, error: daysError } = await supabase
    .from('itinerary_days')
    .select('id, day_number')
    .eq('content_id', contentId)
    .order('day_number', { ascending: true })

  if (daysError || !days || days.length === 0) {
    throw new AppError('validation-failed', 400, 'Itinerary must have at least 1 day')
  }

  // Check each day has at least 1 spot
  const dayIds = days.map((d) => d.id as string)
  const { data: spotCounts, error: spotError } = await supabase
    .from('itinerary_spots')
    .select('itinerary_day_id')
    .in('itinerary_day_id', dayIds)

  if (spotError) {
    throw new AppError('db-error', 500, 'Failed to validate spots')
  }

  const daysWithSpots = new Set(
    (spotCounts ?? []).map((s) => s.itinerary_day_id as string),
  )

  for (const day of days) {
    if (!daysWithSpots.has(day.id as string)) {
      throw new AppError(
        'validation-failed',
        400,
        `Day ${String(day.day_number)} has no spots`,
      )
    }
  }

  // For paid itineraries: ensure Day 1 spots have is_free_preview=true
  if (content.pricing_model === 'paid') {
    const dayOneId = days.find((d) => (d.day_number as number) === 1)?.id as string | undefined
    if (dayOneId) {
      await supabase
        .from('itinerary_spots')
        .update({ is_free_preview: true })
        .eq('itinerary_day_id', dayOneId)
    }

    // KYC check is handled by the state machine's publish()
  }

  // Delegate to the state machine publish
  return await publish(contentId, userId, tncAccepted)
}

// ─── computeDayStats ────────────────────────────────────────

export async function computeDayStats(
  dayId: string,
  contentId: string,
  userId: string,
): Promise<Row> {
  await verifyDayOwnership(dayId, contentId, userId)

  // Use RPC to compute total distance using PostGIS ST_Distance
  const { data: stats, error } = await supabase.rpc('compute_day_stats', {
    p_day_id: dayId,
  })

  if (error) {
    throw new AppError('db-error', 500, 'Failed to compute day stats')
  }

  const result = Array.isArray(stats) ? stats[0] : stats
  const totalDistanceKm = (result as Row)?.total_distance_km ?? 0
  const estimatedHours = (result as Row)?.estimated_hours ?? 0

  // Update the day row
  const { data: updated, error: updateError } = await supabase
    .from('itinerary_days')
    .update({
      total_distance_km: totalDistanceKm,
      estimated_hours: estimatedHours,
    })
    .eq('id', dayId)
    .select('*')
    .single()

  if (updateError || !updated) {
    throw new AppError('db-error', 500, 'Failed to update day stats')
  }

  return updated
}
