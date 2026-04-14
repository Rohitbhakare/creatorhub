import { Hono } from 'hono'
import { authenticate, optionalAuthenticate } from '../middleware/authenticate.js'
import {
  handleNearYouSection,
  handleVerticalSection,
  handleDiscoverSection,
  handleUpdateUserCity,
} from '../handlers/feed.js'

const feedRoutes = new Hono()

// Feed sections — independent endpoints so each section fails gracefully
feedRoutes.get('/near-you', authenticate, handleNearYouSection)
feedRoutes.get('/vertical/:vertical', optionalAuthenticate, handleVerticalSection)
feedRoutes.get('/discover', optionalAuthenticate, handleDiscoverSection)

export default feedRoutes
