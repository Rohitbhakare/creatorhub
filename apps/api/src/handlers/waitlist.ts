/**
 * Waitlist handlers — thin layer: validate → service → respond.
 *
 *   POST   /api/v1/waitlist        — join (idempotent)
 *   DELETE /api/v1/waitlist/:id    — leave
 *   GET    /api/v1/waitlist/me     — list my entries
 */

import type { Context } from 'hono'
import { AppError } from '../errors/AppError.js'
import {
  joinWaitlist,
  leaveWaitlist,
  listMyWaitlist,
  type WaitlistTarget,
} from '../services/waitlist.service.js'

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

export async function handleJoinWaitlist(c: Context): Promise<Response> {
  const userId = c.get('userId') as string

  let body: {
    content_id?: unknown
    scheduled_date_id?: unknown
    event_occurrence_id?: unknown
  }
  try {
    body = (await c.req.json()) as typeof body
  } catch {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  }

  if (!isUuid(body.content_id)) {
    throw new AppError('validation-failed', 400, 'content_id is required', [
      { field: 'content_id', message: 'content_id is required (uuid)', code: 'required' },
    ])
  }

  const hasScheduled = isUuid(body.scheduled_date_id)
  const hasOccurrence = isUuid(body.event_occurrence_id)

  if (hasScheduled === hasOccurrence) {
    throw new AppError(
      'validation-failed',
      400,
      'Provide exactly one of scheduled_date_id or event_occurrence_id',
    )
  }

  const target: WaitlistTarget = hasScheduled
    ? { kind: 'scheduled_date', scheduledDateId: body.scheduled_date_id as string }
    : { kind: 'event_occurrence', eventOccurrenceId: body.event_occurrence_id as string }

  const entry = await joinWaitlist(userId, body.content_id, target)
  return c.json({ success: true, data: { entry } }, 201)
}

export async function handleLeaveWaitlist(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const entryId = c.req.param('id')
  if (!entryId) throw new AppError('validation-failed', 400, 'entry id required')
  await leaveWaitlist(entryId, userId)
  return c.json({ success: true, data: { left: true } })
}

export async function handleListMyWaitlist(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const entries = await listMyWaitlist(userId)
  return c.json({ success: true, data: { entries } })
}
