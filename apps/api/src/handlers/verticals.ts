import type { Context } from 'hono'
import { getVerticalsWithCounts, saveUserVerticals } from '../services/vertical.service.js'

export async function handleGetVerticals(c: Context): Promise<Response> {
  const verticals = await getVerticalsWithCounts()
  return c.json({ success: true, data: verticals })
}

export async function handleSaveVerticals(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const body = c.get('validatedBody') as { verticals: string[] }

  await saveUserVerticals(userId, body.verticals)
  return c.json({ success: true, data: { saved: body.verticals.length } })
}
