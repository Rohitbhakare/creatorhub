import { Hono } from 'hono'
import { handleGetVerticals, handleSaveVerticals } from '../handlers/verticals.js'
import { authenticate } from '../middleware/authenticate.js'
import { validateBody } from '../middleware/validate.js'
import { z } from 'zod'

const verticalsRoutes = new Hono()

// Public
verticalsRoutes.get('/', handleGetVerticals)

export default verticalsRoutes
