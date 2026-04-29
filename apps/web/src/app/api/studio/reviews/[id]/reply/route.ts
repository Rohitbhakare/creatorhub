import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiFetch } from '@/lib/api-client'
import { getSession } from '@/lib/session'
import { logger } from '@/lib/logger'
import { AppError } from '@/lib/errors'

const Schema = z.object({ reply: z.string().min(4).max(2000) })

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const log = logger.child({ route: 'api/studio/review-reply' })
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { type: 'unauthorized', status: 401, detail: 'Sign in' },
      { status: 401 },
    )
  }
  const { id } = await ctx.params
  let body
  try {
    body = Schema.parse(await req.json())
  } catch {
    return NextResponse.json(
      { type: 'bad-request', status: 400, detail: 'Reply must be 4–2000 chars' },
      { status: 400 },
    )
  }
  try {
    await apiFetch(`/api/v1/reviews/${id}/reply`, {
      method: 'POST',
      body: { reply: body.reply },
      retries: 1,
    })
    log.info({ userId: session.userId, reviewId: id }, 'review-reply:ok')
    return NextResponse.json({ success: true })
  } catch (err) {
    const e = err instanceof AppError ? err : AppError.upstream()
    log.error({ err: e.toJSON() }, 'review-reply:failed')
    return NextResponse.json(e.toJSON(), { status: e.status })
  }
}
