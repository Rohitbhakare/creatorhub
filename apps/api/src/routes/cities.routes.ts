import { Hono } from 'hono'
import { handleSearchCities, handleNearbyCity } from '../handlers/cities.js'

const citiesRoutes = new Hono()

// Public endpoints — no auth required
citiesRoutes.get('/', handleSearchCities)
citiesRoutes.get('/nearby', handleNearbyCity)

export default citiesRoutes
