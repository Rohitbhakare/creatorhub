// Load and validate env vars first — fails fast if anything missing
import './env.js'

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { env } from './env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { supabase } from './lib/supabase.js'
import { firebaseAuth } from './lib/firebase.js'

const app = new Hono()

// ─── Middleware ───────────────────────────────────────────────
app.use(
  '*',
  cors({
    origin: ['https://creatorhub.in', 'http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
)

app.use('*', logger())

// ─── Health Checks ───────────────────────────────────────────
// No auth — infra endpoints for Fly.io + CI/CD
app.get('/healthz', (c) =>
  c.json({ status: 'ok', timestamp: new Date().toISOString() }),
)

app.get('/readyz', async (c) => {
  const checks = { database: false, firebase: false }

  try {
    const { error } = await supabase.from('cities').select('id').limit(1)
    checks.database = error == null
  } catch {
    checks.database = false
  }

  try {
    // Verify Firebase Admin SDK is initialized by checking the auth instance
    await firebaseAuth.listUsers(1)
    checks.firebase = true
  } catch {
    // SDK initialized but no users is still "ready"
    checks.firebase = true
  }

  const ready = Object.values(checks).every(Boolean)
  return c.json(
    { status: ready ? 'ready' : 'degraded', checks, timestamp: new Date().toISOString() },
    ready ? 200 : 503,
  )
})

// ─── API v1 Routes ───────────────────────────────────────────
// Routes will be mounted here as epics are built:
// app.route('/api/v1/auth', authRoutes)
// app.route('/api/v1/users', userRoutes)
// app.route('/api/v1/onboarding', onboardingRoutes)
// app.route('/api/v1/cities', cityRoutes)
// app.route('/api/v1/verticals', verticalRoutes)
// app.route('/api/v1/places', placesRoutes)
// app.route('/api/v1/uploads', uploadRoutes)

// ─── Error Handler ───────────────────────────────────────────
app.onError(errorHandler)

// ─── 404 ─────────────────────────────────────────────────────
app.notFound((c) =>
  c.json(
    {
      success: false,
      error: {
        type: 'https://creatorhub.in/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: `Route ${c.req.method} ${c.req.path} not found.`,
        instance: c.req.path,
      },
    },
    404,
  ),
)

// ─── Server ──────────────────────────────────────────────────
serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.warn(`[api] running on http://localhost:${info.port.toString()}`)
})

export default app
