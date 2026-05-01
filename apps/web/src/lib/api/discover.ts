import { apiFetchPublic } from '../api-client'
import { listOf, transformContentCard } from './transforms'
import type { ContentCard } from './types'

const REVALIDATE_DEFAULT = 60
const REVALIDATE_HOUR = 3600

export interface PopularSearch {
  query: string
}

export async function fetchPopularSearches(limit = 10): Promise<string[]> {
  const data = await apiFetchPublic<{ queries?: unknown }>(
    `/api/v1/discover/search/popular?limit=${String(limit)}`,
    { next: { revalidate: REVALIDATE_HOUR, tags: ['discover:popular'] } },
  )
  const rows = Array.isArray(data?.queries) ? (data.queries as unknown[]) : []
  return rows.filter((q): q is string => typeof q === 'string' && q.length > 0)
}

export interface SubCategoryRow {
  id: string
  slug: string
  name: string
  leafTypes: string[]
  displayOrder: number
}

export async function fetchSubCategories(
  vertical: 'travel' | 'stories' = 'travel',
): Promise<SubCategoryRow[]> {
  const data = await apiFetchPublic<unknown>(
    `/api/v1/discover/sub-categories?vertical=${vertical}`,
    { next: { revalidate: REVALIDATE_HOUR, tags: [`subcats:${vertical}`] } },
  )
  if (!Array.isArray(data)) return []
  return data
    .map((row) => {
      if (!row || typeof row !== 'object') return null
      const r = row as Record<string, unknown>
      if (typeof r.id !== 'string' || typeof r.slug !== 'string' || typeof r.name !== 'string')
        return null
      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        leafTypes: Array.isArray(r.leaf_types) ? (r.leaf_types as string[]) : [],
        displayOrder: typeof r.display_order === 'number' ? r.display_order : 0,
      }
    })
    .filter((r): r is SubCategoryRow => r !== null)
}

export interface HandpickedCollection {
  id: string
  title: string
  subtitle: string
  kind: 'popular_in_city' | 'under_budget' | 'short_reads' | 'new_voices'
  count: number
  coverUrl: string | null
}

export async function fetchHandpickedCollections(opts: {
  cityId?: string
  limit?: number
}): Promise<HandpickedCollection[]> {
  const search = new URLSearchParams()
  if (opts.cityId) search.set('city_id', opts.cityId)
  search.set('limit', String(opts.limit ?? 4))
  const data = await apiFetchPublic<{ collections?: unknown }>(
    `/api/v1/discover/collections?${search.toString()}`,
    { next: { revalidate: REVALIDATE_DEFAULT, tags: ['discover:collections'] } },
  )
  const rows = Array.isArray(data?.collections) ? (data.collections as unknown[]) : []
  return rows
    .map((row) => {
      if (!row || typeof row !== 'object') return null
      const r = row as Record<string, unknown>
      if (typeof r.id !== 'string' || typeof r.title !== 'string') return null
      return {
        id: r.id,
        title: r.title,
        subtitle: typeof r.subtitle === 'string' ? r.subtitle : '',
        kind:
          typeof r.kind === 'string' &&
          ['popular_in_city', 'under_budget', 'short_reads', 'new_voices'].includes(r.kind)
            ? (r.kind as HandpickedCollection['kind'])
            : 'popular_in_city',
        count: typeof r.count === 'number' ? r.count : 0,
        coverUrl: typeof r.cover_url === 'string' ? r.cover_url : null,
      }
    })
    .filter((r): r is HandpickedCollection => r !== null)
}

export interface DiscoverCreator {
  id: string
  displayName: string | null
  username: string | null
  avatarUrl: string | null
  vertical: string
  followerCount: number
}

export interface DiscoverCreatorsResult {
  creators: DiscoverCreator[]
  label: string
}

export async function fetchTopCreators(opts: {
  cityId?: string
  limit?: number
}): Promise<DiscoverCreatorsResult> {
  const search = new URLSearchParams()
  if (opts.cityId) search.set('city_id', opts.cityId)
  search.set('limit', String(opts.limit ?? 8))
  const data = await apiFetchPublic<{ creators?: unknown; label?: string }>(
    `/api/v1/discover/creators?${search.toString()}`,
    { next: { revalidate: REVALIDATE_DEFAULT, tags: ['discover:creators'] } },
  )
  const rows = Array.isArray(data?.creators) ? (data.creators as unknown[]) : []
  const creators = rows
    .map((row) => {
      if (!row || typeof row !== 'object') return null
      const r = row as Record<string, unknown>
      if (typeof r.id !== 'string') return null
      return {
        id: r.id,
        displayName: typeof r.display_name === 'string' ? r.display_name : null,
        username: typeof r.username === 'string' ? r.username : null,
        avatarUrl: typeof r.avatar_url === 'string' ? r.avatar_url : null,
        vertical: typeof r.vertical === 'string' ? r.vertical : 'travel',
        followerCount: typeof r.follower_count === 'number' ? r.follower_count : 0,
      }
    })
    .filter((r): r is DiscoverCreator => r !== null)
  return {
    creators,
    label: typeof data?.label === 'string' ? data.label : 'Trending creators',
  }
}

export interface DiscoverExperience {
  id: string
  title: string
  coverImageUrl: string | null
  pricePaisa: number
  pricingModel: string
  nextDate: string | null
  seatsRemaining: number | null
  cityName: string | null
  creatorName: string | null
}

