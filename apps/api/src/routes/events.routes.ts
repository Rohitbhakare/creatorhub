import { Hono } from 'hono'
import {
  handleCreateEventDraft,
  handleListEvents,
  handleGetEventDetail,
  handleUpdateEvent,
  handlePublishEvent,
  handleRsvpEvent,
  handleCancelRsvp,
} from '../handlers/events.js'
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js'
import { rsvpRateLimit } from '../middleware/rateLimit.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import {
  createContentSchema,
  updateEventSchema,
  publishContentSchema,
  eventListQuerySchema,
} from '@creatorhub/shared'

const eventsRoutes = new Hono()

// ── Create event draft ───────────────────────────────────────
eventsRoutes.post(
  '/',
  authenticate,
  validateBody(createContentSchema),
  handleCreateEventDraft,
)

// ── List upcoming events (public, optional auth) ─────────────
eventsRoutes.get(
  '/',
  optionalAuthenticate,
  validateQuery(eventListQuerySchema),
  handleListEvents,
)

// ── Get event detail ─────────────────────────────────────────
eventsRoutes.get('/:id', optionalAuthenticate, handleGetEventDetail)

// ── Update event draft ───────────────────────────────────────
eventsRoutes.put(
  '/:id',
  authenticate,
  validateBody(updateEventSchema),
  handleUpdateEvent,
)

// ── Publish event ────────────────────────────────────────────
eventsRoutes.post(
  '/:id/publish',
  authenticate,
  validateBody(publishContentSchema),
  handlePublishEvent,
)

// ── RSVP to event ────────────────────────────────────────────
eventsRoutes.post('/:id/rsvp', authenticate, rsvpRateLimit, handleRsvpEvent)

// ── Cancel RSVP ──────────────────────────────────────────────
eventsRoutes.delete('/:id/rsvp', authenticate, rsvpRateLimit, handleCancelRsvp)

export default eventsRoutes
