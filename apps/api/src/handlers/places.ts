import type { Context } from 'hono'
import { autocomplete, getPlaceDetails } from '../services/places.service.js'
import type { PlacesAutocompleteInput } from '@creatorhub/shared'

/**
 * GET /api/v1/places/autocomplete
 * Proxy Google Places Autocomplete API (biased to India).
 */
export async function handleAutocomplete(c: Context): Promise<Response> {
  const query = c.get('validatedQuery') as PlacesAutocompleteInput

  const predictions = await autocomplete(query.input, query.lat, query.lng)

  return c.json({ success: true, data: predictions })
}

/**
 * GET /api/v1/places/:placeId
 * Proxy Google Places Details API (cached).
 */
export async function handlePlaceDetails(c: Context): Promise<Response> {
  const placeId = c.req.param('placeId')!

  const details = await getPlaceDetails(placeId)

  return c.json({ success: true, data: details })
}
