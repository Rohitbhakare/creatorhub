import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiFetch } from '@/lib/api-client'
import { createSession } from '@/lib/session'
import { logger } from '@/lib/logger'
import { AppError } from '@/lib/errors'

/**
 * POST /api/auth/signin
 *
 * Web auth flow: client uses Firebase JS SDK to obtain a Firebase ID token
 * (phone OTP or Google OAuth), POSTs it here, we exchange with the backend
 * `/api/v1/auth/register` endpoint which returns an app session.
 *
 * Output: sets httpOnly session, access, refresh cookies and returns
 * minimal user profile. The Firebase ID token is exchanged once and
 * discarded — we never store it client-side.
 */

const Schema = z.object({
  firebase_token: z.string().min(20).max(4096),
  device_info: z
    .object({
      device_id: z.string().max(128),
      device_name: z.string().max(128).optional(),
      platform: z.literal('web'),
      app_version: z.string().max(32).optional(),
    })
    .strict(),
})

interface RegisterResult {
  user: {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
    is_creator: boolean
    vertical: string | null
  }
  access_token: string
  refresh_token: string
}

export async function POST(req: NextRequest) {
  const log = logger.child({ route: 'api/auth/signin' })
  const origin = req.headers.get('origin')
  const host = req.headers.get('host')

  // CSRF — Origin must match host. SameSite=Lax cookies block 99% of CSRF
  // already; this is a belt-and-suspenders check on POST.
  if (origin && host && !origin.endsWith(host)) {
    log.warn({ origin, host }, 'auth-signin:bad-origin')
    return NextResponse.json(
      { type: 'forbidden', status: 403, detail: 'Origin mismatch' },
      { status: 403 },
    )
  }

  let body
  try {
    body = Schema.parse(await req.json())
  } catch (err) {
    log.warn({ err: String(err) }, 'auth-signin:bad-input')
    return NextResponse.json(
      { type: 'bad-request', status: 400, detail: 'Invalid input' },
      { status: 400 },
    )
  }

  try {
    const result = await apiFetch<RegisterResult>(`/api/v1/auth/register`, {
      method: 'POST',
      body,
      skipAuth: true,
      retries: 0,
    })

    await createSession(
      {
        userId: result.user.id,
        username: result.user.username,
        displayName: result.user.display_name,
        avatarUrl: result.user.avatar_url,
        isCreator: result.user.is_creator,
        vertical: result.user.vertical,
      },
      { access_token: result.access_token, refresh_token: result.refresh_token },
    )

    log.info({ userId: result.user.id }, 'auth-signin:ok')
    return NextResponse.json({
      user: {
        id: result.user.id,
        username: result.user.username,
        displayName: result.user.display_name,
        isCreator: result.user.is_creator,
      },
    })
  } catch (err) {
    const e = err instanceof AppError ? err : AppError.upstream()
    log.error({ err: e.toJSON() }, 'auth-signin:failed')
    return NextResponse.json(e.toJSON(), { status: e.status })
  }
}
