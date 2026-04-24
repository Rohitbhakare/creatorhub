import { PostHog } from 'posthog-node'
import { env } from '../env.js'

// Lazy-init client — no-op singleton when POSTHOG_API_KEY is absent.
let _client: PostHog | null = null

function getClient(): PostHog | null {
  if (_client !== null) return _client
  if (!env.POSTHOG_API_KEY) return null
  _client = new PostHog(env.POSTHOG_API_KEY, {
    host: env.POSTHOG_HOST,
    flushAt: 20,
    flushInterval: 10_000,
  })
  return _client
}

/**
 * Fire-and-forget PostHog capture. No-op when POSTHOG_API_KEY is not set.
 * Never throws — analytics must never break the request path.
 */
export function posthogTrack(
  distinctId: string,
  event: string,
  properties: Record<string, unknown> = {},
): void {
  try {
    getClient()?.capture({ distinctId, event, properties })
  } catch {
    // swallow
  }
}

/** Flush pending events (call on graceful shutdown). */
export async function posthogShutdown(): Promise<void> {
  await _client?.shutdown()
}
