import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiFetch } from '@/lib/api-client'
import { getSession } from '@/lib/session'
import { logger } from '@/lib/logger'
import { AppError } from '@/lib/errors'

const Schema = z.object({
  creatorId: z.string().min(1).max(64),
  follow: z.boolean(),
})

export async function POST(req: NextRequest) {
  const log = logger.child({ route: 'api/social/follow' })
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
  } catch {
    return NextResponse.json(
      { type: 'bad-request', status: 400, detail: 'Invalid input' },
      { status: 400 },
    )
  }
  try {
    if (body.follow) {
      await apiFetch(`/api/v1/social/follows`, {
        method: 'POST',
        body: { creator_id: body.creatorId },
        retries: 1,
      })
    } else {
      await apiFetch(`/api/v1/social/follows/${body.creatorId}`, {
        method: 'DELETE',
        retries: 1,
      })
    }
    log.info(
      { userId: session.userId, creatorId: body.creatorId, follow: body.follow },
      'follow:ok',
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    const e = err instanceof AppError ? err : AppError.upstream()
    log.error({ err: e.toJSON() }, 'follow:failed')
    return NextResponse.json(e.toJSON(), { status: e.status })
  }
}
