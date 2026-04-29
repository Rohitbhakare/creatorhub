import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { releaseBookingIntent } from '@/lib/api'
import { getSession } from '@/lib/session'
import { logger } from '@/lib/logger'

const Schema = z.object({ intentId: z.string().min(1).max(64) })

/**
 * POST /api/booking/cancel — releases a held seat. Called by the wizard's
 * `beforeunload` beacon when the user closes the tab without paying.
 */
export async function POST(req: NextRequest) {
  const log = logger.child({ route: 'api/booking/cancel' })
  const session = await getSession()
  if (!session) return NextResponse.json({ ok: true })

  try {
    const body = Schema.parse(await req.json())
    await releaseBookingIntent(body.intentId)
    log.info({ userId: session.userId, intentId: body.intentId }, 'booking-cancel:ok')
  } catch (err) {
    log.warn({ err: String(err) }, 'booking-cancel:failed')
  }
  return NextResponse.json({ ok: true })
}
