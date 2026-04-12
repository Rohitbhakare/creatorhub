import type { Context } from 'hono'
import { searchCities, findNearbyCity } from '../services/city.service.js'
import { AppError } from '../errors/AppError.js'

export async function handleSearchCities(c: Context): Promise<Response> {
  const q = c.req.query('q') ?? ''
  const limit = Math.min(parseInt(c.req.query('limit') ?? '10', 10) || 10, 50)

  const cities = await searchCities(q, limit)
  return c.json({ success: true, data: cities })
}

export async function handleNearbyCity(c: Context): Promise<Response> {
  const lat = parseFloat(c.req.query('lat') ?? '')
  const lng = parseFloat(c.req.query('lng') ?? '')

  if (isNaN(lat) || isNaN(lng)) {
    throw new AppError('validation-failed', 400, 'lat and lng query params are required')
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw new AppError('validation-failed', 400, 'Invalid coordinates')
  }

  const city = await findNearbyCity(lat, lng)
  if (!city) {
    throw new AppError('not-found', 404, 'No city found within 100km of your location')
  }

  return c.json({ success: true, data: city })
}