export async function fetchUpcomingExperiences(opts: {
  cityId?: string
  limit?: number
}): Promise<DiscoverExperience[]> {
  const search = new URLSearchParams()
  if (opts.cityId) search.set('city_id', opts.cityId)
  search.set('limit', String(opts.limit ?? 6))
  const data = await apiFetchPublic<{ experiences?: unknown }>(
    `/api/v1/discover/experiences?${search.toString()}`,
    { next: { revalidate: REVALIDATE_DEFAULT, tags: ['discover:experiences'] } },
  )
  const rows = Array.isArray(data?.experiences) ? (data.experiences as unknown[]) : []
  return rows
    .map((row) => {
      if (!row || typeof row !== 'object') return null
      const r = row as Record<string, unknown>
      if (typeof r.id !== 'string' || typeof r.title !== 'string') return null
      return {
        id: r.id,
        title: r.title,
        coverImageUrl: typeof r.cover_image_url === 'string' ? r.cover_image_url : null,
        pricePaisa: typeof r.price_paisa === 'number' ? r.price_paisa : 0,
        pricingModel: typeof r.pricing_model === 'string' ? r.pricing_model : 'free',
        nextDate: typeof r.next_date === 'string' ? r.next_date : null,
        seatsRemaining: typeof r.seats_remaining === 'number' ? r.seats_remaining : null,
        cityName: typeof r.city_name === 'string' ? r.city_name : null,
        creatorName: typeof r.creator_name === 'string' ? r.creator_name : null,
      }
    })
    .filter((r): r is DiscoverExperience => r !== null)
}

// ─── /discover/results — 13-filter search ─────────────────────────────

export type DurationBucket = 'day_trip' | 'weekend' | 'short' | 'long'
export type BudgetBucket = 'free' | 'lt2k' | '2to5k' | '5to15k' | 'gt15k'
export type TimeWindow = 'today' | 'this_weekend' | 'next_7d' | 'this_month' | 'custom'
export type DiscoverSort = 'recent' | 'trending' | 'price_asc' | 'price_desc'

export interface DiscoverResultsFilters {
  vertical?: 'travel' | 'stories'
  subCategoryId?: string
  leafType?: string
  type?: 'post' | 'self_paced_itinerary' | 'scheduled_experience' | 'event'
  timeWindow?: TimeWindow
  durationBuckets?: DurationBucket[]
  budgetBuckets?: BudgetBucket[]
  seasons?: string[]
  difficulties?: string[]
  groupSizes?: string[]
  destinationCityId?: string
  startingCityId?: string
  distanceKm?: 25 | 50 | 100 | 250
  userLat?: number
  userLng?: number
  q?: string
  sort?: DiscoverSort
  cursor?: string
  limit?: number
}

export interface DiscoverResultsResponse {
  items: ContentCard[]
  nextCursor: string | null
  totalCount: number | null
}

function buildResultsQuery(
  filters: DiscoverResultsFilters,
  extras: Record<string, string | undefined> = {},
): string {
  const search = new URLSearchParams()
  const map: Record<string, string | number | undefined> = {
    vertical: filters.vertical,
    sub_category_id: filters.subCategoryId,
    leaf_type: filters.leafType,
    type: filters.type,
    time_window: filters.timeWindow,
    destination_city_id: filters.destinationCityId,
    starting_city_id: filters.startingCityId,
    distance_km: filters.distanceKm,
    user_lat: filters.userLat,
    user_lng: filters.userLng,
    q: filters.q,
    sort: filters.sort,
    cursor: filters.cursor,
    limit: filters.limit,
  }
  for (const [k, v] of Object.entries(map)) {
    if (v !== undefined && v !== '') search.set(k, String(v))
  }
  if (filters.durationBuckets?.length)
    search.set('duration_buckets', filters.durationBuckets.join(','))
  if (filters.budgetBuckets?.length) search.set('budget_buckets', filters.budgetBuckets.join(','))
  if (filters.seasons?.length) search.set('seasons', filters.seasons.join(','))
  if (filters.difficulties?.length) search.set('difficulties', filters.difficulties.join(','))
  if (filters.groupSizes?.length) search.set('group_sizes', filters.groupSizes.join(','))
  for (const [k, v] of Object.entries(extras)) {
    if (v !== undefined) search.set(k, v)
  }
  return search.toString()
}

export async function fetchDiscoverResults(
  filters: DiscoverResultsFilters,
): Promise<DiscoverResultsResponse> {
  const qs = buildResultsQuery(filters)
  const data = await apiFetchPublic<{
    items?: unknown
    next_cursor?: string | null
    total_count?: number | null
  }>(`/api/v1/discover/results${qs ? `?${qs}` : ''}`, {
    next: { revalidate: 30, tags: ['discover:results'] },
  })
  const items = listOf(data?.items, transformContentCard)
  return {
    items,
    nextCursor: typeof data?.next_cursor === 'string' ? data.next_cursor : null,
    totalCount: typeof data?.total_count === 'number' ? data.total_count : null,
  }
}

/**
 * Cheap count-only preview used by the filter sheet's "Show {N} results"
 * footer. Backed by the same /results endpoint with `count_only=1` so the
 * server can short-circuit to a SELECT count(*).
 */
export async function fetchDiscoverResultsCount(
  filters: DiscoverResultsFilters,
): Promise<number | null> {
  const qs = buildResultsQuery(filters, { count_only: '1', limit: '1' })
  try {
    const data = await apiFetchPublic<{ total_count?: number | null }>(
      `/api/v1/discover/results${qs ? `?${qs}` : ''}`,
      { next: { revalidate: 0 } },
    )
    return typeof data?.total_count === 'number' ? data.total_count : null
  } catch {
    return null
  }
}
