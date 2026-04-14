import type { Context } from 'hono'
import { AppError } from '../errors/AppError.js'
import {
  getNearYouSection,
  getVerticalSection,
  getDiscoverSection,
  updateUserCity,
} from '../services/feed.service.js'

const VALID_VERTICALS = ['travel', 'stories'] as const

// ─── GET /api/v1/feed/near-you ───────────────────────────────────
// Auth required — uses user's stored city to run the waterfall.
export async function handleNearYouSection(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const result = await getNearYouSection(userId)
  return c.json({ success: true, data: result })
}

// ─── GET /api/v1/feed/vertical/:vertical ─────────────────────────
// Optional auth. Returns content rail for the given vertical.
export async function handleVerticalSection(c: Context): Promise<Response> {
  const vertical = c.req.param('vertical')
  if (!VALID_VERTICALS.includes(vertical as (typeof VALID_VERTICALS)[number])) {
    throw new AppError('validation-failed', 400, `Invalid vertical: ${vertical}`)
  }

  const userId = (c.get('userId') as string | undefined) ?? null
  const items = await getVerticalSection(vertical, userId)
  return c.json({ success: true, data: items })
}

// ─── GET /api/v1/feed/discover ───────────────────────────────────
// Optional auth. Returns creators from verticals outside user's picks.
export async function handleDiscoverSection(c: Context): Promise<Response> {
  const userId = (c.get('userId') as string | undefined) ?? null
  const creators = await getDiscoverSection(userId)
  return c.json({ success: true, data: creators })
}

// ─── PUT /api/v1/users/me/city ───────────────────────────────────
// Auth required. Updates user's current city.
export async function handleUpdateUserCity(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const body = await c.req.json().catch(() => ({}))

  const { city_id } = body
  if (!city_id || typeof city_id !== 'string') {
    throw new AppError('validation-failed', 400, 'city_id is required')
  }

  const city = await updateUserCity(userId, city_id)
  return c.json({ success: true, data: city })
}
