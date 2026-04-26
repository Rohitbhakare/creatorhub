import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import { autocomplete as placesAutocomplete, getPlaceDetails } from './places.service.js'
import type { DiscoverFiltersQueryInput } from '@creatorhub/shared'

// ─── Sub-category display names ──────────────────────────────────────────────

const SUBCATEGORY_LABELS: Record<string, string> = {
  // Travel — Phase 1 active four
  road_trips:   'Road Trips',
  biking:       'Biking',
  trekking:     'Trekking & Hiking',
  adventure:    'Adventure & Sports',
  heritage:     'Heritage & Culture',
  food_trails:  'Food Trails',
  wildlife:     'Wildlife & Nature',
  photo_walks:  'Photo Walks',
  wellness:     'Wellness Retreats',
  family:       'Family & Kids',
  luxury:       'Luxury & Curated',
  offbeat:      'Offbeat & Hidden',
  nightlife:    'Nightlife & Events',
  // Stories
  travel_stories: 'Travel Stories',
  photo_essays:   'Photo Essays',
  tips_guides:    'Tips & Guides',
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SubCategoryRow {
  id: string
  slug: string
  name: string
  leaf_types: string[]
  display_order: number
}

export interface EditorialTheme {
  sub_category: string
  display_name: string
  content_count: number
  cover_image_url: string | null
}

export interface DiscoverCreatorItem {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
  vertical: string
  content_count: number
  follower_count: number
}

export interface DiscoverExperienceItem {
  id: string
  title: string
  cover_image_url: string | null
  price_paisa: number
  pricing_model: string
  next_date: string | null
  seats_remaining: number | null
  city_name: string | null
  creator_name: string | null
}

export interface DiscoverThemesResult {
  themes: EditorialTheme[]
}

export interface DiscoverCreatorsResult {
  creators: DiscoverCreatorItem[]
  label: string
}

export interface DiscoverExperiencesResult {
  experiences: DiscoverExperienceItem[]
}

export interface SearchSuggestionsResult {
  content: Array<{ id: string; title: string; type: string; vertical: string; creator_name: string | null }>
  cities: Array<{ id: string; name: string; state: string | null }>
  creators: Array<{ id: string; display_name: string | null; username: string | null; avatar_url: string | null }>
  places: Array<{ place_id: string; main_text: string; secondary_text: string }>
}

export interface ResolvedDestination {
  destination_id: string
  name: string
  formatted_address: string
  lat: number
  lng: number
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Returns up to 6 editorial themes, each representing a sub_category bucket.
 * Picks the most-engaged content in that bucket as the cover image.
 * Algorithmic — no human curation needed.
 */
export async function getDiscoverThemes(): Promise<DiscoverThemesResult> {
  const { data, error } = await supabase.rpc('discover_editorial_themes', { p_limit: 6 })

  if (error) {
    // Fallback: direct query if RPC not available yet
    const { data: fallback, error: fallbackErr } = await supabase
      .from('content')
      .select('sub_category, cover_image_url, like_count')
      .eq('status', 'published')
      .not('sub_category', 'is', null)
      .order('like_count', { ascending: false })
      .limit(60)

    if (fallbackErr) throw fallbackErr

    // Group by sub_category, pick highest-liked cover image per group
    const grouped = new Map<string, { count: number; cover: string | null; maxLikes: number }>()
    for (const row of fallback ?? []) {
      const sc = row.sub_category as string
      const existing = grouped.get(sc)
      if (!existing) {
        grouped.set(sc, { count: 1, cover: row.cover_image_url, maxLikes: row.like_count ?? 0 })
      } else {
        existing.count++
        if ((row.like_count ?? 0) > existing.maxLikes) {
          existing.maxLikes = row.like_count ?? 0
          existing.cover = row.cover_image_url
        }
      }
    }

    const themes: EditorialTheme[] = [...grouped.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 6)
      .map(([sc, v]) => ({
        sub_category: sc,
        display_name: SUBCATEGORY_LABELS[sc] ?? sc.replace(/_/g, ' '),
        content_count: v.count,
        cover_image_url: v.cover,
      }))

    return { themes }
  }

  const themes: EditorialTheme[] = (data ?? []).map((row: Record<string, unknown>) => ({
    sub_category: row.sub_category as string,
    display_name: SUBCATEGORY_LABELS[row.sub_category as string] ?? String(row.sub_category).replace(/_/g, ' '),
    content_count: Number(row.content_count),
    cover_image_url: (row.cover_image_url as string | null) ?? null,
  }))

  return { themes }
}

/**
 * Returns creators who have published content starting from a given city.
 * Falls back to any creators if city_id yields < 3 results.
 * Optional excludeVerticals filters out creators whose primary_vertical is in the list.
 */
export async function getDiscoverCreators(
  cityId: string | null,
  limit = 8,
  excludeVerticals: string[] = [],
): Promise<DiscoverCreatorsResult> {
  let label = 'Creators to follow'

  if (cityId) {
    // Fetch city name for the label
    const { data: cityRow } = await supabase
      .from('cities')
      .select('name')
      .eq('id', cityId)
      .single()
    if (cityRow?.name) label = `Creators in ${cityRow.name}`

    // Creators with content in this city
    const { data: cityCreators, error } = await supabase
      .from('content')
      .select(
        `user_id, vertical,
         creator:users!user_id(id, display_name, username, avatar_url, follower_count)`,
      )
      .eq('status', 'published')
      .eq('starting_city_id', cityId)
      .order('published_at', { ascending: false })
      .limit(limit * 3) // over-fetch to de-dup

    if (!error && cityCreators && cityCreators.length >= 3) {
      const seen = new Set<string>()
      const creators: DiscoverCreatorItem[] = []
      for (const row of cityCreators) {
        const c = (row as Record<string, unknown>).creator as Record<string, unknown> | null
        if (!c || seen.has(c.id as string)) continue
        seen.add(c.id as string)
        creators.push({
          id: c.id as string,
          display_name: (c.display_name as string | null) ?? null,
          username: (c.username as string | null) ?? null,
          avatar_url: (c.avatar_url as string | null) ?? null,
          vertical: row.vertical as string,
          content_count: 1,
          follower_count: (c.follower_count as number) ?? 0,
        })
        if (creators.length >= limit) break
      }
      if (creators.length >= 3) return { creators, label }
    }
  }

  // Fallback: most-followed creators globally
  label = 'Trending creators'

  // When excludeVerticals is non-empty, exclude creator IDs whose only active
  // verticals are in the exclusion list (i.e. fetch from user_active_verticals
  // and filter client-side after the users query).
  let excludedUserIds: string[] = []
  if (excludeVerticals.length > 0) {
    // Fetch user_ids that have at least one active vertical NOT in the exclusion list
    // Creators with any non-excluded vertical are still eligible.
    // We only exclude those whose ALL active verticals are excluded.
    const { data: allVerticalRows } = await supabase
      .from('user_active_verticals')
      .select('user_id, vertical')
      .eq('users.is_creator', true) // note: this filter won't work on a join-less query; we post-filter
    const verticalsByUser = new Map<string, string[]>()
    for (const row of allVerticalRows ?? []) {
      const existing = verticalsByUser.get(row.user_id) ?? []
      existing.push(row.vertical)
      verticalsByUser.set(row.user_id, existing)
    }
    for (const [userId, verticals] of verticalsByUser.entries()) {
      if (verticals.every((v) => excludeVerticals.includes(v))) {
        excludedUserIds.push(userId)
      }
    }
  }

  let creatorsQuery = supabase
    .from('users')
    .select('id, display_name, username, avatar_url, follower_count')
    .eq('is_creator', true)
    .order('follower_count', { ascending: false })
    .limit(limit)

  if (excludedUserIds.length > 0) {
    creatorsQuery = creatorsQuery.not('id', 'in', `(${excludedUserIds.join(',')})`)
  }

  const { data, error } = await creatorsQuery
  if (error) throw error

  const creators: DiscoverCreatorItem[] = (data ?? []).map((u) => ({
    id: u.id as string,
    display_name: (u.display_name as string | null) ?? null,
    username: (u.username as string | null) ?? null,
    avatar_url: (u.avatar_url as string | null) ?? null,
    vertical: 'travel',
    content_count: 0,
    follower_count: (u.follower_count as number) ?? 0,
  }))

  return { creators, label }
}

/**
 * Returns upcoming scheduled experiences near a city.
 */
export async function getDiscoverExperiences(
  cityId: string | null,
  limit = 5,
): Promise<DiscoverExperiencesResult> {
  let query = supabase
    .from('content')
    .select(
      `id, title, cover_image_url, price_paisa, pricing_model,
       users!user_id(display_name),
       cities!starting_city_id(name)`,
    )
    .eq('type', 'scheduled_experience')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  if (cityId) {
    query = query.eq('starting_city_id', cityId)
  }

  const { data, error } = await query
  if (error) throw error

  const experiences: DiscoverExperienceItem[] = (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    cover_image_url: (row.cover_image_url as string | null) ?? null,
    price_paisa: (row.price_paisa as number) ?? 0,
    pricing_model: (row.pricing_model as string) ?? 'free',
    next_date: null,
    seats_remaining: null,
    city_name: ((row as Record<string, unknown>).cities as Record<string, unknown> | null)?.name as string | null ?? null,
    creator_name: ((row as Record<string, unknown>).users as Record<string, unknown> | null)?.display_name as string | null ?? null,
  }))

  return { experiences }
}

