import { supabase } from '../lib/supabase.js'
import { AppError, type FieldError } from '../errors/AppError.js'
import { createDraft } from './content.service.js'
import { publish } from './content-state.service.js'
import {
  MIN_EVENT_TITLE_LENGTH,
  MAX_EVENT_TITLE_LENGTH,
  MAX_EVENT_DESCRIPTION_LENGTH,
  MIN_EVENT_CAPACITY,
  MAX_EVENT_CAPACITY,
  MAX_EVENT_IMAGES,
} from '@creatorhub/shared'
import type { UpdateEventInput, EventListQueryInput } from '@creatorhub/shared'

// ─── Types ──────────────────────────────────────────────────────

type Row = Record<string, unknown>

type CreatorSummary = {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
}

type AttendeeItem = {
  id: string
  display_name: string | null
  avatar_url: string | null
}

type EventDetailResult = {
  content: Row
  occurrence: Row
  media: Row[]
  creator: CreatorSummary
  attendees: AttendeeItem[]
  attendee_count: number
  has_rsvpd: boolean
}

type EventListResult = {
  items: Row[]
  next_cursor: string | null
}

// ─── Ownership helper ────────────────────────────────────────────

async function verifyEventOwnership(
  contentId: string,
  userId: string,
  opts?: { requireDraft?: boolean },
): Promise<Row> {
  const { data: content, error } = await supabase
    .from('content')
    .select('*')
    .eq('id', contentId)
    .eq('type', 'event')
    .is('deleted_at', null)
    .single()

  if (error || !content) {
    throw new AppError('not-found', 404, 'Event not found')
  }

  if (content.user_id !== userId) {
    throw new AppError('forbidden', 403, 'You do not own this event')
  }

  if (opts?.requireDraft && content.status !== 'draft') {
    throw new AppError('unprocessable', 422, 'Only draft events can be edited')
  }

  return content
}

// ─── Cursor helpers ──────────────────────────────────────────────

function encodeCursor(startAt: string, id: string): string {
  return Buffer.from(`${startAt}|${id}`).toString('base64url')
}

function decodeCursor(cursor: string): { startAt: string; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64url').toString('utf8')
    const [startAt, id] = decoded.split('|')
    if (!startAt || !id) return null
    return { startAt, id }
  } catch {
    return null
  }
}

// ─── createEventDraft ────────────────────────────────────────────

export async function createEventDraft(
  userId: string,
  input: { vertical: string },
): Promise<Row> {
  // Create the content row
  const content = await createDraft(userId, {
    type: 'event',
    vertical: input.vertical as 'travel' | 'stories' | 'food' | 'fitness' | 'education' | 'photography' | 'music' | 'wellness',
  })

  const contentId = content.id as string

  // Insert stub event_occurrences row (all fields nullable per migration 014)
  const { error: occError } = await supabase
    .from('event_occurrences')
    .insert({ content_id: contentId })

  if (occError) {
    // Clean up the content row to avoid orphan
    await supabase.from('content').delete().eq('id', contentId)
    throw new AppError('db-error', 500, 'Failed to initialize event draft')
  }

  return content
}

// ─── getEventDetail ──────────────────────────────────────────────

