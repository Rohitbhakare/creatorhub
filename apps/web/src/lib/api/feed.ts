import { apiFetch, apiFetchPublic } from '../api-client'
import type { ContentCard, ContentDetail, FeedSection, ItinerarySpot } from './types'
import { listOf, transformContentCard } from './transforms'
import { fetchContentDetail } from './index'

const REVALIDATE_FEED_SECONDS = 60

async function fetchSection(
  endpoint: string,
  params: Record<string, string | undefined> = {},
): Promise<ContentCard[]> {
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) search.set(k, v)
  }
  const qs = search.toString()
  const path = `/api/v1/feed/${endpoint}${qs ? `?${qs}` : ''}`
  try {
    const data = await apiFetchPublic<unknown>(path, {
      next: { revalidate: REVALIDATE_FEED_SECONDS, tags: [`feed:${endpoint}`] },
    })
    // Some feed endpoints return `data: [...]` directly; others return
    // `data: { items: [...] }`. Handle both transparently.
    if (Array.isArray(data)) return listOf(data, transformContentCard)
    if (data && typeof data === 'object' && 'items' in data) {
      const items = (data as { items?: unknown }).items
      return listOf(items, transformContentCard)
    }
    return []
  } catch {
    return []
  }
}

export async function getHomeFeedSections(opts: {
  city?: string
  vertical?: string
  scope?: 'near-you' | 'following' | 'all'
}): Promise<FeedSection[]> {
  const city = opts.city
  const scope = opts.scope ?? 'near-you'

  const [
    forYou,
    hotNearYou,
    handpicked,
    weekend,
    fromCity,
    posts,
    events,
    dayTrips,
    weekendGetaways,
  ] = await Promise.all([
    fetchSection('for-you'),
    fetchSection('hot-near-you', { city }),
    fetchSection('editors-picks'),
    fetchSection('this-weekend', { city }),
    fetchSection('trips-from-city', { city }),
    fetchSection('posts'),
    fetchSection('upcoming-events', { city }),
    fetchSection('day-trips', { city }),
    fetchSection('weekend-getaways', { city }),
  ])

  const sections: FeedSection[] = []

  // Slice for-you by type so the feed reads more editorially. Track seen
  // ids so an item can't appear in two sections if the API ever doubles up.
  const seen = new Set<string>()
  const forYouTrips: ContentCard[] = []
  const forYouStories: ContentCard[] = []
  for (const card of forYou) {
    if (seen.has(card.id)) continue
    seen.add(card.id)
    if (card.type === 'post') forYouStories.push(card)
    else forYouTrips.push(card)
  }

  if (hotNearYou.length) {
    sections.push({
      id: 'hot-near-you',
      title: city ? `Hot near ${city}` : 'Hot near you',
      subtitle: 'Trending right now',
      items: hotNearYou,
    })
  }
  if (forYouTrips.length) {
    sections.push({
      id: 'for-you-trips',
      title: 'Picked for you',
      subtitle: 'Plans and live experiences we think you’ll like',
      items: forYouTrips.slice(0, 8),
    })
  }
  if (handpicked.length) {
    sections.push({
      id: 'handpicked',
      title: 'Handpicked for you',
      subtitle: 'Curated by our editors',
      items: handpicked,
    })
  }
  if (forYouStories.length) {
    sections.push({
      id: 'stories',
      title: 'Stories worth your morning coffee',
      subtitle: 'Long reads worth saving',
      items: forYouStories.slice(0, 8),
    })
  }
  if (weekend.length) {
    sections.push({
      id: 'this-weekend',
      title: 'This weekend',
      subtitle: 'Plans within reach',
      items: weekend,
    })
  }
  if (fromCity.length && city) {
    sections.push({ id: 'from-city', title: `Trips from ${city}`, items: fromCity })
  }
  if (dayTrips.length) {
    sections.push({
      id: 'day-trips',
      title: 'Day trips',
      subtitle: 'Out and back before sundown',
      items: dayTrips,
    })
  }
  if (weekendGetaways.length) {
    sections.push({
      id: 'weekend-getaways',
      title: 'Weekend getaways',
      subtitle: 'Friday night to Sunday',
      items: weekendGetaways,
    })
  }
  if (posts.length) {
    sections.push({
      id: 'posts',
      title: 'Trending posts',
      subtitle: 'Quick reads',
      items: posts,
    })
  }
  if (events.length) {
    sections.push({ id: 'events', title: 'Upcoming events', subtitle: 'RSVP now', items: events })
  }

  void scope
  return sections
}

// Map of section ids (used in /discover?section=...) → API endpoint name.
// Mirrors what getHomeFeedSections wires up — keep them in sync. We also
// resolve the user-visible label so the discover page can render a tight
// "Showing: X" header instead of the generic search hero.
const SECTION_TO_ENDPOINT: Record<
  string,
  { endpoint: string; label: string; sliceTo?: 'post' | 'trip' }