/**
 * Full-text search suggestions — results grouped by type.
 * Backed by Postgres tsvector. Authenticated queries are logged separately.
 */
export async function getSearchSuggestions(
  query: string,
  limit = 5,
): Promise<SearchSuggestionsResult> {
  const q = query.trim()
  if (q.length < 2) return { content: [], cities: [], creators: [], places: [] }

  const tsQuery = q
    .split(/\s+/)
    .map((w) => w + ':*')
    .join(' & ')

  const [contentRes, citiesRes, creatorsRes] = await Promise.all([
    supabase
      .from('content')
      .select('id, title, type, vertical, users!user_id(display_name)')
      .eq('status', 'published')
      .textSearch('search_vector', tsQuery, { type: 'plain' })
      .limit(limit),

    supabase
      .from('cities')
      .select('id, name, state')
      .ilike('name', `${q}%`)
      .limit(3),

    supabase
      .from('users')
      .select('id, display_name, username, avatar_url')
      .eq('is_creator', true)
      .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
      .limit(3),
  ])

  const content = (contentRes.data ?? []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    type: r.type as string,
    vertical: r.vertical as string,
    creator_name:
      ((r as Record<string, unknown>).users as Record<string, unknown> | null)?.display_name as string | null ?? null,
  }))

  const cities = (citiesRes.data ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    state: (c.state as string | null) ?? null,
  }))

  const creators = (creatorsRes.data ?? []).map((u) => ({
    id: u.id as string,
    display_name: (u.display_name as string | null) ?? null,
    username: (u.username as string | null) ?? null,
    avatar_url: (u.avatar_url as string | null) ?? null,
  }))

  // Places fallback — when city matches are sparse, surface Google Places
  // suggestions so the user can find destinations not in our cities table
  // (e.g. "Diveagar" when migration 026 hasn't shipped yet, or any locality
  // that lives behind a Place ID rather than an admin city). Failure is
  // non-critical — search still works on cities/creators/content.
  let places: SearchSuggestionsResult['places'] = []
  if (cities.length < 3) {
    try {
      const predictions = await placesAutocomplete(q)
      places = predictions.slice(0, 3).map((p) => ({
        place_id: p.place_id,
        main_text: p.main_text,
        secondary_text: p.secondary_text,
      }))
    } catch (e) {
      // Silent — Places is supplemental, not load-bearing
      console.warn('[discover] Places fallback failed:', (e as Error).message)
    }
  }

  return { content, cities, creators, places }
}