export async function getEventDetail(
  contentId: string,
  requesterId?: string | null,
): Promise<EventDetailResult> {
  // Fetch content row
  const { data: content, error: contentError } = await supabase
    .from('content')
    .select('*')
    .eq('id', contentId)
    .eq('type', 'event')
    .is('deleted_at', null)
    .single()

  if (contentError || !content) {
    throw new AppError('not-found', 404, 'Event not found')
  }

  // Visibility: non-owners only see published events
  const isOwner = requesterId != null && content.user_id === requesterId
  if (!isOwner && content.status !== 'published') {
    throw new AppError('not-found', 404, 'Event not found')
  }

  // Fetch event_occurrences
  const { data: occurrence, error: occError } = await supabase
    .from('event_occurrences')
    .select('*')
    .eq('content_id', contentId)
    .single()

  if (occError || !occurrence) {
    throw new AppError('not-found', 404, 'Event not found')
  }

  // Queries 3-6 are independent of each other — run in parallel
  const [
    { data: media },
    { data: creator },
    { data: attendeeRows, count: totalCount },
    rsvpResult,
  ] = await Promise.all([
    // Fetch media
    supabase
      .from('content_media')
      .select('*')
      .eq('content_id', contentId)
      .order('display_order', { ascending: true }),

    // Fetch creator
    supabase
      .from('users')
      .select('id, display_name, username, avatar_url')
      .eq('id', content.user_id as string)
      .single(),

    // Fetch first 4 attendees + total count
    supabase
      .from('bookings')
      .select('user_id, users!inner(id, display_name, avatar_url)', { count: 'exact' })
      .eq('content_id', contentId)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: true })
      .limit(4),

    // Check if requester has RSVP'd (no-op if unauthenticated)
    requesterId
      ? supabase
          .from('bookings')
          .select('id')
          .eq('content_id', contentId)
          .eq('user_id', requesterId)
          .eq('status', 'confirmed')
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  if (!creator) {
    throw new AppError('not-found', 404, 'Creator not found')
  }

  const attendees: AttendeeItem[] = (attendeeRows ?? []).map((row) => {
    const u = (row as Record<string, unknown>).users as Record<string, unknown>
    return {
      id: u.id as string,
      display_name: (u.display_name as string) ?? null,
      avatar_url: (u.avatar_url as string) ?? null,
    }
  })

  const hasRsvpd = rsvpResult.data != null

  return {
    content,
    occurrence,
    media: media ?? [],
    creator: {
      id: creator.id as string,
      display_name: (creator.display_name as string) ?? null,
      username: (creator.username as string) ?? null,
      avatar_url: (creator.avatar_url as string) ?? null,
    },
    attendees,
    attendee_count: totalCount ?? 0,
    has_rsvpd: hasRsvpd,
  }
}

// ─── updateEvent ─────────────────────────────────────────────────

export async function updateEvent(
  contentId: string,
  userId: string,
  input: UpdateEventInput,
): Promise<{ id: string; updated_at: string }> {
  await verifyEventOwnership(contentId, userId, { requireDraft: true })

  // Split updates: content-level fields vs event_occurrences fields
  const contentUpdates: Record<string, unknown> = {}
  const occurrenceUpdates: Record<string, unknown> = {}

  if (input.title !== undefined) contentUpdates.title = input.title
  if (input.description !== undefined) contentUpdates.description = input.description
  if (input.tags !== undefined) contentUpdates.tags = input.tags
  if (input.sub_category_id !== undefined) contentUpdates.sub_category_id = input.sub_category_id
  if (input.visibility !== undefined) contentUpdates.visibility = input.visibility
  if (input.vertical_data !== undefined) contentUpdates.vertical_data = input.vertical_data
  if (input.facets !== undefined) contentUpdates.facets = input.facets

  if (input.start_at !== undefined) occurrenceUpdates.start_at = input.start_at
  if (input.end_at !== undefined) occurrenceUpdates.end_at = input.end_at
  if (input.timezone !== undefined) occurrenceUpdates.timezone = input.timezone
  if (input.venue_name !== undefined) occurrenceUpdates.venue_name = input.venue_name
  if (input.venue_address !== undefined) occurrenceUpdates.venue_address = input.venue_address
  if (input.city_id !== undefined) occurrenceUpdates.city_id = input.city_id
  if (input.capacity !== undefined) occurrenceUpdates.capacity = input.capacity
  if (input.what_to_bring !== undefined) occurrenceUpdates.what_to_bring = input.what_to_bring

  // Build PostGIS point if both lat/lng provided
  if (input.venue_lat !== undefined && input.venue_lng !== undefined) {
    occurrenceUpdates.venue_point = `SRID=4326;POINT(${input.venue_lng} ${input.venue_lat})`
  }

  // Update content row (if any content fields changed)
  let updatedAt = new Date().toISOString()
  if (Object.keys(contentUpdates).length > 0) {
    const { data, error } = await supabase
      .from('content')
      .update(contentUpdates)
      .eq('id', contentId)
      .eq('user_id', userId)
      .select('updated_at')
      .single()

    if (error || !data) {
      throw new AppError('db-error', 500, 'Failed to update event')
    }
    updatedAt = data.updated_at as string
  }

  // Upsert event_occurrences row (INSERT ON CONFLICT DO UPDATE)
  if (Object.keys(occurrenceUpdates).length > 0) {
    const { error: occError } = await supabase
      .from('event_occurrences')
      .update(occurrenceUpdates)
      .eq('content_id', contentId)

    if (occError) {
      throw new AppError('db-error', 500, 'Failed to update event details')
    }
  }

  return { id: contentId, updated_at: updatedAt }
}

