import { Hono } from 'hono'
import { optionalAuthenticate } from '../middleware/authenticate.js'
import {
  handleNearYouSection,
  handleVerticalSection,
  handleDiscoverSection,
  handleForYouSection,
  handleFollowingSection,
  handleHeroSection,
  handleUpdateUserCity,
  handleEditorsPicks,
} from '../handlers/feed.js'

const feedRoutes = new Hono()

// Feed sections — independent endpoints so each section fails gracefully.
// All use optionalAuthenticate so guests (IAM-FR-010) can browse the home feed.
feedRoutes.get('/near-you', optionalAuthenticate, handleNearYouSection)
feedRoutes.get('/for-you', optionalAuthenticate, handleForYouSection)
feedRoutes.get('/following', optionalAuthenticate, handleFollowingSection)
feedRoutes.get('/hero', optionalAuthenticate, handleHeroSection)
feedRoutes.get('/vertical/:vertical', optionalAuthenticate, handleVerticalSection)
feedRoutes.get('/discover', optionalAuthenticate, handleDiscoverSection)
feedRoutes.get('/editors-picks', optionalAuthenticate, handleEditorsPicks)

export default feedRoutes