// ─── resolveDestination ─────────────────────────────────────────
// Called when the user taps a Places suggestion in search. Fetches
// place details, upserts into place_cache, and returns lat/lng so
// the client can run a 25 km-radius destination filter.
export async function resolveDestination(placeId: string): Promise<ResolvedDestination> {
  const details = await getPlaceDetails(placeId)

  // Upsert into place_cache so subsequent resolves are free.
  const { error } = await supabase
    .from('place_cache')
    .upsert(
      {
        place_id: details.place_id,
        name: details.name,
        formatted_address: details.formatted_address,
        lat: details.lat,
        lng: details.lng,
        photos: details.photo_url ? [{ url: details.photo_url }] : [],
        types: details.types ?? [],
        fetched_at: new Date().toISOString(),
      },
      { onConflict: 'place_id' },
    )
  if (error) {
    // Cache miss isn't fatal — the client gets the resolved coords either way.
    console.warn('[discover] place_cache upsert failed:', error.message)
  }

  return {
    destination_id: details.place_id,
    name: details.name,
    formatted_address: details.formatted_address,
    lat: details.lat,
    lng: details.lng,
  }
}

// ─── searchDiscover (13-filter set) ─────────────────────────────
// Powers the rewritten Discover Results screen. Takes the full
// DiscoverFilters set from /api/v1/discover/results.
//
// Filter strategy (PostgREST has limits — some filters compose at the
// SQL level, others are pre-resolved to ID lists then joined in):
//   • Time windows (event_occurrences / scheduled_dates) → pre-fetch
//     content_ids that match, intersect via .in('id', …)
//   • Distance (PostGIS ST_DWithin) → not exposed via PostgREST, so we
//     fall back to filtering by city ID set when distance is requested
//   • Other filters compose directly via .eq / .in / .gte / .lte