// ─── publishEvent ────────────────────────────────────────────────

export async function publishEvent(
  contentId: string,
  userId: string,
  tncAccepted: boolean,
): Promise<Row> {
  await verifyEventOwnership(contentId, userId, { requireDraft: true })

  // Fetch content, occurrence, and media count in parallel
  const [{ data: content }, { data: occurrence }, { count: mediaCount }] =
    await Promise.all([
      supabase.from('content').select('*').eq('id', contentId).single(),
      supabase
        .from('event_occurrences')
        .select('*')
        .eq('content_id', contentId)
        .single(),
      supabase
        .from('content_media')
        .select('id', { count: 'exact', head: true })
        .eq('content_id', contentId)
        .eq('media_type', 'image'),
    ])

  if (!content || !occurrence) {
    throw new AppError('not-found', 404, 'Event not found')
  }

  // Collect all field errors before throwing
  const errors: FieldError[] = []

  const title = (content.title as string) ?? ''
  if (title.trim().length < MIN_EVENT_TITLE_LENGTH) {
    errors.push({ field: 'title', message: `Title must be at least ${MIN_EVENT_TITLE_LENGTH} characters`, code: 'too_short' })
  }
  if (title.trim().length > MAX_EVENT_TITLE_LENGTH) {
    errors.push({ field: 'title', message: `Title must be at most ${MAX_EVENT_TITLE_LENGTH} characters`, code: 'too_long' })
  }

  const description = (content.description as string) ?? ''
  if (description.trim().length === 0) {
    errors.push({ field: 'description', message: 'Description is required', code: 'required' })
  }
  if (description.trim().length > MAX_EVENT_DESCRIPTION_LENGTH) {
    errors.push({ field: 'description', message: `Description must be at most ${MAX_EVENT_DESCRIPTION_LENGTH} characters`, code: 'too_long' })
  }

  if (!occurrence.venue_name) {
    errors.push({ field: 'venue_name', message: 'Venue name is required', code: 'required' })
  }
  if (!occurrence.venue_address) {
    errors.push({ field: 'venue_address', message: 'Venue address is required', code: 'required' })
  }
  if (!occurrence.venue_point) {
    errors.push({ field: 'venue_point', message: 'Venue coordinates are required', code: 'required' })
  }
  if (!occurrence.city_id) {
    errors.push({ field: 'city_id', message: 'City is required', code: 'required' })
  }

  const capacity = occurrence.capacity as number | null
  if (capacity == null) {
    errors.push({ field: 'capacity', message: 'Capacity is required', code: 'required' })
  } else if (capacity < MIN_EVENT_CAPACITY) {
    errors.push({ field: 'capacity', message: `Capacity must be at least ${MIN_EVENT_CAPACITY}`, code: 'too_low' })
  } else if (capacity > MAX_EVENT_CAPACITY) {
    errors.push({ field: 'capacity', message: `Capacity must be at most ${MAX_EVENT_CAPACITY}`, code: 'too_high' })
  }

  const startAt = occurrence.start_at as string | null
  const endAt = occurrence.end_at as string | null

  if (!startAt) {
    errors.push({ field: 'start_at', message: 'Start date/time is required', code: 'required' })
  } else {
    const startDate = new Date(startAt)
    if (startDate <= new Date()) {
      errors.push({ field: 'start_at', message: 'Event start time must be in the future', code: 'in_past' })
    }
  }

  if (!endAt) {
    errors.push({ field: 'end_at', message: 'End date/time is required', code: 'required' })
  }

  // Validate same-day constraint and end > start
  if (startAt && endAt && errors.filter(e => e.field === 'start_at' || e.field === 'end_at').length === 0) {
    const startDate = new Date(startAt)
    const endDate = new Date(endAt)
    const timezone = (occurrence.timezone as string) ?? 'Asia/Kolkata'

    if (endDate <= startDate) {
      errors.push({ field: 'end_at', message: 'End time must be after start time', code: 'invalid_range' })
    }

    // Same-day check: compare local calendar dates in event timezone
    const startLocal = new Intl.DateTimeFormat('en-CA', { timeZone: timezone })
      .format(startDate)
    const endLocal = new Intl.DateTimeFormat('en-CA', { timeZone: timezone })
      .format(endDate)

    if (startLocal !== endLocal) {
      errors.push({ field: 'end_at', message: 'Events must start and end on the same day', code: 'different_day' })
    }
  }

  // Cover images — optional for M1 (media upload step not yet implemented)
  // mediaCount was fetched in the parallel block above; only enforce the upper bound
  if ((mediaCount ?? 0) > MAX_EVENT_IMAGES) {
    errors.push({ field: 'cover_image', message: `Events can have at most ${MAX_EVENT_IMAGES} images`, code: 'too_many' })
  }

  if (errors.length > 0) {
    throw new AppError(
      'validation-failed',
      400,
      'Event cannot be published. See errors for details.',
      errors,
    )
  }

  // Force free pricing (M1: all events are free)
  await supabase
    .from('content')
    .update({ pricing_model: 'free', price_paisa: 0 })
    .eq('id', contentId)

  await supabase
    .from('event_occurrences')
    .update({ is_free: true })
    .eq('content_id', contentId)

  // Delegate to state machine
  return publish(contentId, userId, tncAccepted)
}

