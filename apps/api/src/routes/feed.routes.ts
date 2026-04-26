import { Hono } from 'hono'
import { optionalAuthenticate } from '../middleware/authenticate.js'
import {
  handleNearYouSection,
  handleVerticalSection,
  handleDiscoverSection,
  handleForYouSection,
  handleFollowingSection,
  handleHeroSection,
  handleEditorsPicks,
  handleHotNearYou,
  handleTripsFromCity,
  handleThisWeekend,
  handleHappeningThisWeekend,
  handleUpcomingEvents,
  handleDayTrips,
  handleWeekendGetaways,
  handlePostsFeed,
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

// Travel-only home feed sections (FEED-redesign 2026-04)
feedRoutes.get('/hot-near-you', optionalAuthenticate, handleHotNearYou)
feedRoutes.get('/trips-from-city', optionalAuthenticate, handleTripsFromCity)
feedRoutes.get('/this-weekend', optionalAuthenticate, handleThisWeekend)
feedRoutes.get('/happening-this-weekend', optionalAuthenticate, handleHappeningThisWeekend)
feedRoutes.get('/upcoming-events', optionalAuthenticate, handleUpcomingEvents)
feedRoutes.get('/day-trips', optionalAuthenticate, handleDayTrips)
feedRoutes.get('/weekend-getaways', optionalAuthenticate, handleWeekendGetaways)
feedRoutes.get('/posts', optionalAuthenticate, handlePostsFeed)

export default feedRoutes