export interface DiscoverResultsItem {
  id: string
  type: string
  title: string
  vertical: string
  pricing_model: string
  price_paisa: number
  like_count: number
  comment_count: number
  duration_minutes: number | null
  starting_city_id: string | null
  cover_image_url: string | null
  published_at: string | null
  user_id: string
}

export interface DiscoverResultsResponse {
  items: DiscoverResultsItem[]
  next_cursor: string | null
  total_count: number | null
}

const DURATION_BUCKET_MINUTES: Record<string, [number, number | null]> = {
  day_trip: [0, 480],
  weekend: [481, 2880],
  short: [2881, 7200],
  long: [7201, Number.MAX_SAFE_INTEGER],
}

const BUDGET_PAISA: Record<string, [number, number | null]> = {
  free: [0, 0],
  lt2k: [1, 200000],
  '2to5k': [200001, 500000],
  '5to15k': [500001, 1500000],
  gt15k: [1500001, Number.MAX_SAFE_INTEGER],
}

function timeWindowBounds(
  win: DiscoverFiltersQueryInput['time_window'],
  dateFrom?: string,
  dateTo?: string,
): { start: string; end: string } | null {
  const now = new Date()
  if (win === 'today') {
    const end = new Date(now)
    end.setUTCHours(23, 59, 59, 999)
    return { start: now.toISOString(), end: end.toISOString() }
  }
  if (win === 'this_weekend') {
    const dow = now.getUTCDay()
    const daysUntilSat = dow === 6 ? 0 : (6 - dow + 7) % 7
    const sat = new Date(now)
    sat.setUTCDate(now.getUTCDate() + daysUntilSat)
    sat.setUTCHours(0, 0, 0, 0)
    const sun = new Date(sat)
    sun.setUTCDate(sat.getUTCDate() + 1)
    sun.setUTCHours(23, 59, 59, 999)
    return { start: sat.toISOString(), end: sun.toISOString() }
  }
  if (win === 'next_7d') {
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    return { start: now.toISOString(), end: end.toISOString() }
  }
  if (win === 'this_month') {
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
    return { start: now.toISOString(), end: end.toISOString() }
  }
  if (win === 'custom' && dateFrom && dateTo) {
    return { start: dateFrom, end: dateTo }
  }
  return null
}

