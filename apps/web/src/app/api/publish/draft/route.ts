import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiFetch } from '@/lib/api-client'
import { getSession } from '@/lib/session'
import { logger } from '@/lib/logger'
import { AppError } from '@/lib/errors'

const Schema = z.object({
  draftId: z.string().optional(),
  type: z.enum(['post', 'itinerary', 'experience', 'event']),
  title: z.string().max(160).optional(),
  summary: z.string().max(400).optional(),
  body: z.string().max(50_000).optional(),
  coverUrl: z.string().url().optional(),
  priceInPaisa: z.number().int().min(0).optional(),
  isFree: z.boolean().optional(),
  city: z.string().max(80).optional(),
  durationDays: z.number().int().min(1).max(60).optional(),
  spots: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        description: z.string().max(400).optional(),
        dayNumber: z.number().int().min(1).max(60),
        orderIndex: z.number().int().min(0),
        lat: z.number().optional(),
        lng: z.number().optional(),
      }),
    )
    .max(60)
    .optional(),
  publish: z.boolean().optional(),
})

/**
 * Save / publish a content draft.
 *
 * - PATCH-style: partial body updates the draft
 * - publish=true flips status from draft → published (if validation passes server-side)
 * - Returns { draftId } so the autosave loop can keep updating the same draft
 */
export async function POST(req: NextRequest) {
  const log = logger.child({ route: 'api/publish/draft' })
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { type: 'unauthorized', status: 401, detail: 'Sign in' },
      { status: 401 },
    )
  }

  let body
  try {
    body = Schema.parse(await req.json())
  } catch (err) {
    log.warn({ err: String(err) }, 'publish:bad-input')
    return NextResponse.json(
      { type: 'bad-request', status: 400, detail: 'Invalid input' },
      { status: 400 },
    )
  }

  const { draftId, publish, ...payload } = body

  try {
    const data = await apiFetch<{ id: string; status: string }>(
      draftId ? `/api/v1/content/${draftId}` : `/api/v1/content`,
      {
        method: draftId ? 'PUT' : 'POST',
        body: { ...payload, publish: publish === true },
        retries: 0,
        ...(draftId
          ? {}
          : { idempotencyKey: `new-content:${session.userId}:${String(Date.now())}` }),
      },
    )
    log.info(
      { userId: session.userId, draftId: data.id, publish, status: data.status },
      'publish:ok',
    )
    return NextResponse.json({ draftId: data.id, status: data.status })
  } catch (err) {
    const e = err instanceof AppError ? err : AppError.upstream()
    log.error({ err: e.toJSON() }, 'publish:failed')
    return NextResponse.json(e.toJSON(), { status: e.status })
  }
}
