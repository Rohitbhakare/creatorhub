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

/**
 * Build the canonical /content URL segment.
 *
 * If the API has populated `slug` (migration 031 deployed), use that —
 * gives us the cleanest URL: /content/konkan-in-4-quiet-days
 *
 * Otherwise, generate a slug from the title and append the UUID so we
 * still have a unique, lookup-able URL until the migration lands:
 *   /content/konkan-in-4-quiet-days-dd000000-...
 */
export function contentSlugId(
  title: string,
  id: string,
  apiSlug?: string | null,
): string {
  if (apiSlug && apiSlug.length > 0) return apiSlug
  return `${slugifyTitle(title)}-${id}`
}

/**
 * Given any [id] param — bare UUID, slug-prefixed UUID, or pure slug —
 * return the lookup key for the API. Prefers a UUID when one is present
 * (most reliable). Falls back to the raw segment so the API can resolve
 * it as a slug column lookup once migration 031 lands. Returns null only
 * when the segment is empty.
 */
export function extractContentId(segment: string): string | null {
  let value: string
  try {
    value = decodeURIComponent(segment)
  } catch {
    value = segment
  }
  if (value.length === 0) return null
  // Prefer the trailing UUID when present (slug-prefixed form).
  const tail = value.slice(-36)
  if (UUID_RE.test(tail)) return tail.toLowerCase()
  const m = value.match(UUID_RE)
  if (m && m[0]) return m[0].toLowerCase()
  // No UUID — pass through as a slug lookup. API resolves either form.
  return value
}