async function contentIdsInTimeWindow(
  bounds: { start: string; end: string },
): Promise<string[]> {
  const [evt, exp] = await Promise.all([
    supabase
      .from('event_occurrences')
      .select('content_id')
      .gte('start_at', bounds.start)
      .lte('start_at', bounds.end),
    supabase
      .from('scheduled_dates')
      .select('content_id')
      .eq('is_active', true)
      .gte('start_date', bounds.start.slice(0, 10))
      .lte('start_date', bounds.end.slice(0, 10)),
  ])
  if (evt.error || exp.error) {
    throw new AppError('db-error', 500, 'Failed to load time-windowed content')
  }
  return [
    ...new Set([
      ...((evt.data ?? []) as Array<{ content_id: string }>).map((r) => r.content_id),
      ...((exp.data ?? []) as Array<{ content_id: string }>).map((r) => r.content_id),
    ]),
  ]
}

async function citiesWithinDistance(
  lat: number,
  lng: number,
  km: number,
): Promise<string[]> {
  // Bounding-box pre-filter then ST_Distance check. Approximation: 1° lat ≈ 111km.
  const dLat = km / 111
  const dLng = km / (111 * Math.cos((lat * Math.PI) / 180))
  const { data, error } = await supabase
    .from('cities')
    .select('id, lat, lng')
    .gte('lat', lat - dLat)
    .lte('lat', lat + dLat)
    .gte('lng', lng - dLng)
    .lte('lng', lng + dLng)
  if (error) return []

  return (data ?? [])
    .filter((c: { id: string; lat: number; lng: number }) => {
      const haversine =
        Math.sin(((c.lat - lat) * Math.PI) / 360) ** 2 +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((c.lat * Math.PI) / 180) *
          Math.sin(((c.lng - lng) * Math.PI) / 360) ** 2
      const dKm = 2 * 6371 * Math.asin(Math.sqrt(haversine))
      return dKm <= km
    })
    .map((c: { id: string }) => c.id)
}

