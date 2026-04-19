/**
 * Creator payouts + linked account endpoints (E2.12 T9).
 *
 *   GET /creators/me/payouts         — paginated list + 30-day summary
 *   GET /creators/me/linked-account  — linked account status + masked bank info
 */

import type { Context } from 'hono'
import { listPayoutsQuerySchema, type PayoutStatus } from '@creatorhub/shared'
import { AppError } from '../errors/AppError.js'
import {
  listPayoutsForCreator,
  getPayoutSummary,
} from '../services/payout.service.js'
import { getLinkedAccountForUser } from '../services/linked-account.service.js'

export async function handleListMyPayouts(c: Context): Promise<Response> {
  const userId = c.get('userId') as string

  const parsed = listPayoutsQuerySchema.safeParse({
    status: c.req.query('status'),
    limit: c.req.query('limit'),
    cursor: c.req.query('cursor'),
  })

  if (!parsed.success) {
    throw new AppError('validation-failed', 400, 'Invalid query parameters')
  }

  const filter: { status?: PayoutStatus } = {}
  if (parsed.data.status) filter.status = parsed.data.status

  const pagination: { limit: number; cursor?: string } = { limit: parsed.data.limit }
  if (parsed.data.cursor) pagination.cursor = parsed.data.cursor

  const [{ items, nextCursor }, summary] = await Promise.all([
    listPayoutsForCreator(userId, filter, pagination),
    getPayoutSummary(userId),
  ])

  return c.json({
    success: true,
    data: {
      items,
      next_cursor: nextCursor,
      summary,
    },
  })
}

export async function handleGetMyLinkedAccount(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const account = await getLinkedAccountForUser(userId)
  return c.json({ success: true, data: account })
}
