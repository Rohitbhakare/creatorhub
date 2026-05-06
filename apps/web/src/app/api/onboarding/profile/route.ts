import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiFetch } from '@/lib/api-client'
import { getSession } from '@/lib/session'
import { logger } from '@/lib/logger'
import { AppError } from '@/lib/errors'

/**
 * Round-6 audit C1: backstop endpoint for the new /onboarding/profile
 * step. PUTs display_name + username to the upstream `/api/v1/users/me`
 * so the JWT and DB pick up the values before the user reaches Studio.
 *
 * Validation mirrors the existing AccountTab inputs in studio settings:
 * - display_name: 2–60 chars, trimmed.
 * - username: 3–20 chars, lowercase letters + numbers only. Server is
 *   the source of truth on uniqueness; we let upstream 409.
 */

const Schema = z.object({
  display_name: z.string().trim().min(2).max(60),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(20)
    .regex(/^[a-z0-9]+$/, 'lowercase letters and numbers only'),
})

export async function PUT(req: NextRequest) {
  const log = logger.child({ route: 'api/onboarding/profile' })
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
    log.warn({ err: String(err) }, 'profile:bad-input')
    return NextResponse.json(
      {
        type: 'bad-request',
        status: 400,
        detail: 'Pick a 2-60 char name and a 3-20 char handle (letters + numbers only)',
      },
      { status: 400 },
    )
  }

  try {
    await apiFetch(`/api/v1/users/me`, {
      method: 'PUT',
      body: { display_name: body.display_name, username: body.username },
      retries: 1,
    })
    log.info({ userId: session.userId }, 'profile:ok')
    return NextResponse.json({ success: true })
  } catch (err) {
    const e = err instanceof AppError ? err : AppError.upstream()
    if (e.status !== 409) log.error({ err: e.toJSON() }, 'profile:failed')
    return NextResponse.json(e.toJSON(), { status: e.status })
  }
}
