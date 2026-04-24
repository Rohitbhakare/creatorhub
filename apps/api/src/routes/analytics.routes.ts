import { Hono } from 'hono'
import type { Context } from 'hono'
import { z } from 'zod'
import { optionalAuthenticate } from '../middleware/authenticate.js'
import { validateBody } from '../middleware/validate.js'
import { track } from '../services/analytics.service.js'

const analyticsRoutes = new Hono()

// ── Schema ────────────────────────────────────────────────────────────────────

const trackEventSchema = z.object({
  event_name: z.string().min(1).max(100),
  properties: z.record(z.unknown()).default({}),
  session_id: z.string().max(64).optional(),
  platform: z.enum(['mobile', 'web']).default('mobile'),
})

// ── Handler ───────────────────────────────────────────────────────────────────

// POST /api/v1/analytics/track — optionalAuthenticate so guests can track too.
async function handleTrack(c: Context): Promise<Response> {
  const userId = (c.get('userId') as string | undefined) ?? null
  const { event_name, properties, session_id, platform } =
    c.get('validatedBody') as z.infer<typeof trackEventSchema>

  track({ userId, sessionId: session_id ?? null, eventName: event_name, properties, platform })
  return c.json({ success: true })
}

// ── Route ─────────────────────────────────────────────────────────────────────

analyticsRoutes.post(
  '/track',
  optionalAuthenticate,
  validateBody(trackEventSchema),
  handleTrack,
)

export default analyticsRoutes
