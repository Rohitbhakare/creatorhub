/**
 * Mood ID type + URL-param parser. Lives in a non-client module so server
 * components (e.g. the home page) can import the parser to validate
 * `?mood=` query params before passing them down.
 *
 * Also exposes `rankByMood()` — a client-side reranking heuristic the
 * home page uses while server-side mood ranking ships (filed as
 * E5.1/ENH-001 in TRACKING.md). When the API eventually accepts `?mood=`,
 * the page can drop the client rerank and let the API order things.
 */

export type MoodId = 'slow' | 'high' | 'food' | 'sunrise' | 'art'

const VALID_MOODS = new Set<string>(['slow', 'high', 'food', 'sunrise', 'art'])

/** Validate a `?mood=` query param. Returns null if not a known mood. */
export function parseMoodParam(raw: string | undefined | null): MoodId | null {
  if (!raw || !VALID_MOODS.has(raw)) return null
  return raw as MoodId
}

// ── Mood scoring (client-side rerank) ───────────────────────────────

type ContentType = 'post' | 'itinerary' | 'experience' | 'event'

/**
 * Per-mood keyword + content-type weights. Each item's title + city +
 * summary + tags are concatenated, lowercased, and scored against the
 * mood's keyword list. Content type matching the mood's preferred types
 * gets a bonus, and a small duration-band match is also rewarded.
 *
 * Heuristic, not perfect. Designed to make the visible re-ranking obvious
 * when the user picks a mood, while server-side ranking ships separately.
 */
const MOOD_RULES: Record<
  MoodId,
  { keywords: string[]; types: ContentType[]; durationDays?: 'short' | 'long' }
> = {
  slow: {
    keywords: ['quiet', 'monsoon', 'village', 'homestay', 'slow', 'still', 'rural', 'kitchen', 'aji'],
    types: ['itinerary', 'post'],
    durationDays: 'short',
  },
  high: {
    keywords: ['bike', 'biking', 'ride', 'rider', 'trek', 'trekking', 'trail', 'hike', 'hiking', 'pass', 'expedition', 'route'],
    types: ['experience', 'itinerary'],
    durationDays: 'long',
  },
  food: {
    keywords: ['food', 'kabab', 'biryani', 'kitchen', 'coffee', 'tunday', 'mess', 'walk', 'taste', 'dish', 'cuisine', 'breakfast', 'sambar'],
    types: ['experience', 'post', 'event'],
  },
  sunrise: {
    keywords: ['sunrise', 'first light', 'morning', 'dawn', '5am', '4am', 'pre-dawn', 'golden hour', 'misty', 'first call'],
    types: ['post', 'event', 'experience'],
  },
  art: {
    keywords: ['art', 'weaver', 'studio', 'craft', 'atelier', 'residency', 'qawwali', 'music', 'sufi', 'pottery', 'textile', 'workshop'],
    types: ['event', 'experience', 'post'],
  },
}

interface ItemForScoring {
  type: ContentType
  title: string
  city?: string | null | undefined
  tags?: string[] | undefined
  durationDays?: number | null | undefined
  summary?: string | null | undefined
}

export function scoreItemForMood(item: ItemForScoring, mood: MoodId): number {
  const rule = MOOD_RULES[mood]
  const haystack = [
    item.title,
    item.city ?? '',
    item.summary ?? '',
    ...(item.tags ?? []),
  ]
    .join(' ')
    .toLowerCase()

  let score = 0
  for (const kw of rule.keywords) {
    if (haystack.includes(kw)) score += 2
  }
  if (rule.types.includes(item.type)) score += 3
  if (rule.durationDays && typeof item.durationDays === 'number') {
    if (rule.durationDays === 'short' && item.durationDays > 0 && item.durationDays <= 3) score += 1
    if (rule.durationDays === 'long' && item.durationDays >= 5) score += 1
  }
  return score
}

/**
 * Stable-sort an item list by descending mood score. Items with no
 * matches keep their original relative order (so the feed isn't
 * completely shuffled when a mood doesn't strongly match anything).
 */
export function rankByMood<T extends ItemForScoring>(items: readonly T[], mood: MoodId): T[] {
  const scored = items.map((item, idx) => ({
    item,
    idx,
    score: scoreItemForMood(item, mood),
  }))
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.idx - b.idx
  })
  return scored.map((s) => s.item)
}
