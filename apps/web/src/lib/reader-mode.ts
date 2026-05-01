/**
 * Reader mode — Magazine vs Compact (E5.3 T8 scaffold).
 *
 * The full toggle (cookie write + Server Action + page rerender) lands in
 * T8. This module ships the type + a server-side `getReaderMode()` helper
 * so other E5.3 components can be wired against the typed enum from day 1.
 */
import { cookies } from 'next/headers'

export type ReaderMode = 'magazine' | 'compact'

export const READER_MODE_COOKIE = 'ch_reader_mode'

const ALLOWED: readonly ReaderMode[] = ['magazine', 'compact']

/**
 * Server-side: read the user's preferred mode from the cookie. Defaults to
 * `magazine` (the v3 first-class experience).
 */
export async function getReaderMode(): Promise<ReaderMode> {
  const store = await cookies()
  const raw = store.get(READER_MODE_COOKIE)?.value
  return raw && (ALLOWED as readonly string[]).includes(raw) ? (raw as ReaderMode) : 'magazine'
}
