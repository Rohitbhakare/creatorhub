import { supabase } from '../lib/supabase.js'

// ─── Sub-category display names ──────────────────────────────────────────────

const SUBCATEGORY_LABELS: Record<string, string> = {
  // Travel
  road_trips:   'Road Trips & Biking',
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
  if (q.length < 2) return { content: [], cities: [], creators: [] }

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

  return { content, cities, creators }
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