// ─── rsvpEvent ───────────────────────────────────────────────────

export async function rsvpEvent(
  contentId: string,
  userId: string,
): Promise<{ booking_id: string; event_id: string; status: string; spots_booked: number }> {
  // Fetch event
  const { data: content } = await supabase
    .from('content')
    .select('id, user_id, status, type')
    .eq('id', contentId)
    .eq('type', 'event')
    .is('deleted_at', null)
    .single()

  if (!content || content.status !== 'published') {
    throw new AppError('not-found', 404, 'Event not found')
  }

  // Creator cannot RSVP own event
  if (content.user_id === userId) {
    throw new AppError('conflict', 422, 'You cannot RSVP to your own event', [
      { field: 'user_id', message: 'You cannot RSVP to your own event', code: 'own_event' },
    ])
  }

  // Check event is in the future
  const { data: occurrence } = await supabase
    .from('event_occurrences')
    .select('start_at, capacity, spots_booked')
    .eq('content_id', contentId)
    .single()

  if (!occurrence || !occurrence.start_at) {
    throw new AppError('not-found', 404, 'Event not found')
  }

  if (new Date(occurrence.start_at as string) <= new Date()) {
    throw new AppError('unprocessable', 422, 'This event has already happened', [
      { field: 'start_at', message: 'This event has already happened', code: 'event_past' },
    ])
  }

  // Check not already RSVP'd
  const { data: existingBooking } = await supabase
    .from('bookings')
    .select('id')
    .eq('content_id', contentId)
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .maybeSingle()

  if (existingBooking) {
    throw new AppError('conflict', 409, 'You have already RSVP\'d to this event', [
      { field: 'user_id', message: 'You have already RSVP\'d to this event', code: 'already_rsvpd' },
    ])
  }

  // Atomic capacity check + increment:
  // UPDATE ... WHERE spots_booked < capacity RETURNING spots_booked
  // If 0 rows updated → event is full (race condition safe — no SELECT gap)
  const { data: updatedOcc, error: updateError } = await supabase
    .from('event_occurrences')
    .update({ spots_booked: (occurrence.spots_booked as number) + 1 })
    .eq('content_id', contentId)
    .lt('spots_booked', occurrence.capacity as number)
    .select('spots_booked')
    .maybeSingle()

  if (updateError || !updatedOcc) {
    throw new AppError('conflict', 409, 'This event is at capacity', [
      { field: 'capacity', message: 'This event is at capacity', code: 'event_full' },
    ])
  }

  // Insert booking row
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      content_id: contentId,
      user_id: userId,
      creator_id: content.user_id as string,
      status: 'confirmed',
      price_paisa: 0,
    })
    .select('id')
    .single()

  if (bookingError || !booking) {
    // Rollback the spots_booked increment
    await supabase
      .from('event_occurrences')
      .update({ spots_booked: (occurrence.spots_booked as number) })
      .eq('content_id', contentId)

    throw new AppError('db-error', 500, 'Failed to create RSVP')
  }

  return {
    booking_id: booking.id as string,
    event_id: contentId,
    status: 'confirmed',
    spots_booked: updatedOcc.spots_booked as number,
  }
}

