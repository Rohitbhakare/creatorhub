import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api-client'
import { destroySession, getRefreshToken } from '@/lib/session'
import { logger } from '@/lib/logger'

export async function POST() {
  const log = logger.child({ route: 'api/auth/signout' })
  const refreshToken = await getRefreshToken()

  // Best-effort: tell API to revoke. Even if this fails, we still drop the
  // local session to avoid stranding the user signed-in on a bad cookie.
  if (refreshToken) {
    try {
      await apiFetch(`/api/v1/auth/sign-out`, {
        method: 'POST',
        body: { refresh_token: refreshToken },
        retries: 0,
        timeoutMs: 3_000,
      })
    } catch (err) {
      log.warn({ err: String(err) }, 'auth-signout:revoke-failed')
    }
  }

  await destroySession()
  return NextResponse.json({ success: true })
}
