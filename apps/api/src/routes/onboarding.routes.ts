import { Hono } from 'hono'
import {
  handleGetSuggestedCreators,
  handleFollowCreator,
  handleUnfollowCreator,
  handleSetCity,
  handleSaveVerticals,
  handleCompleteOnboarding,
} from '../handlers/onboarding.js'
import { authenticate } from '../middleware/authenticate.js'
import { validateBody } from '../middleware/validate.js'
import { z } from 'zod'

const onboardingRoutes = new Hono()

// All onboarding endpoints require auth
onboardingRoutes.use('*', authenticate)

// City
onboardingRoutes.put(
  '/city',
  validateBody(z.object({ city_id: z.string().min(1) })),
  handleSetCity,
)

// Verticals
onboardingRoutes.put(
  '/verticals',
  validateBody(z.object({
    verticals: z.array(z.string()).min(3, 'At least 3 verticals required'),
  })),
  handleSaveVerticals,
)

// Suggested creators
onboardingRoutes.get('/suggested-creators', handleGetSuggestedCreators)

// Follow/unfollow
onboardingRoutes.post(
  '/follow',
  validateBody(z.object({ creator_id: z.string().uuid() })),
  handleFollowCreator,
)
onboardingRoutes.delete('/follow/:creatorId', handleUnfollowCreator)

// Complete
onboardingRoutes.post('/complete', handleCompleteOnboarding)

export default onboardingRoutes