// ─── cancelRsvp ──────────────────────────────────────────────────

export async function cancelRsvp(
  contentId: string,
  userId: string,
): Promise<{ event_id: string; spots_booked: number }> {
  // Check event exists and is an event type
  const { data: occurrence } = await supabase
    .from('event_occurrences')
    .select('start_at, spots_booked')
    .eq('content_id', contentId)
    .single()

  if (!occurrence) {
    throw new AppError('not-found', 404, 'Event not found')
  }

  // Cannot cancel RSVP for past events
  if (occurrence.start_at && new Date(occurrence.start_at as string) <= new Date()) {
    throw new AppError('unprocessable', 422, 'Cannot cancel RSVP for past events', [
      { field: 'start_at', message: 'Cannot cancel RSVP for past events', code: 'event_past' },
    ])
  }

  // Find and delete the booking
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('id')
    .eq('content_id', contentId)
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .maybeSingle()

  if (fetchError || !booking) {
    throw new AppError('not-found', 404, 'No RSVP found for this event')
  }

  const { error: deleteError } = await supabase
    .from('bookings')
    .delete()
    .eq('id', booking.id as string)

  if (deleteError) {
    throw new AppError('db-error', 500, 'Failed to cancel RSVP')
  }

  // Atomic decrement — prevent going negative
  const currentSpots = occurrence.spots_booked as number
  const newSpots = Math.max(currentSpots - 1, 0)

  const { data: updatedOcc } = await supabase
    .from('event_occurrences')
    .update({ spots_booked: newSpots })
    .eq('content_id', contentId)
    .select('spots_booked')
    .single()

  return {
    event_id: contentId,
    spots_booked: (updatedOcc?.spots_booked as number) ?? newSpots,
  }
}

// ─── unpublishEvent (called when creator unpublishes) ─────────────

export async function cancelAllRsvpsOnUnpublish(contentId: string): Promise<void> {
  // Soft-cancel all confirmed bookings
  await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('content_id', contentId)
    .eq('status', 'confirmed')

  // Reset spots_booked to 0
  await supabase
    .from('event_occurrences')
    .update({ spots_booked: 0 })
    .eq('content_id', contentId)

  // Push notification to RSVP'd users is handled separately by notification service (E1.9)
}

// ─── listEvents ──────────────────────────────────────────────────

