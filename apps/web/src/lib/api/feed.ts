import { apiFetch, apiFetchPublic } from '../api-client'
import type { ContentCard, FeedSection } from './types'
import { listOf, transformContentCard } from './transforms'

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
    return listOf(data, transformContentCard)
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

  const [hotNearYou, handpicked, weekend, fromCity, posts, events] = await Promise.all([
    fetchSection('hot-near-you', { city }),
    fetchSection('editors-picks'),
    fetchSection('this-weekend', { city }),
    fetchSection('trips-from-city', { city }),
    fetchSection('posts'),
    fetchSection('upcoming-events', { city }),
  ])

  const sections: FeedSection[] = []

  if (hotNearYou.length) {
    sections.push({
      id: 'hot-near-you',
      title: city ? `Hot near ${city}` : 'Hot near you',
      subtitle: 'Trending right now',
      items: hotNearYou,
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
  if (weekend.length) {
    sections.push({
      id: 'this-weekend',
      title: 'This weekend',
      subtitle: 'Plans within reach',
      items: weekend,
    })
  }
  if (fromCity.length && city) {
    sections.push({
      id: 'from-city',
      title: `Trips from ${city}`,
      items: fromCity,
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
    sections.push({
      id: 'events',
      title: 'Upcoming events',
      subtitle: 'RSVP now',
      items: events,
    })
  }

  void scope
  return sections
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

export async function searchDiscover(params: DiscoverParams): Promise<{
  items: ContentCard[]
  total: number
}> {
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') search.set(k, String(v))
  }
  const path = `/api/v1/discover/search${search.toString() ? `?${search.toString()}` : ''}`
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
      const obj = data as { items?: unknown; total?: number }
      const items = listOf(obj.items, transformContentCard)
      return { items, total: obj.total ?? items.length }
    }
    return { items: [], total: 0 }
  } catch {
    return { items: [], total: 0 }
  }
}
