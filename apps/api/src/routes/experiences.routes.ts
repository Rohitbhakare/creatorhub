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
} from '../handlers/experiences.js'
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js'
import { validateBody } from '../middleware/validate.js'
import { createContentSchema, publishContentSchema } from '@creatorhub/shared'

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

export default experiencesRoutes
