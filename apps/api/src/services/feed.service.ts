import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'

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

async function attachCreators(
  items: Array<{ user_id: string; [k: string]: unknown }>,
): Promise<FeedContentItem[]> {
  const userIds = [...new Set(items.map((i) => i.user_id as string))]
  if (!userIds.length) return []

  const { data: creators, error } = await supabase
    .from('users')
    .select('id, display_name, username, avatar_url')
    .in('id', userIds)

  if (error) throw new AppError('db-error', 500, 'Failed to load creator data')

  const byId = Object.fromEntries((creators ?? []).map((c) => [c.id, c]))

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
    creator: byId[item.user_id as string] ?? null,
  }))
}

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
      'id, type, title, vertical, pricing_model, price_paisa, like_count, comment_count, duration_minutes, starting_city_id, cover_image_url, user_id, published_at',
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

  const { data, error } = await supabase.rpc('feed_near_you', {
    p_city_id: location.cityId,
    p_lat: location.lat,
    p_lng: location.lng,
    p_limit: 20,
  })

  if (error) throw new AppError('db-error', 500, 'Failed to load near-you section')

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
): Promise<FeedContentItem[]> {
  const { data, error } = await supabase
    .from('content')
    .select('id, type, title, vertical, pricing_model, price_paisa, like_count, comment_count, duration_minutes, starting_city_id, cover_image_url, user_id, published_at')
    .eq('status', 'published')
    .eq('visibility', 'public')
    .eq('vertical', vertical)
    .is('deleted_at', null)
    .order('like_count', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(10)

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

  const [followedRes, verticalsRes] = await Promise.all([
    supabase
      .from('content')
      .select(
        'id, type, title, vertical, pricing_model, price_paisa, like_count, comment_count, duration_minutes, starting_city_id, cover_image_url, user_id, published_at, ' +
          'follows!inner(follower_id, following_id)',
      )
      .eq('status', 'published')
      .eq('visibility', 'public')
      .is('deleted_at', null)
      .eq('follows.follower_id', userId)
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
        'id, type, title, vertical, pricing_model, price_paisa, like_count, comment_count, duration_minutes, starting_city_id, cover_image_url, user_id, published_at',
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
  const { data, error } = await supabase
    .from('content')
    .select(
      'id, type, title, vertical, pricing_model, price_paisa, like_count, comment_count, duration_minutes, starting_city_id, cover_image_url, user_id, ' +
        'follows!inner(follower_id, following_id)',
    )
    .eq('status', 'published')
    .eq('visibility', 'public')
    .is('deleted_at', null)
    .eq('follows.follower_id', userId)
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
