import type { Context } from 'hono'
import { AppError } from '../errors/AppError.js'
import {
  getNearYouSection,
  getVerticalSection,
  getDiscoverSection,
  getForYouSection,
  getFollowingSection,
  getHeroForTab,
  updateUserCity,
  getEditorsPicks,
  getHotNearYou,
  getTripsFromCity,
  getThisWeekend,
  getUpcomingEvents,
  getDayTrips,
  getWeekendGetaways,
  getPostsFeed,
  type HeroTab,
} from '../services/feed.service.js'
import { postsFeedQuerySchema } from '@creatorhub/shared'

const VALID_VERTICALS = ['travel', 'stories'] as const
const VALID_HERO_TABS: readonly HeroTab[] = ['for_you', 'following', 'near_you']

// ─── GET /api/v1/feed/near-you ───────────────────────────────────
// Optional auth — signed-in users use stored city; guests can pass ?city_id=.
export async function handleNearYouSection(c: Context): Promise<Response> {
  const userId = (c.get('userId') as string | undefined) ?? null
  const guestCityId = c.req.query('city_id')
  const subCategoryId = c.req.query('sub_category_id')
  const result = await getNearYouSection(userId, guestCityId, subCategoryId)
  return c.json({ success: true, data: result })
}

// ─── Travel-only home feed sections (FEED-redesign 2026-04) ──────
// All accept ?city_id=&lat=&lng= so guests + signed-in users hit the
// same code path. Optional auth.

function readNearLocation(c: Context): {
  userId: string | null
  cityId: string | null
  lat: number | null
  lng: number | null
} {
  const userId = (c.get('userId') as string | undefined) ?? null
  const cityId = c.req.query('city_id') ?? null
  const latStr = c.req.query('lat')
  const lngStr = c.req.query('lng')
  const lat = latStr ? Number(latStr) : null
  const lng = lngStr ? Number(lngStr) : null
  return { userId, cityId, lat: Number.isFinite(lat) ? lat : null, lng: Number.isFinite(lng) ? lng : null }
}

export async function handleHotNearYou(c: Context): Promise<Response> {
  const items = await getHotNearYou(readNearLocation(c))
  return c.json({ success: true, data: items })
}

export async function handleTripsFromCity(c: Context): Promise<Response> {
  const items = await getTripsFromCity(readNearLocation(c))
  return c.json({ success: true, data: items })
}

export async function handleThisWeekend(c: Context): Promise<Response> {
  const items = await getThisWeekend(readNearLocation(c))
  return c.json({ success: true, data: items })
}

export async function handleUpcomingEvents(c: Context): Promise<Response> {
  const items = await getUpcomingEvents(readNearLocation(c))
  return c.json({ success: true, data: items })
}

export async function handleDayTrips(c: Context): Promise<Response> {
  const items = await getDayTrips(readNearLocation(c))
  return c.json({ success: true, data: items })
}

export async function handleWeekendGetaways(c: Context): Promise<Response> {
  const items = await getWeekendGetaways(readNearLocation(c))
  return c.json({ success: true, data: items })
}

// ─── GET /api/v1/feed/posts ──────────────────────────────────────
// Posts-only feed for the home Stories rail and the /feed/posts vertical
// scroll. Cursor pagination.
export async function handlePostsFeed(c: Context): Promise<Response> {
  const userId = (c.get('userId') as string | undefined) ?? null
  const parsed = postsFeedQuerySchema.safeParse(Object.fromEntries(new URL(c.req.url).searchParams))
  if (!parsed.success) {
    throw new AppError(
      'validation-failed',
      400,
      'Invalid posts feed query',
      parsed.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
        code: i.code,
      })),
    )
  }
  const { scope, city_id, sub_category_id, cursor, limit } = parsed.data
  const result = await getPostsFeed({
    scope,
    userId,
    cityId: city_id ?? null,
    subCategoryId: sub_category_id ?? null,
    cursor: cursor ?? null,
    limit: limit ?? null,
  })
  return c.json({ success: true, data: result })
}

// ─── GET /api/v1/feed/for-you ────────────────────────────────────
// Optional auth. Guests get popular-across-India (IAM-FR-010).
export async function handleForYouSection(c: Context): Promise<Response> {
  const userId = (c.get('userId') as string | undefined) ?? null
  const items = await getForYouSection(userId)
  return c.json({ success: true, data: items })
}

// ─── GET /api/v1/feed/following ──────────────────────────────────
// Optional auth. Guests follow nobody → empty list.
export async function handleFollowingSection(c: Context): Promise<Response> {
  const userId = (c.get('userId') as string | undefined) ?? null
  const items = await getFollowingSection(userId)
  return c.json({ success: true, data: items })
}

// ─── GET /api/v1/feed/hero?tab=for_you|following|near_you ────────
// Optional auth. Single hero item for the active tab. Guests use ?city_id= for near_you.
export async function handleHeroSection(c: Context): Promise<Response> {
  const userId = (c.get('userId') as string | undefined) ?? null
  const tab = c.req.query('tab') ?? 'for_you'
  const guestCityId = c.req.query('city_id')
  if (!VALID_HERO_TABS.includes(tab as HeroTab)) {
    throw new AppError('validation-failed', 400, `Invalid tab: ${tab}`)
  }
  const item = await getHeroForTab(userId, tab as HeroTab, guestCityId)
  return c.json({ success: true, data: item })
}

// ─── GET /api/v1/feed/vertical/:vertical ─────────────────────────
// Optional auth. Returns content rail for the given vertical.
export async function handleVerticalSection(c: Context): Promise<Response> {
  const vertical = c.req.param('vertical')!
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

// ─── GET /api/v1/feed/editors-picks ─────────────────────────────
// DISC-FR-039: featured content. Section hidden on mobile when list is empty.
export async function handleEditorsPicks(c: Context): Promise<Response> {
  const items = await getEditorsPicks()
  return c.json({ success: true, data: items })
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
