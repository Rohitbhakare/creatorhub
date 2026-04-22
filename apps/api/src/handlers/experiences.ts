import type { Context } from 'hono'
import {
  createExperienceDraft,
  getExperienceDetail,
  updateExperience,
  setMeetingPoint,
  publishExperience,
} from '../services/experience.service.js'
import {
  addScheduledDate,
  updateScheduledDate,
  deleteScheduledDate,
  listScheduledDates,
} from '../services/scheduled-dates.service.js'
import { recordConsent } from '../services/tnc.service.js'
import { extractIp } from '../services/audit.service.js'
import {
  addDay,
  updateDay,
  removeDay,
  addSpot,
  updateSpot,
  removeSpot,
  reorderSpots,
  setDayCount,
} from '../services/itinerary.service.js'
import type {
  CreateContentInput,
  PublishContentInput,
  UpdateDayInput,
  AddSpotInput,
  UpdateSpotInput,
  ReorderSpotsInput,
} from '@creatorhub/shared'

const EXPERIENCE_ALLOWED = ['scheduled_experience'] as const

// ─── POST /api/v1/experiences ─────────────────────────────────────

/**
 * Create a new scheduled experience draft.
 * Body: { type: 'scheduled_experience', vertical: string }
 */
export async function handleCreateExperience(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const body = c.get('validatedBody') as CreateContentInput

  const result = await createExperienceDraft(userId, body.vertical)

  c.header('Location', `/api/v1/experiences/${result.id}`)
  return c.json({ success: true, data: result }, 201)
}

// ─── GET /api/v1/experiences/:id ──────────────────────────────────

/**
 * Get experience detail. Published experiences visible to all.
 * Drafts only visible to owner.
 */
export async function handleGetExperience(c: Context): Promise<Response> {
  const contentId = c.req.param('id')!
  const requesterId = (c.get('userId') as string | null) || undefined

  const result = await getExperienceDetail(contentId, requesterId)

  return c.json({ success: true, data: result })
}

// ─── PUT /api/v1/experiences/:id ──────────────────────────────────

/**
 * Update an experience draft (content-level fields).
 */
export async function handleUpdateExperience(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const body = await c.req.json() as Record<string, unknown>

  const updateData: import('../services/experience.service.js').UpdateExperienceData = {}
  if (body.title !== undefined) updateData.title = String(body.title)
  if (body.description !== undefined) updateData.description = String(body.description)
  if (body.price_paisa !== undefined) updateData.pricePaisa = Number(body.price_paisa)
  if (body.cover_image_url !== undefined) updateData.coverImageUrl = String(body.cover_image_url)
  if (body.location_name !== undefined) updateData.locationName = String(body.location_name)
  if (body.tags !== undefined) updateData.tags = body.tags as string[]
  if (body.sub_category_id !== undefined) updateData.subCategoryId = String(body.sub_category_id)
  if (body.visibility !== undefined) updateData.visibility = String(body.visibility)
  if (body.vertical_data !== undefined) updateData.verticalData = body.vertical_data as Record<string, unknown>
  await updateExperience(contentId, userId, updateData)

  return c.json({ success: true, data: { id: contentId } })
}

// ─── POST /api/v1/experiences/:id/publish ────────────────────────

/**
 * Publish a scheduled experience draft.
 * Validates: KYC (if paid), cover image, at least 1 future date.
 */
export async function handlePublishExperience(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const body = c.get('validatedBody') as PublishContentInput
  const ip = extractIp(c.req.raw.headers)
  const userAgent = c.req.header('User-Agent') || null

  // Record T&C consent (fire-and-forget)
  void recordConsent(userId, contentId, ip, userAgent)

  await publishExperience(contentId, userId, body.tnc_accepted)

  return c.json({ success: true, data: { id: contentId, status: 'published' } })
}

// ─── PUT /api/v1/experiences/:id/meeting-point ───────────────────

/**
 * Set or update the meeting point for an experience.
 */
export async function handleSetMeetingPoint(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const body = await c.req.json() as Record<string, unknown>

  const mpData: import('../services/experience.service.js').MeetingPointData = {
    publicAreaName: body.public_area_name as string,
    lat: body.lat as number,
    lng: body.lng as number,
  }
  if (body.private_exact_name !== undefined) mpData.privateExactName = String(body.private_exact_name)
  if (body.private_lat !== undefined) mpData.privateLat = Number(body.private_lat)
  if (body.private_lng !== undefined) mpData.privateLng = Number(body.private_lng)
  if (body.reveal_hours_before !== undefined) mpData.revealHoursBefore = Number(body.reveal_hours_before)
  await setMeetingPoint(contentId, userId, mpData)

  return c.json({ success: true, data: { id: contentId } })
}

// ─── POST /api/v1/experiences/:id/dates ──────────────────────────

/**
 * Add a scheduled date to an experience.
 * Body: { start_date: string, end_date: string, capacity: number }
 */
export async function handleAddDate(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const body = await c.req.json() as Record<string, unknown>

  const result = await addScheduledDate(contentId, userId, {
    startDate: body.start_date as string,
    endDate: body.end_date as string,
    capacity: Number(body.capacity),
  })

  c.header('Location', `/api/v1/experiences/${contentId}/dates/${result.id}`)
  return c.json({ success: true, data: result }, 201)
}

