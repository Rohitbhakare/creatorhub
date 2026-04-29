import { type NextRequest, NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api-client'
import { logger } from '@/lib/logger'
import { AppError } from '@/lib/errors'

/**
 * GET /api/cities/nearby?lat=&lng=
 * Proxies to /api/v1/cities/nearby. Public — no session required since
 * guests use this for the home-feed location prompt.
 */
export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat')
  const lng = req.nextUrl.searchParams.get('lng')
  if (!lat || !lng) {
    return NextResponse.json(
      { type: 'bad-request', status: 400, detail: 'lat and lng required' },
      { status: 400 },
    )
  }
  const log = logger.child({ route: 'api/cities/nearby' })
  try {
    const data = await apiFetch<{ name?: string; id?: string; state?: string }>(
      `/api/v1/cities/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
      { skipAuth: true, retries: 0, timeoutMs: 4_000 },
    )
    return NextResponse.json(data)
  } catch (err) {
    if (err instanceof AppError && err.status === 404) {
      return NextResponse.json(
        { type: 'not-found', status: 404, detail: 'No nearby city found' },
        { status: 404 },
      )
    }
    log.warn({ err: String(err) }, 'cities-nearby:failed')
    return NextResponse.json(
      { type: 'upstream-failure', status: 503, detail: 'Could not resolve location' },
      { status: 503 },
    )
  }
}
