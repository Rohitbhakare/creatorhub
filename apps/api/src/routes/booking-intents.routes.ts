import { Hono } from 'hono'
import {
  handleCreateBookingIntent,
  handleReleaseBookingIntent,
} from '../handlers/booking-intents.js'
import { authenticate } from '../middleware/authenticate.js'
import { validateBody } from '../middleware/validate.js'
import { createBookingIntentSchema } from '@creatorhub/shared'

const bookingIntentsRoutes = new Hono()

bookingIntentsRoutes.post(
  '/',
  authenticate,
  validateBody(createBookingIntentSchema),
  handleCreateBookingIntent,
)

bookingIntentsRoutes.delete('/:id', authenticate, handleReleaseBookingIntent)

export default bookingIntentsRoutes
