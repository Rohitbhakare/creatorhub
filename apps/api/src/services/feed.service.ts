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
  starting_city_id: string | null
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
    like_count: item.like_count as number,
    starting_city_id: (item.starting_city_id ?? null) as string | null,
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

// ─── getNearYouSection ───────────────────────────────────────────

export async function getNearYouSection(userId: string): Promise<NearYouResult> {
  const location = await getUserLocation(userId)

  if (!location) {
    return { items: [], fallback_level: 0, label: 'Near you', fallback_cities: [] }
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

  const fallbackLevel = rows[0].fallback_level

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
    .select('id, type, title, vertical, pricing_model, price_paisa, like_count, starting_city_id, user_id')
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
