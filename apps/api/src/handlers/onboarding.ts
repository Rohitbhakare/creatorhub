import type { Context } from 'hono'
import {
  getSuggestedCreators,
  followCreator,
  unfollowCreator,
  completeOnboarding,
  setUserCity,
} from '../services/onboarding.service.js'
import { saveUserVerticals } from '../services/vertical.service.js'
import { AppError } from '../errors/AppError.js'

export async function handleGetSuggestedCreators(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20', 10) || 20, 50)

  const creators = await getSuggestedCreators(userId, limit)
  return c.json({ success: true, data: creators })
}

export async function handleFollowCreator(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const body = c.get('validatedBody') as { creator_id: string }

  await followCreator(userId, body.creator_id)
  return c.json({ success: true, data: { followed: true } }, 201)
}

export async function handleUnfollowCreator(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const creatorId = c.req.param('creatorId')

  if (!creatorId) {
    throw new AppError('validation-failed', 400, 'creatorId param is required')
  }

  await unfollowCreator(userId, creatorId)
  return c.body(null, 204)
}

export async function handleSetCity(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const body = c.get('validatedBody') as { city_id: string }

  await setUserCity(userId, body.city_id)
  return c.json({ success: true, data: { city_id: body.city_id } })
}

export async function handleSaveVerticals(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const body = c.get('validatedBody') as { verticals: string[] }

  await saveUserVerticals(userId, body.verticals)
  return c.json({ success: true, data: { saved: body.verticals.length } })
}

export async function handleCompleteOnboarding(c: Context): Promise<Response> {
  const userId = c.get('userId') as string

  await completeOnboarding(userId)
  return c.json({ success: true, data: { completed: true } })
}
