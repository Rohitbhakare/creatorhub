import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiFetch } from '@/lib/api-client'
import { getSession } from '@/lib/session'
import { logger } from '@/lib/logger'
import { AppError } from '@/lib/errors'

const Schema = z.object({
  contentId: z.string().min(1).max(64),
  like: z.boolean(),
})

export async function POST(req: NextRequest) {
  const log = logger.child({ route: 'api/social/like' })
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
    if (body.like) {
      await apiFetch(`/api/v1/social/likes`, {
        method: 'POST',
        body: { content_id: body.contentId },
        retries: 1,
      })
    } else {
      await apiFetch(`/api/v1/social/likes/${body.contentId}`, {
        method: 'DELETE',
        retries: 1,
      })
    }
    log.info(
      { userId: session.userId, contentId: body.contentId, like: body.like },
      'like:ok',
    )
    return NextResponse.json({ success: true })
  } catch (err) {
    const e = err instanceof AppError ? err : AppError.upstream()
    log.error({ err: e.toJSON() }, 'like:failed')
    return NextResponse.json(e.toJSON(), { status: e.status })
  }
}
