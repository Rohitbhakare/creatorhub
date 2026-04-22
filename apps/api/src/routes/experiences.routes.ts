import { Hono } from 'hono'
import {
  handleCreateExperience,
  handleGetExperience,
  handleUpdateExperience,
  handlePublishExperience,
  handleSetMeetingPoint,
  handleAddDate,
  handleUpdateDate,
  handleDeleteDate,
  handleListDates,
  handleSetDayCount,
  handleAddExperienceDay,
  handleUpdateExperienceDay,
  handleRemoveExperienceDay,
  handleAddExperienceSpot,
  handleUpdateExperienceSpot,
  handleRemoveExperienceSpot,
  handleReorderExperienceSpots,
} from '../handlers/experiences.js'
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js'
import { validateBody } from '../middleware/validate.js'
import {
  createContentSchema,
  publishContentSchema,
  updateDaySchema,
  addSpotSchema,
  updateSpotSchema,
  reorderSpotsSchema,
} from '@creatorhub/shared'

const experiencesRoutes = new Hono()

// ── Create experience draft ──────────────────────────────────
experiencesRoutes.post(
  '/',
  authenticate,
  validateBody(createContentSchema),
  handleCreateExperience,
)

// ── Get experience detail ────────────────────────────────────
experiencesRoutes.get('/:id', optionalAuthenticate, handleGetExperience)

// ── Update experience draft ──────────────────────────────────
experiencesRoutes.put('/:id', authenticate, handleUpdateExperience)

// ── Publish experience ───────────────────────────────────────
experiencesRoutes.post(
  '/:id/publish',
  authenticate,
  validateBody(publishContentSchema),
  handlePublishExperience,
)

// ── Set meeting point ────────────────────────────────────────
experiencesRoutes.put('/:id/meeting-point', authenticate, handleSetMeetingPoint)

// ── Add scheduled date ───────────────────────────────────────
experiencesRoutes.post('/:id/dates', authenticate, handleAddDate)

// ── Update scheduled date ────────────────────────────────────
experiencesRoutes.put('/:id/dates/:dateId', authenticate, handleUpdateDate)

// ── Delete scheduled date ────────────────────────────────────
experiencesRoutes.delete('/:id/dates/:dateId', authenticate, handleDeleteDate)

// ── List scheduled dates ─────────────────────────────────────
experiencesRoutes.get('/:id/dates', optionalAuthenticate, handleListDates)

// ── Day plan: day count + day/spot CRUD ──────────────────────
// Reuses the shared itinerary.service day/spot CRUD (see E2.x day-plan spec).
experiencesRoutes.put('/:id/day-count', authenticate, handleSetDayCount)

experiencesRoutes.post('/:id/days', authenticate, handleAddExperienceDay)

experiencesRoutes.put(
  '/:id/days/:dayId',
  authenticate,
  validateBody(updateDaySchema),
  handleUpdateExperienceDay,
)

experiencesRoutes.delete(
  '/:id/days/:dayId',
  authenticate,
  handleRemoveExperienceDay,
)

// Reorder must come before /:spotId to avoid route collision
experiencesRoutes.put(
  '/:id/days/:dayId/spots/reorder',
  authenticate,
  validateBody(reorderSpotsSchema),
  handleReorderExperienceSpots,
)

experiencesRoutes.post(
  '/:id/days/:dayId/spots',
  authenticate,
  validateBody(addSpotSchema),
  handleAddExperienceSpot,
)

experiencesRoutes.put(
  '/:id/days/:dayId/spots/:spotId',
  authenticate,
  validateBody(updateSpotSchema),
  handleUpdateExperienceSpot,
)

experiencesRoutes.delete(
  '/:id/days/:dayId/spots/:spotId',
  authenticate,
  handleRemoveExperienceSpot,
)

export default experiencesRoutes
