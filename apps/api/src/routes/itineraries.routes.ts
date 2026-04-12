import { Hono } from 'hono'
import {
  handleCreateItineraryDraft,
  handleGetItineraryDetail,
  handleUpdateItinerary,
  handlePublishItinerary,
  handleAddDay,
  handleUpdateDay,
  handleRemoveDay,
  handleAddSpot,
  handleUpdateSpot,
  handleRemoveSpot,
  handleReorderSpots,
} from '../handlers/itineraries.js'
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js'
import { validateBody } from '../middleware/validate.js'
import {
  createItineraryDraftSchema,
  updateItinerarySchema,
  publishContentSchema,
  updateDaySchema,
  addSpotSchema,
  updateSpotSchema,
  reorderSpotsSchema,
} from '@creatorhub/shared'

const itinerariesRoutes = new Hono()

// ── Create itinerary draft ───────────────────────────────────
itinerariesRoutes.post(
  '/',
  authenticate,
  validateBody(createItineraryDraftSchema),
  handleCreateItineraryDraft,
)

// ── Get itinerary detail (public, optional auth) ─────────────
itinerariesRoutes.get(
  '/:id',
  optionalAuthenticate,
  handleGetItineraryDetail,
)

// ── Update itinerary fields ──────────────────────────────────
itinerariesRoutes.put(
  '/:id',
  authenticate,
  validateBody(updateItinerarySchema),
  handleUpdateItinerary,
)

// ── Publish itinerary ────────────────────────────────────────
itinerariesRoutes.post(
  '/:id/publish',
  authenticate,
  validateBody(publishContentSchema),
  handlePublishItinerary,
)

// ── Day operations ───────────────────────────────────────────
itinerariesRoutes.post(
  '/:id/days',
  authenticate,
  handleAddDay,
)

itinerariesRoutes.put(
  '/:id/days/:dayId',
  authenticate,
  validateBody(updateDaySchema),
  handleUpdateDay,
)

itinerariesRoutes.delete(
  '/:id/days/:dayId',
  authenticate,
  handleRemoveDay,
)

// ── Spot operations ──────────────────────────────────────────
// Reorder must come before /:spotId to avoid "reorder" matching as a spotId
itinerariesRoutes.put(
  '/:id/days/:dayId/spots/reorder',
  authenticate,
  validateBody(reorderSpotsSchema),
  handleReorderSpots,
)

itinerariesRoutes.post(
  '/:id/days/:dayId/spots',
  authenticate,
  validateBody(addSpotSchema),
  handleAddSpot,
)

itinerariesRoutes.put(
  '/:id/days/:dayId/spots/:spotId',
  authenticate,
  validateBody(updateSpotSchema),
  handleUpdateSpot,
)

itinerariesRoutes.delete(
  '/:id/days/:dayId/spots/:spotId',
  authenticate,
  handleRemoveSpot,
)

export default itinerariesRoutes
