/**
 * URL slug helpers — keeps the API id (UUID) in the URL but prepends a
 * human/SEO-friendly slug so links read like
 *   /content/konkan-in-4-quiet-days-dd000000-2000-2000-2000-000000000017
 *
 * No DB migration needed — the server route handler strips everything
 * except the trailing UUID. If the input is a bare UUID (legacy URL), it
 * still resolves correctly.
 */

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i

/** Convert a title to a URL-safe slug. Caps at 60 chars so the URL stays sane. */
export function slugifyTitle(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '')
  return slug.length > 0 ? slug : 'untitled'
}

/** Build the canonical /content URL segment. */
export function contentSlugId(title: string, id: string): string {
  return `${slugifyTitle(title)}-${id}`
}

/**
 * Given any [id] param — either a bare UUID or a slug-prefixed UUID —
 * extract the UUID for the API lookup. Returns null when no UUID could be
 * extracted (the route should 404).
 */
export function extractContentId(segment: string): string | null {
  let value: string
  try {
    value = decodeURIComponent(segment)
  } catch {
    value = segment
  }
  // The id is always the LAST 36 chars when the slug is well-formed
  // (slugifyTitle strips anything UUID-shaped from the title).
  const tail = value.slice(-36)
  if (UUID_RE.test(tail)) return tail.toLowerCase()
  // Fall back to a generic search across the whole string.
  const m = value.match(UUID_RE)
  return m?.[0]?.toLowerCase() ?? null
}
