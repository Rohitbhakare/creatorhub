import { Hono } from 'hono'
import { authenticate } from '../middleware/authenticate.js'
import {
  handleListMyPayouts,
  handleGetMyLinkedAccount,
} from '../handlers/creators.payouts.js'

const creatorsRoutes = new Hono()

// ── Earnings / payouts (E2.12) ───────────────────────────────
creatorsRoutes.get('/me/payouts', authenticate, handleListMyPayouts)
creatorsRoutes.get('/me/linked-account', authenticate, handleGetMyLinkedAccount)

export default creatorsRoutes
