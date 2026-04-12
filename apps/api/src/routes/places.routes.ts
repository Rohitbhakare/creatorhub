import { Hono } from 'hono'
import { handleAutocomplete, handlePlaceDetails } from '../handlers/places.js'
import { authenticate } from '../middleware/authenticate.js'
import { validateQuery } from '../middleware/validate.js'
import { placesAutocompleteSchema } from '@creatorhub/shared'

const placesRoutes = new Hono()

// All places endpoints require auth
placesRoutes.use('*', authenticate)

// GET /api/v1/places/autocomplete
placesRoutes.get('/autocomplete', validateQuery(placesAutocompleteSchema), handleAutocomplete)

// GET /api/v1/places/:placeId
placesRoutes.get('/:placeId', handlePlaceDetails)

export default placesRoutes
