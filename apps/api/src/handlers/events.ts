import type { Context } from 'hono'
import {
  createEventDraft,
  getEventDetail,
  updateEvent,
  publishEvent,
  rsvpEvent,
  cancelRsvp,
  listEvents,
} from '../services/event.service.js'
import { recordConsent } from '../services/tnc.service.js'
import { extractIp } from '../services/audit.service.js'
import type {
  CreateContentInput,
  UpdateEventInput,
  PublishContentInput,
  EventListQueryInput,
} from '@creatorhub/shared'

/**
 * POST /api/v1/events
 * Create a new event draft.
 */
export async function handleCreateEventDraft(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const body = c.get('validatedBody') as CreateContentInput

  const content = await createEventDraft(userId, { vertical: body.vertical })

  c.header('Location', `/api/v1/events/${content.id as string}`)
  return c.json({ success: true, data: content }, 201)
}

/**
 * GET /api/v1/events
 * List upcoming published events with optional filters and cursor pagination.
 */
export async function handleListEvents(c: Context): Promise<Response> {
  const query = c.get('validatedQuery') as EventListQueryInput

  const { items, next_cursor } = await listEvents(query)

  return c.json({
    success: true,
    data: items,
    meta: {
      next_cursor,
      has_more: next_cursor != null,
      per_page: query.limit ?? 20,
    },
  })
}

/**
 * GET /api/v1/events/:id
 * Get event detail. Published events visible to all; drafts only to owner.
 */
export async function handleGetEventDetail(c: Context): Promise<Response> {
  const contentId = c.req.param('id')!
  const requesterId = (c.get('userId') as string | null) ?? undefined

  const result = await getEventDetail(contentId, requesterId)

  // Extract venue lat/lng from PostGIS point
  const occ = result.occurrence as Record<string, unknown>
  const venuePoint = occ.venue_point as string | null
  let venueLat: number | null = null
  let venueLng: number | null = null
  if (venuePoint) {
    // Format: POINT(lng lat) or GeoJSON depending on driver
    const match = venuePoint.match(/POINT\(([^ ]+) ([^ )]+)\)/)
    if (match) {
      venueLng = parseFloat(match[1]!)
      venueLat = parseFloat(match[2]!)
    }
  }

  return c.json({
    success: true,
    data: {
      ...result.content,
      start_at: occ.start_at,
      end_at: occ.end_at,
      timezone: occ.timezone,
      venue_name: occ.venue_name,
      venue_address: occ.venue_address,
      venue_lat: venueLat,
      venue_lng: venueLng,
      city_id: occ.city_id,
      capacity: occ.capacity,
      spots_booked: occ.spots_booked,
      is_free: occ.is_free,
      what_to_bring: occ.what_to_bring ?? [],
      has_rsvpd: result.has_rsvpd,
      media: result.media,
      creator: result.creator,
      attendees: result.attendees,
      attendee_count: result.attendee_count,
    },
  })
}

/**
 * PUT /api/v1/events/:id
 * Update an event draft (event-specific fields + content fields).
 */
export async function handleUpdateEvent(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const body = c.get('validatedBody') as UpdateEventInput

  const result = await updateEvent(contentId, userId, body)

  return c.json({ success: true, data: result })
}

/**
 * POST /api/v1/events/:id/publish
 * Publish an event draft. Validates all required fields.
 */
export async function handlePublishEvent(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const body = c.get('validatedBody') as PublishContentInput
  const ip = extractIp(c.req.raw.headers)
  const userAgent = c.req.header('User-Agent') ?? null

  // Record T&C consent
  void recordConsent(userId, contentId, ip, userAgent)

  const content = await publishEvent(contentId, userId, body.tnc_accepted)

  return c.json({ success: true, data: content })
}

/**
 * POST /api/v1/events/:id/rsvp
 * RSVP to a published free event. Atomic capacity check.
 */
export async function handleRsvpEvent(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!

  const result = await rsvpEvent(contentId, userId)

  c.header('Location', `/api/v1/bookings/${result.booking_id}`)
  return c.json({ success: true, data: result }, 201)
}

/**
 * DELETE /api/v1/events/:id/rsvp
 * Cancel an existing RSVP. Decrements spots_booked atomically.
 */
export async function handleCancelRsvp(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!

  const result = await cancelRsvp(contentId, userId)

  return c.json({ success: true, data: result })
}