export async function listEvents(
  filters: EventListQueryInput,
): Promise<EventListResult> {
  const limit = filters.limit ?? 20
  const decodedCursor = filters.cursor ? decodeCursor(filters.cursor) : null

  let query = supabase
    .from('event_occurrences')
    .select(`
      content_id,
      start_at,
      end_at,
      venue_name,
      city_id,
      capacity,
      spots_booked,
      is_free,
      content!inner(
        id,
        title,
        user_id,
        status,
        type,
        vertical,
        deleted_at
      )
    `)
    .eq('content.type', 'event')
    .eq('content.status', 'published')
    .is('content.deleted_at', null)

  // Upcoming only by default
  if (!filters.include_past) {
    query = query.gte('start_at', new Date().toISOString())
  }

  if (filters.city_id) {
    query = query.eq('city_id', filters.city_id)
  }

  if (filters.from_date) {
    query = query.gte('start_at', filters.from_date)
  }

  if (filters.vertical) {
    query = query.eq('content.vertical', filters.vertical)
  }

  if (filters.user_id) {
    query = query.eq('content.user_id', filters.user_id)
  }

  // Cursor pagination
  if (decodedCursor) {
    query = query.or(
      `start_at.gt.${decodedCursor.startAt},and(start_at.eq.${decodedCursor.startAt},content_id.gt.${decodedCursor.id})`
    )
  }

  const { data: occurrences, error } = await query
    .order('start_at', { ascending: true })
    .order('content_id', { ascending: true })
    .limit(limit + 1) // fetch one extra to detect next page

  if (error) {
    throw new AppError('db-error', 500, 'Failed to list events')
  }

  const rows = occurrences ?? []
  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows

  // Fetch creator summaries + cover images for all items
  const contentIds = items.map((r) => r.content_id as string)
  const userIds = [
    ...new Set(items.map((r) => (r.content as unknown as Record<string, unknown>).user_id as string)),
  ]

  const [creators, coverImages] = await Promise.all([
    fetchCreatorSummaries(userIds),
    fetchCoverImages(contentIds),
  ])

  const enrichedItems = items.map((r) => {
    const c = r.content as unknown as Record<string, unknown>
    return {
      id: r.content_id as string,
      title: c.title as string,
      start_at: r.start_at as string,
      end_at: r.end_at as string,
      venue_name: r.venue_name as string,
      city_id: r.city_id as string,
      capacity: r.capacity as number,
      spots_booked: r.spots_booked as number,
      is_free: r.is_free as boolean,
      cover_image_url: coverImages.get(r.content_id as string) ?? null,
      creator: creators.get(c.user_id as string) ?? null,
    }
  })

  let nextCursor: string | null = null
  if (hasMore) {
    const last = items[items.length - 1]!
    nextCursor = encodeCursor(last.start_at as string, last.content_id as string)
  }

  return { items: enrichedItems, next_cursor: nextCursor }
}

// ─── Helpers ─────────────────────────────────────────────────────

async function fetchCreatorSummaries(userIds: string[]): Promise<Map<string, CreatorSummary>> {
  if (userIds.length === 0) return new Map()

  const { data } = await supabase
    .from('users')
    .select('id, display_name, username, avatar_url')
    .in('id', userIds)

  const map = new Map<string, CreatorSummary>()
  for (const u of data ?? []) {
    map.set(u.id as string, {
      id: u.id as string,
      display_name: (u.display_name as string) ?? null,
      username: (u.username as string) ?? null,
      avatar_url: (u.avatar_url as string) ?? null,
    })
  }
  return map
}

async function fetchCoverImages(contentIds: string[]): Promise<Map<string, string>> {
  if (contentIds.length === 0) return new Map()

  const { data } = await supabase
    .from('content_media')
    .select('content_id, url')
    .in('content_id', contentIds)
    .eq('media_type', 'image')
    .order('display_order', { ascending: true })

  const map = new Map<string, string>()
  for (const m of data ?? []) {
    // Only keep the first image per content (lowest display_order)
    if (!map.has(m.content_id as string)) {
      map.set(m.content_id as string, m.url as string)
    }
  }
  return map
}
