import { Hono } from 'hono'
import {
  handleCreatePostDraft,
  handleGetPostDetail,
  handleUpdatePost,
  handlePublishPost,
  handleListPosts,
} from '../handlers/posts.js'
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import {
  createContentSchema,
  updatePostSchema,
  publishContentSchema,
  contentListQuerySchema,
} from '@creatorhub/shared'

const postsRoutes = new Hono()

// ── Create post draft ────────────────────────────────────────
postsRoutes.post(
  '/',
  authenticate,
  validateBody(createContentSchema),
  handleCreatePostDraft,
)

// ── List published posts (public, optional auth) ─────────────
postsRoutes.get(
  '/',
  optionalAuthenticate,
  validateQuery(contentListQuerySchema),
  handleListPosts,
)

// ── Get single post detail ───────────────────────────────────
postsRoutes.get('/:id', optionalAuthenticate, handleGetPostDetail)

// ── Update post draft ────────────────────────────────────────
postsRoutes.put(
  '/:id',
  authenticate,
  validateBody(updatePostSchema),
  handleUpdatePost,
)

// ── Publish post ─────────────────────────────────────────────
postsRoutes.post(
  '/:id/publish',
  authenticate,
  validateBody(publishContentSchema),
  handlePublishPost,
)

export default postsRoutes
