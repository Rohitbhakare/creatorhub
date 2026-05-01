/**
 * Mood ID type + URL-param parser. Lives in a non-client module so server
 * components (e.g. the home page) can import the parser to validate
 * `?mood=` query params before passing them down.
 */

export type MoodId = 'slow' | 'high' | 'food' | 'sunrise' | 'art'

const VALID_MOODS = new Set<string>(['slow', 'high', 'food', 'sunrise', 'art'])

/** Validate a `?mood=` query param. Returns null if not a known mood. */
export function parseMoodParam(raw: string | undefined | null): MoodId | null {
  if (!raw || !VALID_MOODS.has(raw)) return null
  return raw as MoodId
}
