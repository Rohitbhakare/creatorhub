import { Hono } from 'hono'
import { authenticate } from '../middleware/authenticate.js'
import { handleUpdateUserCity } from '../handlers/feed.js'

const usersRoutes = new Hono()

// Update current city (DISC-FR-026)
usersRoutes.put('/me/city', authenticate, handleUpdateUserCity)

export default usersRoutes