export async function searchDiscover(
  filters: DiscoverFiltersQueryInput,
): Promise<DiscoverResultsResponse> {
  const limit = filters.limit ?? 20

  // ── Phase 1: pre-resolve ID-based filters ──────────────────
  let restrictIds: string[] | null = null
  const intersect = (ids: string[]) => {
    restrictIds = restrictIds === null ? ids : restrictIds.filter((id) => ids.includes(id))
  }

  // Time window → content_ids in event_occurrences/scheduled_dates
  const bounds = timeWindowBounds(
    filters.time_window,
    filters.date_from,
    filters.date_to,
  )
  if (bounds) {
    const ids = await contentIdsInTimeWindow(bounds)
    if (!ids.length) return { items: [], next_cursor: null, total_count: 0 }
    intersect(ids)
  }

  // Months → contents whose event_occurrences fall in those calendar months.
  // Done client-side because PostgREST doesn't expose EXTRACT cleanly.
  if (filters.months?.length) {
    const { data: occ } = await supabase
      .from('event_occurrences')
      .select('content_id, start_at')
    const monthSet = new Set(filters.months)
    const ids = (occ ?? [])
      .filter((r: { start_at: string }) => monthSet.has(new Date(r.start_at).getUTCMonth() + 1))
      .map((r: { content_id: string }) => r.content_id)
    if (!ids.length) return { items: [], next_cursor: null, total_count: 0 }
    intersect(ids)
  }

  // ── Phase 2: build the main content query ─────────────────
  let q = supabase
    .from('content')
    .select(
      'id, type, title, vertical, pricing_model, price_paisa, like_count, comment_count, duration_minutes, starting_city_id, cover_image_url, published_at, user_id',
      { count: 'exact' },
    )
    .eq('status', 'published')
    .eq('visibility', 'public')
    .is('deleted_at', null)

  if (filters.vertical) q = q.eq('vertical', filters.vertical)
  if (filters.sub_category_id) q = q.eq('sub_category_id', filters.sub_category_id)
  if (filters.leaf_type) q = q.eq('leaf_type', filters.leaf_type)
  if (filters.type) q = q.eq('type', filters.type)
  if (filters.starting_city_id) q = q.eq('starting_city_id', filters.starting_city_id)

  // Destination — match starting_city OR destination_city_ids[] OR proximity
  if (filters.destination_city_id) {
    q = q.or(
      `starting_city_id.eq.${filters.destination_city_id},destination_city_ids.cs.{${filters.destination_city_id}}`,
    )
  } else if (
    typeof filters.destination_lat === 'number' &&
    typeof filters.destination_lng === 'number'
  ) {
    const cityIds = await citiesWithinDistance(
      filters.destination_lat,
      filters.destination_lng,
      25,
    )
    if (!cityIds.length) return { items: [], next_cursor: null, total_count: 0 }
    q = q.in('starting_city_id', cityIds)
  }

  // Distance from user — bounded city set
  if (
    filters.distance_km &&
    typeof filters.user_lat === 'number' &&
    typeof filters.user_lng === 'number'
  ) {
    const cityIds = await citiesWithinDistance(
      filters.user_lat,
      filters.user_lng,
      filters.distance_km,
    )
    if (!cityIds.length) return { items: [], next_cursor: null, total_count: 0 }
    q = q.in('starting_city_id', cityIds)
  }

  // Duration buckets — OR of ranges
  if (filters.duration_buckets?.length) {
    const ranges = filters.duration_buckets
      .map((b) => DURATION_BUCKET_MINUTES[b])
      .filter((r): r is [number, number | null] => Array.isArray(r))
    if (ranges.length) {
      const orParts = ranges.map(([min, max]) =>
        max != null
          ? `and(duration_minutes.gte.${min},duration_minutes.lte.${max})`
          : `duration_minutes.gte.${min}`,
      )
      q = q.or(orParts.join(','))
    }
  }

  // Budget buckets — OR of price ranges
  if (filters.budget_buckets?.length) {
    const ranges = filters.budget_buckets
      .map((b) => BUDGET_PAISA[b])
      .filter((r): r is [number, number | null] => Array.isArray(r))
    if (ranges.length) {
      const orParts = ranges.map(([min, max]) =>
        max != null
          ? `and(price_paisa.gte.${min},price_paisa.lte.${max})`
          : `price_paisa.gte.${min}`,
      )
      q = q.or(orParts.join(','))
    }
  }

  // Facets stored in JSONB column `facets`
  if (filters.seasons?.length) {
    q = q.in('facets->>season', filters.seasons)
  }
  if (filters.difficulties?.length) {
    q = q.in('facets->>difficulty', filters.difficulties)
  }
  if (filters.group_sizes?.length) {
    q = q.in('facets->>group_size', filters.group_sizes)
  }

  // Free-text search over content title/body via tsvector
  if (filters.q) {
    const tsQuery = filters.q
      .trim()
      .split(/\s+/)
      .map((w) => w + ':*')
      .join(' & ')
    q = q.textSearch('search_vector', tsQuery, { type: 'plain' })
  }

  // Restrict to pre-resolved id set (time window / months)
  if (restrictIds !== null) {
    if (!(restrictIds as string[]).length) return { items: [], next_cursor: null, total_count: 0 }
    q = q.in('id', restrictIds as string[])
  }

  // Sorting — default: newest first
  const sort = filters.sort ?? 'recent'
  if (sort === 'recent') q = q.order('published_at', { ascending: false })
  else if (sort === 'trending') q = q.order('like_count', { ascending: false }).order('comment_count', { ascending: false })
  else if (sort === 'price_asc') q = q.order('price_paisa', { ascending: true })
  else if (sort === 'price_desc') q = q.order('price_paisa', { ascending: false })

  q = q.limit(limit)

  // Cursor pagination on published_at (only for sort=recent for now)
  if (filters.cursor && sort === 'recent') {
    try {
      const decoded = Buffer.from(filters.cursor, 'base64url').toString('utf8')
      q = q.lt('published_at', decoded)
    } catch {
      // ignore malformed cursor
    }
  }

  const { data, error, count } = await q
  if (error) throw new AppError('db-error', 500, 'Discover search failed')

  const rows = (data ?? []) as DiscoverResultsItem[]
  let next_cursor: string | null = null
  if (rows.length === limit && sort === 'recent') {
    const last = rows.at(-1)
    if (last?.published_at) {
      next_cursor = Buffer.from(last.published_at, 'utf8').toString('base64url')
    }
  }

  return { items: rows, next_cursor, total_count: count ?? null }
}

