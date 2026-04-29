import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiFetch } from '@/lib/api-client'
import { getSession } from '@/lib/session'
import { logger } from '@/lib/logger'
import { AppError } from '@/lib/errors'

const Schema = z.object({
  city_id: z.string().min(1).max(64),
})

export async function PUT(req: NextRequest) {
  const log = logger.child({ route: 'api/onboarding/city' })
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
    await apiFetch(`/api/v1/onboarding/city`, {
      method: 'PUT',
      body: { city_id: body.city_id },
      retries: 1,
    })
    log.info({ userId: session.userId, cityId: body.city_id }, 'city:ok')
    return NextResponse.json({ success: true })
  } catch (err) {
    const e = err instanceof AppError ? err : AppError.upstream()
    log.error({ err: e.toJSON() }, 'city:failed')
    return NextResponse.json(e.toJSON(), { status: e.status })
  }
}