> = {
  'hot-near-you': { endpoint: 'hot-near-you', label: 'Hot near you' },
  'for-you-trips': { endpoint: 'for-you', label: 'Picked for you', sliceTo: 'trip' },
  stories: { endpoint: 'for-you', label: 'Stories worth your morning coffee', sliceTo: 'post' },
  handpicked: { endpoint: 'editors-picks', label: 'Handpicked for you' },
  'this-weekend': { endpoint: 'this-weekend', label: 'This weekend' },
  'from-city': { endpoint: 'trips-from-city', label: 'Trips from your city' },
  'day-trips': { endpoint: 'day-trips', label: 'Day trips' },
  'weekend-getaways': { endpoint: 'weekend-getaways', label: 'Weekend getaways' },
  posts: { endpoint: 'posts', label: 'Trending posts' },
  events: { endpoint: 'upcoming-events', label: 'Upcoming events' },
}

export interface FeedSectionResult {
  id: string
  label: string
  items: ContentCard[]
}

/**
 * Fetch the contents of a single feed section by id — the same data that
 * appears under that rail on the home feed. Used by the /discover?section=…
 * "See all" landing pages.
 */
export async function fetchFeedSection(
  id: string,
  opts: { city?: string } = {},
): Promise<FeedSectionResult | null> {
  const def = SECTION_TO_ENDPOINT[id]
  if (!def) return null
  const params: Record<string, string | undefined> = {}
  if (opts.city) params.city = opts.city
  const items = await fetchSection(def.endpoint, params)
  let filtered = items
  if (def.sliceTo === 'post') filtered = items.filter((i) => i.type === 'post')
  else if (def.sliceTo === 'trip') filtered = items.filter((i) => i.type !== 'post')
  return { id, label: def.label, items: filtered }
}

export async function getFollowingFeed(): Promise<ContentCard[]> {
  try {
    const data = await apiFetch<unknown>(`/api/v1/feed/following`, {
      next: { revalidate: 30 },
    })
    return listOf(data, transformContentCard)
  } catch {
    return []
  }
}

export interface DiscoverParams {
  q?: string
  city?: string
  type?: string
  vertical?: string
  priceMin?: number
  priceMax?: number
  durationMin?: number
  durationMax?: number
  sort?: 'relevance' | 'newest' | 'price_asc' | 'price_desc' | 'rating'
  page?: number
}

/**
 * Search for content matching `q` (and optional filters). The API requires
 * the `q` query param so we early-return empty when it's missing — callers
 * (the /discover page) render a discover-by-category landing in that state
 * instead of an empty results list.
 *
 * Response shape from /api/v1/discover/search:
 *   { content: [...], cities: [...], creators: [...], places: [...] }
 * We only surface the `content` rows here.
 */
export async function searchDiscover(params: DiscoverParams): Promise<{
  items: ContentCard[]
  total: number
}> {
  const q = params.q?.trim() ?? ''
  if (q.length === 0) {
    return { items: [], total: 0 }
  }
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') search.set(k, String(v))
  }
  const path = `/api/v1/discover/search?${search.toString()}`
  try {
    const data = await apiFetchPublic<unknown>(path, {
      next: { revalidate: 30 },
    })
    if (!data) return { items: [], total: 0 }
    if (Array.isArray(data)) {
      const items = listOf(data, transformContentCard)
      return { items, total: items.length }
    }
    if (typeof data === 'object') {
      const obj = data as { content?: unknown; items?: unknown; total?: number }
      const rawItems = obj.content ?? obj.items
      const items = listOf(rawItems, transformContentCard)
      return { items, total: obj.total ?? items.length }
    }
    return { items: [], total: 0 }
  } catch {
    return { items: [], total: 0 }
  }
}

// ─── Chapter-hero story (E5.1) ──────────────────────────────────────
// v3 magazine home opens with a hero that cycles through ONE itinerary's
// days as "chapters" (Konkan in 4 quiet days, etc). The data is the first
// handpicked itinerary that has at least 3 spots. We grab the section
// list, find a matching item, then `fetchContentDetail` to pull spots.
//
// Returns null when no eligible itinerary exists — the home page falls
// back to the static <HeroFeature> in that case.

const MIN_CHAPTERS = 3

export interface ChapterStory {
  content: ContentDetail
  chapters: ItinerarySpot[]
}

export async function getFeaturedChapterStory(opts: {
  city?: string
} = {}): Promise<ChapterStory | null> {
  // Reuse the existing handpicked-feed endpoint — it's already cached at
  // 60s and is the closest signal to "editorial featured".
  const items = await fetchSection('handpicked', { city: opts.city })

  for (const item of items) {
    if (item.type !== 'itinerary') continue
    const detail = await fetchContentDetail(item.id)
    const spots = detail?.spots ?? []
    if (spots.length < MIN_CHAPTERS) continue
    // Sort by (dayNumber, orderIndex) so chapters render in narrative order.
    const ordered = [...spots].sort((a, b) => {
      if (a.dayNumber !== b.dayNumber) return a.dayNumber - b.dayNumber
      return a.orderIndex - b.orderIndex
    })
    if (!detail) continue
    return { content: detail, chapters: ordered.slice(0, 6) }
  }
  return null
}
