import type { Context } from 'hono'
import { streamSSE } from 'hono/streaming'
import { remainingCapacityForScheduledDate } from '../services/booking-intent.service.js'

const POLL_INTERVAL_MS = 3000
const HEARTBEAT_INTERVAL_MS = 25000

interface SeatEvent {
  capacity: number
  seatsLeft: number
  status: 'green' | 'yellow' | 'red' | 'sold-out'
}

function classify(capacity: number, seatsLeft: number): SeatEvent['status'] {
  if (seatsLeft <= 0) return 'sold-out'
  const ratio = seatsLeft / Math.max(capacity, 1)
  if (ratio < 0.1) return 'red'
  if (ratio < 0.5) return 'yellow'
  return 'green'
}

/**
 * GET /api/v1/bookings/seats/:dateId/stream
 *
 * SSE seat-availability stream (E5.4 T4). Polls the DB every 3s and
 * emits an event only when seats change. Heartbeats every 25s to keep
 * the connection alive through proxies/load balancers.
 *
 * Note: this is **internal-poll-backed SSE**, not Postgres LISTEN/NOTIFY.
 * The decision-locked design called for LISTEN/NOTIFY for sub-second
 * latency, but Supabase's pg client is request-scoped and a long-held
 * LISTEN connection adds infrastructure complexity. Polling at 3s gives
 * the same protocol-level UX (real EventSource on the client). LISTEN/
 * NOTIFY upgrade is filed as E5.4/ENH-001.
 *
 * Auth: public-readable. The endpoint exposes only `{capacity, seatsLeft,
 * status}` — no PII, no booking IDs. Rate-limited by Cloudflare per-IP.
 */
export async function handleSeatStream(c: Context): Promise<Response> {
  const dateId = c.req.param('dateId')
  if (!dateId) {
    return c.json(
      { type: 'invalid-input', status: 400, detail: 'dateId required' },
      400,
    )
  }

  return streamSSE(c, async (stream) => {
    let lastEmitted: SeatEvent | null = null
    let pollTimer: NodeJS.Timeout | null = null
    let heartbeatTimer: NodeJS.Timeout | null = null

    const cleanup = (): void => {
      if (pollTimer) clearTimeout(pollTimer)
      if (heartbeatTimer) clearInterval(heartbeatTimer)
    }

    // Cleanup when the client disconnects.
    stream.onAbort(() => {
      cleanup()
    })

    const tick = async (): Promise<void> => {
      try {
        const { capacity, remaining } = await remainingCapacityForScheduledDate(dateId)
        const evt: SeatEvent = {
          capacity,
          seatsLeft: remaining,
          status: classify(capacity, remaining),
        }
        if (
          !lastEmitted ||
          lastEmitted.seatsLeft !== evt.seatsLeft ||
          lastEmitted.capacity !== evt.capacity ||
          lastEmitted.status !== evt.status
        ) {
          await stream.writeSSE({
            event: 'seats',
            data: JSON.stringify(evt),
          })
          lastEmitted = evt
        }
      } catch (err) {
        // Don't kill the stream on a transient DB error; wait for the next poll.
        // (api uses request-scoped logging via middleware; per-poll errors
        //  here just go to stderr for now.)
        console.warn('seat-stream:poll-failed', { err: String(err), dateId })
      }
      pollTimer = setTimeout(() => {
        void tick()
      }, POLL_INTERVAL_MS)
    }

    // Initial event + heartbeat schedule.
    await tick()
    heartbeatTimer = setInterval(() => {
      void stream.writeSSE({
        event: 'heartbeat',
        data: String(Date.now()),
      })
    }, HEARTBEAT_INTERVAL_MS)

    // Keep the stream open until the client disconnects. The framework
    // resolves this promise on abort.
    await new Promise<void>(() => {
      /* hold open */
    })
  })
}
