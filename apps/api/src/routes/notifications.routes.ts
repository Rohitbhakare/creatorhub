import { Hono } from 'hono'
import { authenticate } from '../middleware/authenticate.js'
import {
  handleGetPreferences,
  handleUpdatePreferences,
  handleRegisterDevice,
  handleUnregisterDevice,
} from '../handlers/notifications.js'

const notificationsRoutes = new Hono()

// ─── Preferences ──────────────────────────────────────────────
notificationsRoutes.get('/preferences', authenticate, handleGetPreferences)
notificationsRoutes.put('/preferences', authenticate, handleUpdatePreferences)

// ─── Devices ──────────────────────────────────────────────────
notificationsRoutes.post('/devices', authenticate, handleRegisterDevice)
notificationsRoutes.delete('/devices/:tokenId', authenticate, handleUnregisterDevice)

export default notificationsRoutes
