import { AppError } from '../errors/AppError.js'
import type { PlacePrediction, PlaceDetails } from '@creatorhub/shared'

// TODO: move to DB cache (place_cache table) in V1
const placeDetailsCache = new Map<string, PlaceDetails>()

const GOOGLE_PLACES_BASE = 'https://maps.googleapis.com/maps/api/place'

function getApiKey(): string {
  const key = process.env['GOOGLE_PLACES_API_KEY']
  if (!key) {
    throw new AppError('internal', 500, 'Google Places API key not configured')
  }
  return key
}

// ─── autocomplete ───────────────────────────────────────────────

export async function autocomplete(
  input: string,
  lat?: number,
  lng?: number,
): Promise<PlacePrediction[]> {
  const apiKey = getApiKey()

  const params = new URLSearchParams({
    input,
    key: apiKey,
    components: 'country:in', // Bias to India
    types: '(regions)',
  })

  if (lat != null && lng != null) {
    params.set('location', `${lat.toString()},${lng.toString()}`)
    params.set('radius', '50000') // 50km bias radius
  }

  const response = await fetch(`${GOOGLE_PLACES_BASE}/autocomplete/json?${params.toString()}`)

  if (!response.ok) {
    throw new AppError('internal', 500, 'Google Places API request failed')
  }

  const data = (await response.json()) as {
    status: string
    predictions?: Array<{
      place_id: string
      description: string
      structured_formatting: {
        main_text: string
        secondary_text: string
      }
    }>
  }

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new AppError('internal', 500, `Google Places API error: ${data.status}`)
  }

  return (data.predictions ?? []).map((p) => ({
    place_id: p.place_id,
    description: p.description,
    main_text: p.structured_formatting.main_text,
    secondary_text: p.structured_formatting.secondary_text,
  }))
}

// ─── getPlaceDetails ────────────────────────────────────────────

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  // Check in-memory cache first
  const cached = placeDetailsCache.get(placeId)
  if (cached) {
    return cached
  }

  const apiKey = getApiKey()

  const params = new URLSearchParams({
    place_id: placeId,
    key: apiKey,
    fields: 'place_id,name,formatted_address,geometry,photo,type',
  })

  const response = await fetch(`${GOOGLE_PLACES_BASE}/details/json?${params.toString()}`)

  if (!response.ok) {
    throw new AppError('internal', 500, 'Google Places API request failed')
  }

  const data = (await response.json()) as {
    status: string
    result?: {
      place_id: string
      name: string
      formatted_address: string
      geometry: {
        location: { lat: number; lng: number }
      }
      photos?: Array<{ photo_reference: string }>
      types?: string[]
    }
  }

  if (data.status !== 'OK' || !data.result) {
    throw new AppError('not-found', 404, 'Place not found')
  }

  const r = data.result
  let photoUrl: string | null = null

  if (r.photos && r.photos.length > 0 && r.photos[0]) {
    const photoRef = r.photos[0].photo_reference
    photoUrl = `${GOOGLE_PLACES_BASE}/photo?maxwidth=800&photo_reference=${photoRef}&key=${apiKey}`
  }

  const details: PlaceDetails = {
    place_id: r.place_id,
    name: r.name,
    formatted_address: r.formatted_address,
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
    photo_url: photoUrl,
    types: r.types ?? [],
  }

  // Store in cache
  placeDetailsCache.set(placeId, details)

  return details
}
