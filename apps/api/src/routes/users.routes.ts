import { Hono } from 'hono'
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js'
import { validateBody } from '../middleware/validate.js'
import {
  updateUserSchema,
  changeUsernameSchema,
  setTravelSubCategoriesSchema,
} from '@creatorhub/shared'
import {
  handleGetMe,
  handleUpdateProfile,
  handleUpdateUsername,
  handleGetCompletion,
  handleGetPublicProfile,
  handleGetPublicProfileByUsername,
  handleSetDnd,
  handleSetTravelSubCategories,
} from '../handlers/users.js'
import { handleUpdateUserCity } from '../handlers/feed.js'

const usersRoutes = new Hono()

// ── Own profile ────────────────────────────────────────────────
usersRoutes.get('/me', authenticate, handleGetMe)
usersRoutes.put('/me', authenticate, validateBody(updateUserSchema), handleUpdateProfile)
usersRoutes.put('/me/username', authenticate, validateBody(changeUsernameSchema), handleUpdateUsername)
usersRoutes.get('/me/completion', authenticate, handleGetCompletion)

// ── City update (DISC-FR-026) ──────────────────────────────────
usersRoutes.put('/me/city', authenticate, handleUpdateUserCity)

// ── Travel sub-categories (FEED-redesign 2026-04) ──────────────
usersRoutes.put(
  '/me/travel-sub-categories',
  authenticate,
  validateBody(setTravelSubCategoriesSchema),
  handleSetTravelSubCategories,
)

// ── DND toggle ──────────────────────────────────────────────────
usersRoutes.put('/me/dnd', authenticate, handleSetDnd)

// ── Public profile ─────────────────────────────────────────────
// Username route MUST be declared before /:id so Hono doesn't capture
// "by-username" as the id parameter.
usersRoutes.get('/by-username/:username', optionalAuthenticate, handleGetPublicProfileByUsername)
usersRoutes.get('/:id', optionalAuthenticate, handleGetPublicProfile)

export default usersRoutes
