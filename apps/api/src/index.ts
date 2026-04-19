// Load and validate env vars first — fails fast if anything missing
import './env.js'

import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { env } from './env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/requestLogger.js'
import { generalRateLimit } from './middleware/rateLimit.js'
import { supabase } from './lib/supabase.js'
import { firebaseAuth } from './lib/firebase.js'
import authRoutes from './routes/auth.routes.js'
import citiesRoutes from './routes/cities.routes.js'
import verticalsRoutes from './routes/verticals.routes.js'
import onboardingRoutes from './routes/onboarding.routes.js'
import contentRoutes from './routes/content.routes.js'
import mediaRoutes from './routes/media.routes.js'
import placesRoutes from './routes/places.routes.js'
import postsRoutes from './routes/posts.routes.js'
import itinerariesRoutes from './routes/itineraries.routes.js'
import eventsRoutes from './routes/events.routes.js'
import experiencesRoutes from './routes/experiences.routes.js'
import feedRoutes from './routes/feed.routes.js'
import usersRoutes from './routes/users.routes.js'
import socialRoutes from './routes/social.routes.js'
import studioRoutes from './routes/studio.routes.js'
import notificationsRoutes from './routes/notifications.routes.js'
import kycRoutes from './routes/kyc.routes.js'
import taxRoutes from './routes/tax.routes.js'
import bookingsRoutes from './routes/bookings.routes.js'
import trustRoutes from './routes/trust.routes.js'
import reviewsRoutes, { contentReviewsRoutes } from './routes/reviews.routes.js'
import dpdpaRoutes from './routes/dpdpa.routes.js'
import refundsRoutes from './routes/refunds.routes.js'
import adminRoutes from './routes/admin.routes.js'
import webhooksRoutes from './routes/webhooks.routes.js'
import creatorsRoutes from './routes/creators.routes.js'
import internalRoutes from './routes/internal.routes.js'

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

app.use('*', requestLogger)

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

// ─── General Rate Limit ─────────────────────────────────────
app.use('/api/*', generalRateLimit)

// ─── API v1 Routes ───────────────────────────────────────────
app.route('/api/v1/auth', authRoutes)
app.route('/api/v1/cities', citiesRoutes)
app.route('/api/v1/verticals', verticalsRoutes)
app.route('/api/v1/onboarding', onboardingRoutes)
app.route('/api/v1/content', contentRoutes)
app.route('/api/v1/media', mediaRoutes)
app.route('/api/v1/places', placesRoutes)
app.route('/api/v1/posts', postsRoutes)
app.route('/api/v1/itineraries', itinerariesRoutes)
app.route('/api/v1/events', eventsRoutes)
app.route('/api/v1/experiences', experiencesRoutes)
app.route('/api/v1/feed', feedRoutes)
app.route('/api/v1/users', usersRoutes)
app.route('/api/v1', socialRoutes)
app.route('/api/v1/studio', studioRoutes)
app.route('/api/v1/notifications', notificationsRoutes)
app.route('/api/v1/kyc', kycRoutes)
app.route('/api/v1/tax', taxRoutes)
app.route('/api/v1/bookings', bookingsRoutes)
app.route('/api/v1', trustRoutes)
app.route('/api/v1/reviews', reviewsRoutes)
app.route('/api/v1/content', contentReviewsRoutes)
app.route('/api/v1/dpdpa', dpdpaRoutes)
app.route('/api/v1', refundsRoutes)
app.route('/api/v1/admin', adminRoutes)
app.route('/api/v1/webhooks', webhooksRoutes)
app.route('/api/v1/creators', creatorsRoutes)
app.route('/internal', internalRoutes)

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
