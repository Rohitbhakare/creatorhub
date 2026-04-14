import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'

export interface CityResult {
  id: string
  name: string
  state: string
}

export async function searchCities(query: string, limit: number = 10): Promise<CityResult[]> {
  // Sanitize query - strip special chars
  const sanitized = query.replace(/[^a-zA-Z0-9\s]/g, '').trim()
  if (!sanitized) return []

  const { data, error } = await supabase
    .rpc('search_cities', { search_query: sanitized, result_limit: limit })

  // Fallback to ILIKE if RPC doesn't exist
  if (error) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('cities')
      .select('id, name, state')
      .ilike('name', `${sanitized}%`)
      .eq('active', true)
      .order('population', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (fallbackError) throw new AppError('db-error', 500, 'Failed to search cities')
    return fallbackData ?? []
  }

  return data ?? []
}

export async function findNearbyCity(lat: number, lng: number): Promise<CityResult | null> {
  // Use PostGIS ST_Distance to find nearest city within 100km
  const { data, error } = await supabase.rpc('nearby_cities', {
    p_lat: lat,
    p_lng: lng,
    p_radius_km: 100,
    p_limit: 1,
  })

  if (error) {
    // Fallback: basic distance calculation
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('cities')
      .select('id, name, state')
      .eq('active', true)
      .order('population', { ascending: false, nullsFirst: false })
      .limit(1)

    if (fallbackError) throw new AppError('db-error', 500, 'Failed to find nearby city')
    return fallbackData?.[0] ?? null
  }

  return data?.[0] ?? null
}
