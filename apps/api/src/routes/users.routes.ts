import { Hono } from 'hono'
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js'
import { validateBody } from '../middleware/validate.js'
import { updateUserSchema, changeUsernameSchema } from '@creatorhub/shared'
import {
  handleGetMe,
  handleUpdateProfile,
  handleUpdateUsername,
  handleGetCompletion,
  handleGetPublicProfile,
  handleSetDnd,
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

// ── DND toggle ──────────────────────────────────────────────────
usersRoutes.put('/me/dnd', authenticate, handleSetDnd)

// ── Public profile ─────────────────────────────────────────────
usersRoutes.get('/:id', optionalAuthenticate, handleGetPublicProfile)

export default usersRoutes