// ─── PUT /api/v1/experiences/:id/dates/:dateId ───────────────────

/**
 * Update a scheduled date (capacity or active status).
 */
export async function handleUpdateDate(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const dateId = c.req.param('dateId')!
  const body = await c.req.json() as Record<string, unknown>

  const dateUpdate: { capacity?: number; isActive?: boolean } = {}
  if (body.capacity !== undefined) dateUpdate.capacity = Number(body.capacity)
  if (body.is_active !== undefined) dateUpdate.isActive = Boolean(body.is_active)
  await updateScheduledDate(dateId, userId, dateUpdate)

  return c.json({ success: true, data: { id: dateId } })
}

// ─── DELETE /api/v1/experiences/:id/dates/:dateId ────────────────

/**
 * Delete or soft-deactivate a scheduled date.
 * Soft-deletes (is_active=false) if bookings exist.
 * Hard-deletes if no bookings.
 */
export async function handleDeleteDate(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const dateId = c.req.param('dateId')!

  await deleteScheduledDate(dateId, userId)

  return c.json({ success: true, data: null })
}

// ─── GET /api/v1/experiences/:id/dates ───────────────────────────

/**
 * List all active scheduled dates for an experience.
 */
export async function handleListDates(c: Context): Promise<Response> {
  const contentId = c.req.param('id')!

  const dates = await listScheduledDates(contentId)

  return c.json({ success: true, data: dates })
}

// ─── PUT /api/v1/experiences/:id/day-count ───────────────────────

/**
 * Set the total number of day slots for the experience's day plan.
 * Adds empty days when growing, removes trailing days (and cascaded spots)
 * when shrinking.
 */
export async function handleSetDayCount(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const body = await c.req.json() as Record<string, unknown>

  const dayCount = Number(body.day_count)
  if (!Number.isInteger(dayCount) || dayCount < 1 || dayCount > 30) {
    return c.json(
      { success: false, error: { type: 'validation-failed', detail: 'day_count must be an integer between 1 and 30' } },
      400,
    )
  }

  await setDayCount(contentId, userId, dayCount, { allowedTypes: EXPERIENCE_ALLOWED })

  return c.json({ success: true, data: { id: contentId, day_count: dayCount } })
}

// ─── POST /api/v1/experiences/:id/days ───────────────────────────

export async function handleAddExperienceDay(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!

  const day = await addDay(contentId, userId, { allowedTypes: EXPERIENCE_ALLOWED })

  return c.json({ success: true, data: day }, 201)
}

// ─── PUT /api/v1/experiences/:id/days/:dayId ─────────────────────

export async function handleUpdateExperienceDay(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const dayId = c.req.param('dayId')!
  const body = c.get('validatedBody') as UpdateDayInput

  const day = await updateDay(dayId, contentId, userId, body, {
    allowedTypes: EXPERIENCE_ALLOWED,
  })

  return c.json({ success: true, data: day })
}

// ─── DELETE /api/v1/experiences/:id/days/:dayId ──────────────────

export async function handleRemoveExperienceDay(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const dayId = c.req.param('dayId')!

  await removeDay(dayId, contentId, userId, { allowedTypes: EXPERIENCE_ALLOWED })

  return c.body(null, 204)
}

// ─── POST /api/v1/experiences/:id/days/:dayId/spots ──────────────

export async function handleAddExperienceSpot(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const dayId = c.req.param('dayId')!
  const body = c.get('validatedBody') as AddSpotInput

  const spot = await addSpot(dayId, contentId, userId, body, {
    allowedTypes: EXPERIENCE_ALLOWED,
  })

  return c.json({ success: true, data: spot }, 201)
}

// ─── PUT /api/v1/experiences/:id/days/:dayId/spots/:spotId ───────

export async function handleUpdateExperienceSpot(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const dayId = c.req.param('dayId')!
  const spotId = c.req.param('spotId')!
  const body = c.get('validatedBody') as UpdateSpotInput

  const spot = await updateSpot(spotId, dayId, contentId, userId, body, {
    allowedTypes: EXPERIENCE_ALLOWED,
  })

  return c.json({ success: true, data: spot })
}

// ─── DELETE /api/v1/experiences/:id/days/:dayId/spots/:spotId ────

export async function handleRemoveExperienceSpot(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const dayId = c.req.param('dayId')!
  const spotId = c.req.param('spotId')!

  await removeSpot(spotId, dayId, contentId, userId, {
    allowedTypes: EXPERIENCE_ALLOWED,
  })

  return c.body(null, 204)
}

// ─── PUT /api/v1/experiences/:id/days/:dayId/spots/reorder ───────

export async function handleReorderExperienceSpots(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const contentId = c.req.param('id')!
  const dayId = c.req.param('dayId')!
  const body = c.get('validatedBody') as ReorderSpotsInput

  await reorderSpots(dayId, contentId, userId, body.spot_ids, {
    allowedTypes: EXPERIENCE_ALLOWED,
  })

  return c.json({ success: true, data: { reordered: true } })
}
