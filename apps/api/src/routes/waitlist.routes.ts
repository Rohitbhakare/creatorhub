import { Hono } from 'hono'
import { authenticate } from '../middleware/authenticate.js'
import {
  handleJoinWaitlist,
  handleLeaveWaitlist,
  handleListMyWaitlist,
} from '../handlers/waitlist.js'

const waitlistRoutes = new Hono()

waitlistRoutes.post('/', authenticate, handleJoinWaitlist)
waitlistRoutes.delete('/:id', authenticate, handleLeaveWaitlist)
waitlistRoutes.get('/me', authenticate, handleListMyWaitlist)

export default waitlistRoutes
