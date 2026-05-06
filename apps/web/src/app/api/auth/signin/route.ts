import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiFetch } from '@/lib/api-client'
import { buildSessionCookies } from '@/lib/session'
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
    onboarding_complete?: boolean
    travel_sub_categories?: string[]
    city_id?: string | null
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

    const sessionCookies = await buildSessionCookies(
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

    // Onboarding gate: complete when (a) at least 2 sub-categories
    // picked, (b) home city set, AND — round-6 audit C1 — (c) display
    // name + username are populated. New /onboarding/profile step
    // collects (c). The API returns these fields on /auth/register;
    // older deploys that don't will fall back to true so we don't
    // trap existing users in onboarding (back-compat for ~16 weeks
    // of accounts pre-dating the profile step).
    const subCats = result.user.travel_sub_categories ?? []
    const hasProfileBasics =
      typeof result.user.display_name === 'string' &&
      result.user.display_name.trim().length >= 2 &&
      typeof result.user.username === 'string' &&
      result.user.username.trim().length >= 3
    const onboardingComplete =
      result.user.onboarding_complete ??
      (subCats.length >= 2 && Boolean(result.user.city_id) && hasProfileBasics)

    log.info(
      { userId: result.user.id, onboardingComplete, cookieNames: sessionCookies.map((c) => c.name) },
      'auth-signin:ok',
    )

    // Attach Set-Cookie headers directly to this response so they survive
    // back to the browser. cookies().set() in route handlers doesn't always
    // round-trip in Next.js 15.
    const res = NextResponse.json({
      user: {
        id: result.user.id,
        username: result.user.username,
        displayName: result.user.display_name,
        isCreator: result.user.is_creator,
      },
      onboardingComplete,
    })
    for (const c of sessionCookies) {
      res.cookies.set(c.name, c.value, c.options)
    }
    return res
  } catch (err) {
    const e = err instanceof AppError ? err : AppError.upstream()
    log.error({ err: e.toJSON() }, 'auth-signin:failed')
    return NextResponse.json(e.toJSON(), { status: e.status })
  }
}
