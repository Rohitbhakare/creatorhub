import { Hono } from 'hono'
import {
  handleCreateDraft,
  handleGetContent,
  handleUpdateDraft,
  handleListDrafts,
  handleListPublished,
  handleSoftDelete,
  handlePublish,
  handleUnpublish,
  handleArchive,
} from '../handlers/content.js'
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import {
  createContentSchema,
  publishContentSchema,
  contentListQuerySchema,
} from '@creatorhub/shared'

const contentRoutes = new Hono()

// ── Published listing (public, optional auth) ─────────────────
contentRoutes.get(
  '/',
  optionalAuthenticate,
  validateQuery(contentListQuerySchema),
  handleListPublished,
)

// ── Create draft ──────────────────────────────────────────────
contentRoutes.post(
  '/',
  authenticate,
  validateBody(createContentSchema),
  handleCreateDraft,
)

// ── List my drafts (must come before /:id) ────────────────────
contentRoutes.get('/me/drafts', authenticate, handleListDrafts)

// ── Get single content ────────────────────────────────────────
contentRoutes.get('/:id', optionalAuthenticate, handleGetContent)

// ── Update draft ──────────────────────────────────────────────
contentRoutes.put('/:id', authenticate, handleUpdateDraft)

// ── Soft delete ───────────────────────────────────────────────
contentRoutes.delete('/:id', authenticate, handleSoftDelete)

// ── State transitions ─────────────────────────────────────────
contentRoutes.post(
  '/:id/publish',
  authenticate,
  validateBody(publishContentSchema),
  handlePublish,
)

contentRoutes.post('/:id/unpublish', authenticate, handleUnpublish)

contentRoutes.post('/:id/archive', authenticate, handleArchive)

export default contentRoutes