/**
 * Returns all active sub-categories for a given vertical, ordered by display_order.
 * Powers the 3-level taxonomy browse (vertical → sub-category → leaf type).
 */
export async function getSubCategories(vertical: string): Promise<SubCategoryRow[]> {
  const { data, error } = await supabase
    .from('vertical_sub_categories')
    .select('id, slug, name, leaf_types, display_order')
    .eq('vertical', vertical)
    .eq('active', true)
    .order('display_order')

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    leaf_types: (row.leaf_types ?? []) as string[],
    display_order: row.display_order as number,
  }))
}

// ─── Discover home: rotating search placeholder (DD-015) ──────────
//
// Pulls real recent top searches from the materialized view first, then
// fills the remainder from the seeded defaults so cold-start traffic
// always sees something concrete instead of the static fallback string.

export async function getPopularSearches(limit: number): Promise<string[]> {
  const out: string[] = []
  const seen = new Set<string>()

  const { data: top, error: topErr } = await supabase
    .from('top_searches_7d')
    .select('normalized_query, search_count')
    .order('search_count', { ascending: false })
    .limit(limit)

  if (!topErr && top) {
    for (const row of top) {
      const q = (row.normalized_query as string).trim()
      if (q && !seen.has(q)) {
        seen.add(q)
        out.push(q)
        if (out.length >= limit) return out
      }
    }
  }

  // Fallback / fill from seed defaults
  const { data: seeds } = await supabase
    .from('search_placeholder_defaults')
    .select('placeholder_text, priority')
    .eq('is_active', true)
    .order('priority', { ascending: false })
    .limit(limit * 2)

  for (const row of seeds ?? []) {
    const q = (row.placeholder_text as string).trim()
    if (q && !seen.has(q)) {
      seen.add(q)
      out.push(q)
      if (out.length >= limit) break
    }
  }

  return out
}

// ─── Discover home: handpicked collections (algorithmic, DD-014) ──
//
// Generates up to N collection tiles from query templates. Templates
// returning fewer than 6 items are dropped to avoid thin "looks broken"
// rails. Cover image is the cover of each template's top item.

export interface HandpickedCollectionItem {
  id: string
  title: string
  subtitle: string
  kind: 'popular_in_city' | 'under_budget' | 'short_reads' | 'new_voices'
  count: number
  cover_url: string | null
}

const MIN_COLLECTION_COUNT = 6

async function templatePopularInCity(
  cityId: string | null,
): Promise<HandpickedCollectionItem | null> {
  if (!cityId) return null
  const { data: cityRow } = await supabase
    .from('cities')
    .select('name')
    .eq('id', cityId)
    .single()
  const cityName = cityRow?.name as string | undefined
  if (!cityName) return null

  const { data, error } = await supabase
    .from('content')
    .select('id, cover_image_url, view_count, booking_count')
    .eq('status', 'published')
    .eq('starting_city_id', cityId)
    .is('deleted_at', null)
    .order('view_count', { ascending: false })
    .limit(12)
  if (error || !data || data.length < MIN_COLLECTION_COUNT) return null

  return {
    id: `popular_in_${cityId}`,
    title: `Popular in ${cityName}`,
    subtitle: `${data.length} trips creators are loving`,
    kind: 'popular_in_city',
    count: data.length,
    cover_url: (data[0]?.cover_image_url as string | null) ?? null,
  }
}

async function templateUnderBudget(): Promise<HandpickedCollectionItem | null> {
  const { data, error } = await supabase
    .from('content')
    .select('id, cover_image_url')
    .eq('status', 'published')
    .lte('price_paisa', 200000)
    .gt('price_paisa', 0)
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(12)
  if (error || !data || data.length < MIN_COLLECTION_COUNT) return null

  return {
    id: 'under_budget_2k',
    title: 'Under ₹2k',
    subtitle: 'Trips and experiences that punch above their price',
    kind: 'under_budget',
    count: data.length,
    cover_url: (data[0]?.cover_image_url as string | null) ?? null,
  }
}

