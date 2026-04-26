import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import {
  SEASONS,
  TRIP_STYLES,
  AUDIENCES,
  toBudgetTier,
  readTimeMinFromBody,
  type Season,
  type TripStyle,
  type Audience,
  type FeedTags,
} from '@creatorhub/shared'

// ─── Types ──────────────────────────────────────────────────────

export interface FeedCreator {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
}

export interface FeedContentItem {
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
  creator: FeedCreator | null
  tags: FeedTags
}

export interface NearYouResult {
  items: FeedContentItem[]
  /** 0=exact city · 1=200km · 2=500km · 3=India-wide */
  fallback_level: number
  /** Human-readable label for the section header */
  label: string
  /** Non-empty when fallback_level > 0 — names of nearby cities pulled in */
  fallback_cities: string[]
}

export interface DiscoverCreator {
  id: string
  display_name: string | null
  username: string | null
  avatar_url: string | null
  vertical: string
}

// ─── Helpers ─────────────────────────────────────────────────────

// Narrow a raw JSONB facets value to a valid enum member (or null). Defensive
// on purpose: the column is JSONB so DB writes from other paths could contain
// garbage. Anything outside the canonical enum becomes null so mobile doesn't
// have to guard unknown values.
function pickEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  if (typeof value !== 'string') return null
  return (allowed as readonly string[]).includes(value) ? (value as T) : null
}

function deriveTags(
  item: Record<string, unknown>,
  cityById: Map<string, string>,
): FeedTags {
  const type = item.type as string
  const facets = (item.facets && typeof item.facets === 'object' ? item.facets : {}) as Record<
    string,
    unknown
  >

  const season = pickEnum<Season>(facets.season, SEASONS)
  const tripStyle = pickEnum<TripStyle>(facets.trip_style, TRIP_STYLES)
  const audience = pickEnum<Audience>(facets.audience, AUDIENCES)

  // Budget tier: posts are always free social content — omit (null) rather
  // than labelling them "free" which would imply a pricing decision.
  const budgetTier =
    type === 'post'
      ? null
      : toBudgetTier(item.price_paisa as number | null, item.pricing_model as string | null)

  // Read-time:
  //   post → derived from body word count
  //   itinerary → uses duration_minutes (the creator's own estimate)
  //   experience/event → null (they're scheduled/time-bound, chip is meaningless)
  let readTimeMin: number | null = null
  if (type === 'post') {
    readTimeMin = readTimeMinFromBody(item.body as string | null | undefined)
  } else if (type === 'self_paced_itinerary') {
    const d = item.duration_minutes as number | null | undefined
    readTimeMin = typeof d === 'number' && d > 0 ? d : null
  }

  const cityId = item.starting_city_id as string | null | undefined
  const locationLabel = cityId ? (cityById.get(cityId) ?? null) : null

  return {
    season,
    trip_style: tripStyle,
    audience,
    budget_tier: budgetTier,
    read_time_min: readTimeMin,
    location_label: locationLabel,
  }
}

/**
 * Enrich raw content rows with creator summary + FeedTags in a single pass.
 *
 * Does two batched lookups:
 *   1. users (creator display_name/username/avatar_url)
 *   2. cities (name for starting_city_id → location_label)
 *
 * Raw rows must include: facets, body, starting_city_id, type, pricing_model,
 * price_paisa, duration_minutes — all pulled in the feed SELECT list.
 */
