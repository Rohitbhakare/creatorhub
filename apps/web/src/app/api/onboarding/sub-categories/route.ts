import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiFetch } from '@/lib/api-client'
import { getSession } from '@/lib/session'
import { logger } from '@/lib/logger'
import { AppError } from '@/lib/errors'

const Schema = z.object({
  sub_categories: z.array(z.string().min(1).max(40)).min(2).max(8),
})

export async function PUT(req: NextRequest) {
  const log = logger.child({ route: 'api/onboarding/sub-categories' })
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
    log.warn({ err: String(err) }, 'sub-cats:bad-input')
    return NextResponse.json(
      { type: 'bad-request', status: 400, detail: 'Pick at least 2' },
      { status: 400 },
    )
  }

  try {
    await apiFetch(`/api/v1/users/me/travel-sub-categories`, {
      method: 'PUT',
      body: { sub_categories: body.sub_categories },
      retries: 1,
    })
    log.info({ userId: session.userId, count: body.sub_categories.length }, 'sub-cats:ok')
    return NextResponse.json({ success: true })
  } catch (err) {
    const e = err instanceof AppError ? err : AppError.upstream()
    log.error({ err: e.toJSON() }, 'sub-cats:failed')
    return NextResponse.json(e.toJSON(), { status: e.status })
  }
}