async function templateShortReads(): Promise<HandpickedCollectionItem | null> {
  // Approximate a "5-minute read" by body length (~250 wpm).
  // 1500 chars ≈ 250 words ≈ ~1 min; cap at ~1500 for short.
  const { data, error } = await supabase
    .from('content')
    .select('id, cover_image_url, body')
    .eq('status', 'published')
    .eq('type', 'post')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(40)
  if (error || !data) return null
  const filtered = data.filter(
    (r) => typeof r.body === 'string' && (r.body as string).length <= 1500,
  )
  if (filtered.length < MIN_COLLECTION_COUNT) return null

  return {
    id: 'short_reads',
    title: 'Short reads',
    subtitle: 'Stories you can finish on the metro',
    kind: 'short_reads',
    count: filtered.length,
    cover_url: (filtered[0]?.cover_image_url as string | null) ?? null,
  }
}

async function templateNewVoices(): Promise<HandpickedCollectionItem | null> {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('users')
    .select('id, avatar_url, follower_count')
    .eq('is_creator', true)
    .gte('created_at', cutoff)
    .order('follower_count', { ascending: false })
    .limit(12)
  if (error || !data || data.length < MIN_COLLECTION_COUNT) return null

  return {
    id: 'new_voices',
    title: 'Fresh creators worth following',
    subtitle: 'New voices in the last 90 days',
    kind: 'new_voices',
    count: data.length,
    cover_url: (data[0]?.avatar_url as string | null) ?? null,
  }
}

export async function getHandpickedCollections(
  cityId: string | null,
  limit: number,
): Promise<HandpickedCollectionItem[]> {
  const candidates = await Promise.all([
    templatePopularInCity(cityId),
    templateUnderBudget(),
    templateShortReads(),
    templateNewVoices(),
  ])
  return candidates.filter((c): c is HandpickedCollectionItem => c !== null).slice(0, limit)
}

// ─── Discover home: active cities chip rail ────────────────────────

export interface DiscoverCityRow {
  city_id: string
  name: string
  state: string | null
  content_count: number
}

export async function getActiveCities(limit: number): Promise<DiscoverCityRow[]> {
  // Aggregate published content per starting city, join names, top N.
  // Done in two queries because PostgREST doesn't support GROUP BY directly.
  const { data: rows, error } = await supabase
    .from('content')
    .select('starting_city_id')
    .eq('status', 'published')
    .is('deleted_at', null)
    .not('starting_city_id', 'is', null)
    .limit(5000)
  if (error || !rows) return []

  const counts = new Map<string, number>()
  for (const r of rows) {
    const cid = r.starting_city_id as string
    counts.set(cid, (counts.get(cid) ?? 0) + 1)
  }
  if (counts.size === 0) return []

  const topIds = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)

  const { data: cityRows, error: cityErr } = await supabase
    .from('cities')
    .select('id, name, state')
    .in('id', topIds)
  if (cityErr || !cityRows) return []

  return topIds
    .map((id) => {
      const c = cityRows.find((r) => r.id === id)
      if (!c) return null
      return {
        city_id: id,
        name: c.name as string,
        state: (c.state as string | null) ?? null,
        content_count: counts.get(id) ?? 0,
      }
    })
    .filter((r): r is DiscoverCityRow => r !== null)
}

/**
 * Log a search query for analytics (authenticated users only).
 * 90-day rolling retention enforced by a Supabase cron job.
 */
export async function logSearchQuery(
  userId: string,
  query: string,
  resultCount: number,
): Promise<void> {
  const { error } = await supabase.from('search_queries').insert({
    user_id: userId,
    query: query.trim(),
    normalized_query: query.trim().toLowerCase(),
    result_count: resultCount,
  })
  // Non-critical — swallow errors rather than failing the request
  if (error) console.warn('[discover] search log insert failed:', error.message)
}
