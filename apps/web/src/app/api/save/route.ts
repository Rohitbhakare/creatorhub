import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiFetch } from '@/lib/api-client'
import { getSession } from '@/lib/session'
import { logger } from '@/lib/logger'
import { AppError } from '@/lib/errors'

const Schema = z.object({
  contentId: z.string().min(1).max(64),
  save: z.boolean(),
})

export async function POST(req: NextRequest) {
  const log = logger.child({ route: 'api/save' })
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ type: 'unauthorized', status: 401, detail: 'Sign in' }, { status: 401 })
  }

  let parsed
  try {
    parsed = Schema.parse(await req.json())
  } catch (err) {
    log.warn({ err: String(err) }, 'save:bad-input')
    return NextResponse.json(
      { type: 'bad-request', status: 400, detail: 'Invalid input' },
      { status: 400 },
    )
  }

  try {
    if (parsed.save) {
      await apiFetch(`/api/v1/social/saves`, {
        method: 'POST',
        body: { content_id: parsed.contentId },
        retries: 1,
      })
    } else {
      await apiFetch(`/api/v1/social/saves/${parsed.contentId}`, {
        method: 'DELETE',
        retries: 1,
      })
    }
    log.info({ userId: session.userId, contentId: parsed.contentId, saved: parsed.save }, 'save:ok')
    return NextResponse.json({ success: true })
  } catch (err) {
    const e = err instanceof AppError ? err : AppError.upstream()
    log.error({ err: e.toJSON() }, 'save:failed')
    return NextResponse.json(e.toJSON(), { status: e.status })
  }
}
