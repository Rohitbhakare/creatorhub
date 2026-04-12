import type { Context } from 'hono'
import {
  createItineraryDraft,
  getItineraryDetail,
  updateItinerary,
  publishItinerary,
  addDay,
  updateDay,
  removeDay,
  addSpot,
  updateSpot,
  removeSpot,
  reorderSpots,
} from '../services/itinerary.service.js'
import { recordConsent } from '../services/tnc.service.js'
import { extractIp } from '../services/audit.service.js'
import type {
  CreateItineraryDraftInput,
  UpdateItineraryInput,
  PublishContentInput,
  UpdateDayInput,
  AddSpotInput,
  UpdateSpotInput,
  ReorderSpotsInput,
} from '@creatorhub/shared'

/**
 * POST /api/v1/itineraries
 * Create a new itinerary draft with empty days.
 */
export async function handleCreateItineraryDraft(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const body = c.get('validatedBody') as CreateItineraryDraftInput

  const content = await createItineraryDraft(userId, body)

  c.header('Location', `/api/v1/itineraries/${content.id as string}`)
  return c.json({ success: true, data: content }, 201)
}

/**
 * GET /api/v1/itineraries/:id
 * Get full itinerary detail with days, spots, media, and creator.
 */
export async function handleGetItineraryDetail(c: Context): Promise<Response> {
  const contentId = c.req.param('id')!
  const requesterId = c.get('userId') as string | null

  const result = await getItineraryDetail(contentId, requesterId)

  return c.json({
    success: true,
    data: {
      ...result.content,
      days: result.days,
      media: result.media,
      creator: result.creator,
    },
  })
}

/**
 * PUT /api/v1/itineraries/:id
 * Update itinerary fields (title, description, pricing, day_count, etc.).
 */
export async function handleUpdateItinerary(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const body = c.get('validatedBody') as UpdateItineraryInput

  const content = await updateItinerary(contentId, userId, body)

  return c.json({ success: true, data: content })
}

/**
 * POST /api/v1/itineraries/:id/publish
 * Publish a draft itinerary after validation.
 */
export async function handlePublishItinerary(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const body = c.get('validatedBody') as PublishContentInput
  const ip = extractIp(c.req.raw.headers)
  const userAgent = c.req.header('User-Agent') ?? null

  // Record T&C consent
  void recordConsent(userId, contentId, ip, userAgent)

  const content = await publishItinerary(contentId, userId, body.tnc_accepted)

  return c.json({ success: true, data: content })
}

/**
 * POST /api/v1/itineraries/:id/days
 * Add a new day to the itinerary.
 */
export async function handleAddDay(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!

  const day = await addDay(contentId, userId)

  return c.json({ success: true, data: day }, 201)
}

/**
 * PUT /api/v1/itineraries/:id/days/:dayId
 * Update a day's title/description.
 */
export async function handleUpdateDay(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const dayId = c.req.param('dayId')!
  const body = c.get('validatedBody') as UpdateDayInput

  const day = await updateDay(dayId, contentId, userId, body)

  return c.json({ success: true, data: day })
}

/**
 * DELETE /api/v1/itineraries/:id/days/:dayId
 * Remove a day and its spots. Renumbers remaining days.
 */
export async function handleRemoveDay(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const dayId = c.req.param('dayId')!

  await removeDay(dayId, contentId, userId)

  return c.body(null, 204)
}

/**
 * POST /api/v1/itineraries/:id/days/:dayId/spots
 * Add a spot to a day.
 */
export async function handleAddSpot(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const dayId = c.req.param('dayId')!
  const body = c.get('validatedBody') as AddSpotInput

  const spot = await addSpot(dayId, contentId, userId, body)

  return c.json({ success: true, data: spot }, 201)
}

/**
 * PUT /api/v1/itineraries/:id/days/:dayId/spots/:spotId
 * Update a spot's fields.
 */
export async function handleUpdateSpot(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const dayId = c.req.param('dayId')!
  const spotId = c.req.param('spotId')!
  const body = c.get('validatedBody') as UpdateSpotInput

  const spot = await updateSpot(spotId, dayId, contentId, userId, body)

  return c.json({ success: true, data: spot })
}

/**
 * DELETE /api/v1/itineraries/:id/days/:dayId/spots/:spotId
 * Remove a spot. Renumbers remaining spots.
 */
export async function handleRemoveSpot(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const dayId = c.req.param('dayId')!
  const spotId = c.req.param('spotId')!

  await removeSpot(spotId, dayId, contentId, userId)

  return c.body(null, 204)
}

/**
 * PUT /api/v1/itineraries/:id/days/:dayId/spots/reorder
 * Reorder all spots within a day.
 */
export async function handleReorderSpots(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const dayId = c.req.param('dayId')!
  const body = c.get('validatedBody') as ReorderSpotsInput

  await reorderSpots(dayId, contentId, userId, body.spot_ids)

  return c.json({ success: true, data: { reordered: true } })
}
