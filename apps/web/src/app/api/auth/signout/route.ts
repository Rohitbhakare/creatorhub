import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api-client'
import { getRefreshToken } from '@/lib/session'
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

  // Drop session cookies on the response (same Next 15 reason as signin).
  const res = NextResponse.json({ success: true })
  for (const name of ['ch_session', 'ch_access', 'ch_refresh']) {
    res.cookies.delete(name)
  }
  log.info('session:destroyed')
  return res
}