async function enrichItems(
  items: Array<{ user_id: string; [k: string]: unknown }>,
): Promise<FeedContentItem[]> {
  if (!items.length) return []

  const userIds = [...new Set(items.map((i) => i.user_id as string))]
  const cityIds = [
    ...new Set(
      items
        .map((i) => i.starting_city_id as string | null | undefined)
        .filter((v): v is string => typeof v === 'string' && v.length > 0),
    ),
  ]

  // Parallel fetches — users are always needed, cities only when at least one
  // row has a starting_city_id. Kept as two Promise.all legs so a missing-city
  // case doesn't run an empty `.in('id', [])` which Supabase treats oddly.
  const [creatorsRes, citiesRes] = await Promise.all([
    userIds.length
      ? supabase.from('users').select('id, display_name, username, avatar_url').in('id', userIds)
      : Promise.resolve({ data: [], error: null }),
    cityIds.length
      ? supabase.from('cities').select('id, name').in('id', cityIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (creatorsRes.error) throw new AppError('db-error', 500, 'Failed to load creator data')
  if (citiesRes.error) throw new AppError('db-error', 500, 'Failed to load city data')

  const creatorById = Object.fromEntries(
    ((creatorsRes.data ?? []) as Array<Record<string, unknown>>).map((c) => [c.id as string, c]),
  )
  const cityById = new Map<string, string>(
    ((citiesRes.data ?? []) as Array<Record<string, unknown>>).map((c) => [
      c.id as string,
      c.name as string,
    ]),
  )

  return items.map((item) => ({
    id: item.id as string,
    type: item.type as string,
    title: item.title as string,
    vertical: item.vertical as string,
    pricing_model: item.pricing_model as string,
    price_paisa: item.price_paisa as number,
    like_count: (item.like_count ?? 0) as number,
    comment_count: (item.comment_count ?? 0) as number,
    duration_minutes: (item.duration_minutes ?? null) as number | null,
    starting_city_id: (item.starting_city_id ?? null) as string | null,
    cover_image_url: (item.cover_image_url ?? null) as string | null,
    published_at: (item.published_at ?? null) as string | null,
    creator: (creatorById[item.user_id as string] ?? null) as FeedCreator | null,
    tags: deriveTags(item, cityById),
  }))
}

// Back-compat alias — every caller used to be attachCreators. Keep the name
// so callers below (and any future ones) stay readable, but it now does both
// creator + tag enrichment.
const attachCreators = enrichItems

async function getUserLocation(
  userId: string,
): Promise<{ cityId: string; cityName: string; lat: number; lng: number } | null> {
  const { data: user, error } = await supabase
    .from('users')
    .select('current_city_id')
    .eq('id', userId)
    .single()

  if (error || !user?.current_city_id) return null

  const { data: city, error: cityErr } = await supabase
    .from('cities')
    .select('id, name, lat, lng')
    .eq('id', user.current_city_id)
    .single()

  if (cityErr || !city) return null

  return { cityId: city.id, cityName: city.name, lat: city.lat, lng: city.lng }
}

async function getCityLocation(
  cityId: string,
): Promise<{ cityId: string; cityName: string; lat: number; lng: number } | null> {
  const { data: city, error } = await supabase
    .from('cities')
    .select('id, name, lat, lng')
    .eq('id', cityId)
    .single()

  if (error || !city) return null
  return { cityId: city.id, cityName: city.name, lat: city.lat, lng: city.lng }
}

// ─── getPopularAcrossIndia ───────────────────────────────────────
// Fallback for guests (or signed-in users with no follows / verticals).
async function getPopularAcrossIndia(): Promise<FeedContentItem[]> {
  const { data, error } = await supabase
    .from('content')
    .select(
      'id, type, title, vertical, pricing_model, price_paisa, like_count, comment_count, duration_minutes, starting_city_id, cover_image_url, user_id, published_at, facets, body',
    )
    .eq('status', 'published')
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .gte('published_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('like_count', { ascending: false })
    .limit(20)

  if (error) throw new AppError('db-error', 500, 'Failed to load popular content')
  return attachCreators((data ?? []) as Array<{ user_id: string; [k: string]: unknown }>)
}

// ─── getNearYouSection ───────────────────────────────────────────

export async function getNearYouSection(
  userId: string | null,
  guestCityId?: string,
  subCategoryId?: string,
): Promise<NearYouResult> {
  const location = userId
    ? await getUserLocation(userId)
    : guestCityId
      ? await getCityLocation(guestCityId)
      : null

  if (!location) {
    // Guest with no city (or signed-in user without city) → popular across India
    const items = await getPopularAcrossIndia()
    return {
      items,
      fallback_level: 3,
      label: 'Popular across India',
      fallback_cities: [],
    }
  }

  // RPC doesn't filter by sub_category_id, so when one is set we skip the
  // waterfall and run a city-match query that does.
  const { data, error } = subCategoryId
    ? { data: null, error: { message: 'skip-rpc-for-subcat' } as { message: string } }
    : await supabase.rpc('feed_near_you', {
        p_city_id: location.cityId,
        p_lat: location.lat,
        p_lng: location.lng,
        p_limit: 20,
      })

  // RPC may not exist yet (migration 013 pending) — fall back to city-match query
  if (error) {
    let fbq = supabase
      .from('content')
      .select(
        'id, type, title, vertical, pricing_model, price_paisa, like_count, comment_count, duration_minutes, starting_city_id, cover_image_url, user_id, published_at, facets, body',
      )
      .eq('status', 'published')
      .eq('visibility', 'public')
      .is('deleted_at', null)
      .eq('starting_city_id', location.cityId)
      .order('published_at', { ascending: false })
      .limit(20)
    if (subCategoryId) fbq = fbq.eq('sub_category_id', subCategoryId)
    const { data: fallbackData, error: fallbackError } = await fbq

    if (fallbackError || !fallbackData?.length) {
      const items = await getPopularAcrossIndia()
      return { items, fallback_level: 3, label: 'Popular across India', fallback_cities: [] }
    }

    const items = await attachCreators(
      fallbackData as Array<{ user_id: string; [k: string]: unknown }>,
    )
    return { items, fallback_level: 0, label: `Weekend trips from ${location.cityName}`, fallback_cities: [] }
  }

  const rows = (data ?? []) as Array<{
    id: string
    type: string
    title: string
    vertical: string
    pricing_model: string
    price_paisa: number
    like_count: number
    starting_city_id: string | null
    user_id: string
    fallback_level: number
  }>

  if (!rows.length) {
    return { items: [], fallback_level: 3, label: 'Popular across India', fallback_cities: [] }
  }

  const fallbackLevel = rows[0]!.fallback_level

  // Collect unique city IDs for the fallback banner (levels 1–2)
  let fallbackCities: string[] = []
  if (fallbackLevel === 1 || fallbackLevel === 2) {
    const cityIds = [...new Set(rows.map((r) => r.starting_city_id).filter(Boolean))]
    if (cityIds.length) {
      const { data: cities } = await supabase
        .from('cities')
        .select('id, name')
        .in('id', cityIds as string[])
      fallbackCities = (cities ?? []).map((c) => c.name)
    }
  }

  const labelMap: Record<number, string> = {
    0: `Weekend trips from ${location.cityName}`,
    1: 'Trips around you',
    2: 'Trips near you',
    3: 'Popular across India',
  }

  const items = await attachCreators(rows)
  return {
    items,
    fallback_level: fallbackLevel,
    label: labelMap[fallbackLevel] ?? 'Near you',
    fallback_cities: fallbackCities,
  }
}

// ─── getVerticalSection ──────────────────────────────────────────

export async function getVerticalSection(
  vertical: string,
  _userId?: string | null,
  subCategoryId?: string,
): Promise<FeedContentItem[]> {
  let query = supabase
    .from('content')
    .select('id, type, title, vertical, pricing_model, price_paisa, like_count, comment_count, duration_minutes, starting_city_id, cover_image_url, user_id, published_at, facets, body')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .eq('vertical', vertical)
    .is('deleted_at', null)
    .order('like_count', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(10)

  if (subCategoryId !== undefined) {
    query = query.eq('sub_category_id', subCategoryId)
  }

  const { data, error } = await query
  if (error) throw new AppError('db-error', 500, 'Failed to load vertical section')

  return attachCreators(data ?? [])
}

// ─── getDiscoverSection ──────────────────────────────────────────

export async function getDiscoverSection(userId?: string | null): Promise<DiscoverCreator[]> {
  let excludeVerticals: string[] = []

  if (userId) {
    const { data: userVerticals } = await supabase
      .from('user_active_verticals')
      .select('vertical')
      .eq('user_id', userId)

    excludeVerticals = (userVerticals ?? []).map((v) => v.vertical)
  }

  // Find creators from other verticals
  let query = supabase
    .from('user_active_verticals')
    .select('user_id, vertical, users!inner(id, display_name, username, avatar_url, is_creator)')
    .eq('users.is_creator', true)
    .limit(20)

  if (excludeVerticals.length) {
    query = query.not('vertical', 'in', `(${excludeVerticals.join(',')})`)
  }

  const { data, error } = await query

  if (error) throw new AppError('db-error', 500, 'Failed to load discover section')

  // Dedupe by user_id, take first vertical per creator
  const seen = new Set<string>()
  const creators: DiscoverCreator[] = []
  for (const row of data ?? []) {
    const user = (row as Record<string, unknown>).users as Record<string, unknown>
    if (!user || seen.has(row.user_id)) continue
    seen.add(row.user_id)
    creators.push({
      id: user.id as string,
      display_name: (user.display_name ?? null) as string | null,
      username: (user.username ?? null) as string | null,
      avatar_url: (user.avatar_url ?? null) as string | null,
      vertical: row.vertical,
    })
  }

  return creators.slice(0, 10)
}

// ─── getForYouSection ────────────────────────────────────────────
// Option C: followed creators (2x weight, last 30d) merged with
// user's active verticals (1x weight, last 60d). Tie-break on like_count
// capped at 500 so one viral post doesn't dominate the feed.
// Guests (userId=null) get popular-across-India directly (IAM-FR-010).
export async function getForYouSection(userId: string | null): Promise<FeedContentItem[]> {
  if (!userId) return getPopularAcrossIndia()

  // Step 1: get IDs of creators the user follows
  const { data: followRows, error: followsErr } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  if (followsErr) throw new AppError('db-error', 500, 'Failed to load follows')

  const followingIds = (followRows ?? []).map((r) => r.following_id as string)

  const [followedRes, verticalsRes] = await Promise.all([
    // Step 2: content from followed creators (empty array → returns nothing, no DB hit needed)
    followingIds.length === 0
      ? Promise.resolve({ data: [], error: null })
      : supabase
          .from('content')
          .select(
            'id, type, title, vertical, pricing_model, price_paisa, like_count, comment_count, duration_minutes, starting_city_id, cover_image_url, user_id, published_at, facets, body',
          )
          .eq('status', 'published')
          .eq('visibility', 'public')
          .is('deleted_at', null)
          .in('user_id', followingIds)
          .gte('published_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('published_at', { ascending: false })
          .limit(20),
    supabase
      .from('user_active_verticals')
      .select('vertical')
      .eq('user_id', userId),
  ])

  if (followedRes.error) throw new AppError('db-error', 500, 'Failed to load followed content')
  if (verticalsRes.error) throw new AppError('db-error', 500, 'Failed to load user verticals')

  const followedRaw = (followedRes.data ?? []) as unknown as Array<Record<string, unknown>>
  const verticalsRaw = (verticalsRes.data ?? []) as unknown as Array<{ vertical: string }>

  const followedRows: Array<Record<string, unknown>> = followedRaw.map((r) => ({ ...r, _weight: 2 }))
  const verticals = verticalsRaw.map((v) => v.vertical)

  let verticalRows: Array<Record<string, unknown>> = []
  if (verticals.length) {
    const { data, error } = await supabase
      .from('content')
      .select(
        'id, type, title, vertical, pricing_model, price_paisa, like_count, comment_count, duration_minutes, starting_city_id, cover_image_url, user_id, published_at, facets, body',
      )
      .eq('status', 'published')
      .eq('visibility', 'public')
      .is('deleted_at', null)
      .in('vertical', verticals)
      .gte('published_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
      .order('like_count', { ascending: false })
      .limit(30)

    if (error) throw new AppError('db-error', 500, 'Failed to load vertical content')
    verticalRows = ((data ?? []) as unknown as Array<Record<string, unknown>>).map((r) => ({ ...r, _weight: 1 }))
  }

  // Merge, dedupe by id (prefer followed), rank by weight*10 + min(likes, 500)
  const byId = new Map<string, Record<string, unknown>>()
  for (const row of [...followedRows, ...verticalRows]) {
    const id = row.id as string
    const existing = byId.get(id)
    if (!existing || (row._weight as number) > (existing._weight as number)) {
      byId.set(id, row)
    }
  }

  const ranked = [...byId.values()].sort((a, b) => {
    const scoreA = (a._weight as number) * 10 + Math.min(a.like_count as number, 500)
    const scoreB = (b._weight as number) * 10 + Math.min(b.like_count as number, 500)
    if (scoreB !== scoreA) return scoreB - scoreA
    return String(b.published_at).localeCompare(String(a.published_at))
  })

  // Fallback: no follows AND no verticals → popular across India (last 30d)
  if (!ranked.length) return getPopularAcrossIndia()

  return attachCreators(ranked.slice(0, 20) as Array<{ user_id: string; [k: string]: unknown }>)
}

// ─── getFollowingSection ─────────────────────────────────────────
// Strictly content from creators the user follows. Ordered newest-first
// since user has explicitly opted into these creators.
// Guests (userId=null) follow nobody → empty list.
export async function getFollowingSection(userId: string | null): Promise<FeedContentItem[]> {
  if (!userId) return []

  const { data: followRows, error: followsErr } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  if (followsErr) throw new AppError('db-error', 500, 'Failed to load following feed')

  const followingIds = (followRows ?? []).map((r) => r.following_id as string)
  if (followingIds.length === 0) return []

  const { data, error } = await supabase
    .from('content')
    .select(
      'id, type, title, vertical, pricing_model, price_paisa, like_count, comment_count, duration_minutes, starting_city_id, cover_image_url, user_id, published_at, facets, body',
    )
    .eq('status', 'published')
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .in('user_id', followingIds)
    .order('published_at', { ascending: false })
    .limit(20)

  if (error) throw new AppError('db-error', 500, 'Failed to load following feed')

  return attachCreators((data ?? []) as unknown as Array<{ user_id: string; [k: string]: unknown }>)
}

// ─── getHeroForTab ───────────────────────────────────────────────
// Returns single top-ranking item for the hero slot, per tab context.
// Mobile uses this directly instead of picking items[0] — gives backend
// flexibility to override with editor_collections or featured flag later.
export type HeroTab = 'for_you' | 'following' | 'near_you'

export async function getHeroForTab(
  userId: string | null,
  tab: HeroTab,
  guestCityId?: string,
): Promise<FeedContentItem | null> {
  if (tab === 'following') {
    const items = await getFollowingSection(userId)
    return items[0] ?? null
  }

  if (tab === 'near_you') {
    const result = await getNearYouSection(userId, guestCityId)
    return result.items[0] ?? null
  }

  // for_you
  const items = await getForYouSection(userId)
  return items[0] ?? null
}

// ─── updateUserCity ──────────────────────────────────────────────

export async function updateUserCity(
  userId: string,
  cityId: string,
): Promise<{ id: string; name: string; state: string }> {
  // Verify city exists
  const { data: city, error: cityErr } = await supabase
    .from('cities')
    .select('id, name, state, lat, lng')
    .eq('id', cityId)
    .eq('active', true)
    .single()

  if (cityErr || !city) {
    throw new AppError('not-found', 404, 'City not found')
  }

  // Update user — set current_city_id and sync current_location_point from city
  const { error: updateErr } = await supabase.rpc('update_user_city', {
    p_user_id: userId,
    p_city_id: cityId,
    p_lat: city.lat,
    p_lng: city.lng,
  })

  if (updateErr) {
    // Fallback: update city_id only (location point sync skipped)
    const { error: fallbackErr } = await supabase
      .from('users')
      .update({ current_city_id: cityId })
      .eq('id', userId)

    if (fallbackErr) throw new AppError('db-error', 500, 'Failed to update city')
  }

  return { id: city.id, name: city.name, state: city.state }
}

// ─── getCategoryBrowse ───────────────────────────────────────────
// DISC-FR-003: Category browse — vertical → sub-category → leaf type.
// Returns sub-categories with content counts + content page for the selected node.

export interface SubCategoryItem {
  id: string
  slug: string
  name: string
  leaf_types: string[]
  content_count: number
}

export interface CategoryBrowseResult {
  sub_categories: SubCategoryItem[]
  items: FeedContentItem[]
  next_cursor: string | null
}

export async function getCategoryBrowse(params: {
  vertical: string
  sub_category_id?: string
  leaf_type?: string
  limit?: number
  cursor?: string
}): Promise<CategoryBrowseResult> {
  const limit = params.limit ?? 20

  // Sub-categories with content counts (parallel count per sub-cat)
  const { data: rawSubCats } = await supabase
    .from('vertical_sub_categories')
    .select('id, slug, name, leaf_types')
    .eq('vertical', params.vertical)
    .eq('active', true)
    .order('display_order')

  const subCatRows = (rawSubCats ?? []) as Array<{
    id: string
    slug: string
    name: string
    leaf_types: string[]
  }>

  const subCatsWithCounts: SubCategoryItem[] = await Promise.all(
    subCatRows.map(async (sc) => {
      const { count } = await supabase
        .from('content')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published')
        .eq('sub_category_id', sc.id)
      return { ...sc, leaf_types: (sc.leaf_types ?? []) as string[], content_count: count ?? 0 }
    }),
  )

  // Content page (filtered by sub-category + leaf type)
  let contentQuery = supabase
    .from('content')
    .select(
      'id, type, title, vertical, pricing_model, price_paisa, like_count, comment_count, duration_minutes, starting_city_id, cover_image_url, published_at, body, facets, user_id',
    )
    .eq('status', 'published')
    .eq('vertical', params.vertical)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (params.sub_category_id) {
    contentQuery = contentQuery.eq('sub_category_id', params.sub_category_id)
  }
  if (params.leaf_type) {
    contentQuery = contentQuery.eq('leaf_type', params.leaf_type)
  }
  if (params.cursor) {
    const decoded = Buffer.from(params.cursor, 'base64url').toString('utf8')
    contentQuery = contentQuery.lt('published_at', decoded)
  }

  const { data: contentRows, error: contentErr } = await contentQuery
  if (contentErr) throw new AppError('db-error', 500, 'Failed to load category content')

  const items = await enrichItems(
    (contentRows ?? []) as Array<{ user_id: string; [k: string]: unknown }>,
  )

  let next_cursor: string | null = null
  if (contentRows && contentRows.length === limit) {
    const last = contentRows.at(-1)
    if (last) {
      next_cursor = Buffer.from((last.published_at as string) ?? '', 'utf8').toString('base64url')
    }
  }

  return {
    sub_categories: subCatsWithCounts.filter((sc) => sc.content_count > 0),
    items,
    next_cursor,
  }
}

// ─── Travel-only home feed sections (FEED-redesign 2026-04) ────────
// New section endpoints introduced for the Travel-only launch. Each
// returns FeedContentItem[] (or NearYouResult-shaped payloads where
// fallback context matters) so the existing ContentCard renderer on
// mobile keeps working unchanged.

const TRAVEL_FEED_SELECT =
  'id, type, title, vertical, pricing_model, price_paisa, like_count, comment_count, duration_minutes, starting_city_id, cover_image_url, user_id, published_at, facets, body, sub_category_id'

interface NearLocationParams {
  userId?: string | null
  cityId?: string | null
  lat?: number | null
  lng?: number | null
}

async function resolveLocation(
  params: NearLocationParams,
): Promise<{ cityId: string; cityName: string; lat: number; lng: number } | null> {
  if (params.cityId) {
    const loc = await getCityLocation(params.cityId)
    if (loc) return loc
  }
  if (params.userId) {
    const loc = await getUserLocation(params.userId)
    if (loc) return loc
  }
  return null
}

// ─── getHotNearYou ──────────────────────────────────────────────
// 7-day trending content within 100km, ranked by engagement
// (like_count + comment_count*3 — views/booking counters not yet on
// content table; see FEED-redesign plan for tracking columns).
export async function getHotNearYou(params: NearLocationParams): Promise<FeedContentItem[]> {
  const loc = await resolveLocation(params)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  let q = supabase
    .from('content')
    .select(TRAVEL_FEED_SELECT)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .gte('published_at', sevenDaysAgo)
    .order('like_count', { ascending: false })
    .order('comment_count', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(10)

  if (loc) q = q.eq('starting_city_id', loc.cityId)

  const { data, error } = await q
  if (error) throw new AppError('db-error', 500, 'Failed to load hot-near-you feed')
  if (!data?.length && loc) {
    // Soft fallback: drop the city filter so the rail isn't empty in low-content areas.
    const { data: fb, error: fbErr } = await supabase
      .from('content')
      .select(TRAVEL_FEED_SELECT)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .is('deleted_at', null)
      .gte('published_at', sevenDaysAgo)
      .order('like_count', { ascending: false })
      .limit(10)
    if (fbErr) throw new AppError('db-error', 500, 'Failed to load hot-near-you feed')
    return enrichItems((fb ?? []) as Array<{ user_id: string; [k: string]: unknown }>)
  }
  return enrichItems((data ?? []) as Array<{ user_id: string; [k: string]: unknown }>)
}

// ─── getTripsFromCity ───────────────────────────────────────────
// Itineraries + experiences whose starting_city_id matches the given
// city. "Trips starting from {city}" rail.
export async function getTripsFromCity(params: NearLocationParams): Promise<FeedContentItem[]> {
  const loc = await resolveLocation(params)
  if (!loc) return []

  const { data, error } = await supabase
    .from('content')
    .select(TRAVEL_FEED_SELECT)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .in('type', ['self_paced_itinerary', 'scheduled_experience'])
    .eq('starting_city_id', loc.cityId)
    .order('like_count', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(10)

  if (error) throw new AppError('db-error', 500, 'Failed to load trips-from-city feed')
  return enrichItems((data ?? []) as Array<{ user_id: string; [k: string]: unknown }>)
}

// ─── getThisWeekend ─────────────────────────────────────────────
// Events + experiences with start_at falling on the upcoming Sat/Sun
// (server-time approximation; IST shift is small enough not to matter).
function nextWeekendBounds(): { start: string; end: string } {
  const now = new Date()
  const dow = now.getUTCDay() // 0=Sun, 6=Sat
  const daysUntilSat = dow === 6 ? 0 : (6 - dow + 7) % 7
  const sat = new Date(now)
  sat.setUTCDate(now.getUTCDate() + daysUntilSat)
  sat.setUTCHours(0, 0, 0, 0)
  const sun = new Date(sat)
  sun.setUTCDate(sat.getUTCDate() + 1)
  sun.setUTCHours(23, 59, 59, 999)
  return { start: sat.toISOString(), end: sun.toISOString() }
}

export async function getThisWeekend(params: NearLocationParams): Promise<FeedContentItem[]> {
  const loc = await resolveLocation(params)
  const { start, end } = nextWeekendBounds()

  // Pull event & experience occurrence rows that intersect the window
  const [eventOcc, expOcc] = await Promise.all([
    supabase
      .from('event_occurrences')
      .select('content_id, start_at, city_id')
      .gte('start_at', start)
      .lte('start_at', end),
    supabase
      .from('scheduled_dates')
      .select('content_id, start_date, is_active')
      .eq('is_active', true)
      .gte('start_date', start.slice(0, 10))
      .lte('start_date', end.slice(0, 10)),
  ])

  if (eventOcc.error) throw new AppError('db-error', 500, 'Failed to load weekend events')
  if (expOcc.error) throw new AppError('db-error', 500, 'Failed to load weekend experiences')

  const contentIds = [
    ...new Set([
      ...((eventOcc.data ?? []) as Array<{ content_id: string }>).map((r) => r.content_id),
      ...((expOcc.data ?? []) as Array<{ content_id: string }>).map((r) => r.content_id),
    ]),
  ]
  if (!contentIds.length) return []

  let q = supabase
    .from('content')
    .select(TRAVEL_FEED_SELECT)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .in('id', contentIds)
    .order('published_at', { ascending: false })
    .limit(10)

  if (loc) q = q.eq('starting_city_id', loc.cityId)

  const { data, error } = await q
  if (error) throw new AppError('db-error', 500, 'Failed to load weekend feed')

  // If city scoping returned nothing, retry without the city filter so the
  // rail isn't blank when the only weekend content is in another nearby city.
  if (!data?.length && loc) {
    const { data: fb, error: fbErr } = await supabase
      .from('content')
      .select(TRAVEL_FEED_SELECT)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .is('deleted_at', null)
      .in('id', contentIds)
      .order('published_at', { ascending: false })
      .limit(10)
    if (fbErr) throw new AppError('db-error', 500, 'Failed to load weekend feed')
    return enrichItems((fb ?? []) as Array<{ user_id: string; [k: string]: unknown }>)
  }
  return enrichItems((data ?? []) as Array<{ user_id: string; [k: string]: unknown }>)
}

// ─── getUpcomingEvents ──────────────────────────────────────────
// Events with start_at in the next 30 days. Ordered chronologically.
export async function getUpcomingEvents(params: NearLocationParams): Promise<FeedContentItem[]> {
  const loc = await resolveLocation(params)
  const now = new Date().toISOString()
  const horizon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: occRows, error: occErr } = await supabase
    .from('event_occurrences')
    .select('content_id, start_at')
    .gte('start_at', now)
    .lte('start_at', horizon)
    .order('start_at', { ascending: true })
    .limit(50)

  if (occErr) throw new AppError('db-error', 500, 'Failed to load upcoming events')
  const ids = [...new Set((occRows ?? []).map((r) => r.content_id))]
  if (!ids.length) return []

  let q = supabase
    .from('content')
    .select(TRAVEL_FEED_SELECT)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .eq('type', 'event')
    .is('deleted_at', null)
    .in('id', ids)
    .limit(10)

  if (loc) q = q.eq('starting_city_id', loc.cityId)
  const { data, error } = await q
  if (error) throw new AppError('db-error', 500, 'Failed to load upcoming events')

  // Preserve the chronological order coming from event_occurrences
  const order = new Map((occRows ?? []).map((r, i) => [r.content_id, i]))
  const sorted = ((data ?? []) as Array<{ id: string; user_id: string; [k: string]: unknown }>).sort(
    (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999),
  )
  return enrichItems(sorted)
}

// ─── getDayTrips ────────────────────────────────────────────────
// Self-paced itineraries with duration_minutes ≤ 8h.
export async function getDayTrips(params: NearLocationParams): Promise<FeedContentItem[]> {
  const loc = await resolveLocation(params)
  let q = supabase
    .from('content')
    .select(TRAVEL_FEED_SELECT)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .eq('type', 'self_paced_itinerary')
    .lte('duration_minutes', 480)
    .order('like_count', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(10)

  if (loc) q = q.eq('starting_city_id', loc.cityId)
  const { data, error } = await q
  if (error) throw new AppError('db-error', 500, 'Failed to load day-trips feed')
  return enrichItems((data ?? []) as Array<{ user_id: string; [k: string]: unknown }>)
}

// ─── getWeekendGetaways ────────────────────────────────────────
// 2-day itineraries. Joins via itinerary_days to pick content where
// day_count = 2. Done in two queries because PostgREST doesn't expose
// HAVING through Supabase's REST builder cleanly.
export async function getWeekendGetaways(params: NearLocationParams): Promise<FeedContentItem[]> {
  const loc = await resolveLocation(params)

  const { data: dayRows, error: dayErr } = await supabase
    .from('itinerary_days')
    .select('content_id, day_number')
    .order('content_id')

  if (dayErr) throw new AppError('db-error', 500, 'Failed to load itinerary day counts')

  // Group by content_id, keep ones with exactly 2 days
  const counts = new Map<string, number>()
  for (const r of (dayRows ?? []) as Array<{ content_id: string }>) {
    counts.set(r.content_id, (counts.get(r.content_id) ?? 0) + 1)
  }
  const twoDayIds = [...counts.entries()].filter(([, c]) => c === 2).map(([id]) => id)
  if (!twoDayIds.length) return []

  let q = supabase
    .from('content')
    .select(TRAVEL_FEED_SELECT)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .eq('type', 'self_paced_itinerary')
    .in('id', twoDayIds)
    .order('like_count', { ascending: false })
    .limit(10)

  if (loc) q = q.eq('starting_city_id', loc.cityId)
  const { data, error } = await q
  if (error) throw new AppError('db-error', 500, 'Failed to load weekend-getaways feed')
  return enrichItems((data ?? []) as Array<{ user_id: string; [k: string]: unknown }>)
}

// ─── getPostsFeed ───────────────────────────────────────────────
// Posts-only feed used by:
//   • Stories rail on home (limit=8, scope=near)
//   • Posts chip vertical feed at /feed/posts (paginated)
//   • Compound filter: scope + city + sub_category_id
// Cursor pagination on published_at DESC (base64url encoded ISO date).
export interface PostsFeedResult {
  items: FeedContentItem[]
  next_cursor: string | null
}

export async function getPostsFeed(params: {
  scope: 'near' | 'following'
  userId: string | null
  cityId?: string | null
  subCategoryId?: string | null
  cursor?: string | null
  limit?: number | null
}): Promise<PostsFeedResult> {
  const limit = Math.min(Math.max(params.limit ?? 10, 1), 30)

  // Following scope requires a signed-in user with at least one follow
  if (params.scope === 'following') {
    if (!params.userId) return { items: [], next_cursor: null }
    const { data: follows, error: followErr } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', params.userId)
    if (followErr) throw new AppError('db-error', 500, 'Failed to load follows')
    const followingIds = (follows ?? []).map((r) => r.following_id as string)
    if (!followingIds.length) return { items: [], next_cursor: null }

    let q = supabase
      .from('content')
      .select(TRAVEL_FEED_SELECT)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .eq('type', 'post')
      .is('deleted_at', null)
      .in('user_id', followingIds)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (params.subCategoryId) q = q.eq('sub_category_id', params.subCategoryId)
    if (params.cursor) {
      const decoded = Buffer.from(params.cursor, 'base64url').toString('utf8')
      q = q.lt('published_at', decoded)
    }

    const { data, error } = await q
    if (error) throw new AppError('db-error', 500, 'Failed to load posts feed')
    return paginatePostsResult(data ?? [], limit)
  }

  // Near scope — city-bounded posts
  const loc = await resolveLocation({ userId: params.userId, cityId: params.cityId ?? null })

  let q = supabase
    .from('content')
    .select(TRAVEL_FEED_SELECT)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .eq('type', 'post')
    .is('deleted_at', null)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (loc) q = q.eq('starting_city_id', loc.cityId)
  if (params.subCategoryId) q = q.eq('sub_category_id', params.subCategoryId)
  if (params.cursor) {
    const decoded = Buffer.from(params.cursor, 'base64url').toString('utf8')
    q = q.lt('published_at', decoded)
  }

  const { data, error } = await q
  if (error) throw new AppError('db-error', 500, 'Failed to load posts feed')
  return paginatePostsResult(data ?? [], limit)
}

async function paginatePostsResult(
  rows: Array<Record<string, unknown>>,
  limit: number,
): Promise<PostsFeedResult> {
  const items = await enrichItems(rows as Array<{ user_id: string; [k: string]: unknown }>)
  let next_cursor: string | null = null
  if (rows.length === limit) {
    const last = rows.at(-1)
    if (last?.published_at) {
      next_cursor = Buffer.from(String(last.published_at), 'utf8').toString('base64url')
    }
  }
  return { items, next_cursor }
}

// ─── getEditorsPicks ─────────────────────────────────────────────
// DISC-FR-039: content where featured = true, sorted by recency.
// Returns empty list (never throws) so the section self-hides on empty.

export async function getEditorsPicks(): Promise<FeedContentItem[]> {
  const { data, error } = await supabase
    .from('content')
    .select(
      'id, type, title, vertical, pricing_model, price_paisa, like_count, comment_count, duration_minutes, starting_city_id, cover_image_url, published_at, body, facets, user_id',
    )
    .eq('status', 'published')
    .eq('featured', true)
    .order('published_at', { ascending: false })
    .limit(10)

  if (error) throw new AppError('db-error', 500, 'Failed to load editor picks')
  return enrichItems((data ?? []) as Array<{ user_id: string; [k: string]: unknown }>)
}
