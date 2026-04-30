/**
 * Hermetic mock API server for Playwright E2E tests.
 *
 * Started by playwright.config.ts webServer[0] on port 9876. Next.js is
 * started with API_BASE_URL=http://localhost:9876 so all SSR fetch() calls
 * land here — tests run without a real Hono API or DB.
 *
 * Returns the *real API contract* (snake_case fields, content_type long
 * form, success-wrapped envelope) so the web's transformContentDetail /
 * transformCreator etc. work the same way they do in production.
 */

import { createServer } from 'node:http'

// ── Fixtures (snake_case to match the real API) ──────────────────────────────

const MOCK_CREATOR = {
  id: 'test-creator-001',
  username: 'testcreator',
  display_name: 'Rohit Travels',
  bio: 'Exploring India one city at a time. Stories from the road.',
  avatar_url: null,
  cover_url: null,
  vertical: 'travel',
  follower_count: 1234,
  content_count: 8,
  average_rating: 4.7,
  is_creator: true,
  content: [
    {
      id: 'content-001',
      type: 'self_paced_itinerary',
      title: 'Bali in 5 Days',
      cover_image_url: null,
      price_in_paisa: 650000,
      is_free: false,
      status: 'published',
    },
    {
      id: 'content-002',
      type: 'post',
      title: 'Sunrise at Kedarnath',
      cover_image_url: null,
      price_in_paisa: 0,
      is_free: true,
      status: 'published',
    },
  ],
}

const MOCK_CREATOR_RAW = {
  // Used by /content/[id] page → fetchContentDetail → creator field
  id: 'test-creator-001',
  username: 'testcreator',
  display_name: 'Rohit Travels',
  avatar_url: null,
  vertical: 'travel',
}

const MOCK_PAID_CONTENT = {
  id: 'content-001',
  type: 'self_paced_itinerary',
  title: 'Bali in 5 Days',
  description: "A curated 5-day plan through Bali's best spots.",
  body: null,
  cover_image_url: null,
  price_in_paisa: 650000,
  is_free: false,
  status: 'published',
  visibility: 'public',
  starts_at: null,
  ends_at: null,
  creator: MOCK_CREATOR_RAW,
  spots: [],
  scheduled_dates: [],
  // Engagement counts — needed for save/like/follower badges + comment header.
  save_count: 312,
  like_count: 84,
  comment_count: 12,
  view_count: 4521,
}

const MOCK_FREE_CONTENT = {
  id: 'content-002',
  type: 'post',
  title: 'Sunrise at Kedarnath',
  description: "A breathtaking sunrise from one of India's holiest shrines.",
  body: 'The air was cold, the trail was steep, but nothing prepared me for the view...',
  cover_image_url: null,
  price_in_paisa: 0,
  is_free: true,
  status: 'published',
  visibility: 'public',
  starts_at: null,
  ends_at: null,
  creator: MOCK_CREATOR_RAW,
  spots: [],
  scheduled_dates: [],
  save_count: 18,
  like_count: 124,
  comment_count: 3,
  view_count: 982,
}

// Empty list — comments component fetches this for the read-only preview
// and tolerates an empty list without error.
const EMPTY_COMMENTS = { items: [], next_cursor: null }

// Empty feed sections so home/discover don't 500 on fetch failure
const EMPTY_FEED = []

// ── Route table ──────────────────────────────────────────────────────────────

const ROUTES = [
  [/^\/health$/, 200, { ok: true }],

  // Creator profile lookup — by-username and by-id forms
  [/^\/api\/v1\/users\/by-username\/testcreator$/, 200, { success: true, data: MOCK_CREATOR }],
  [/^\/api\/v1\/users\/by-username\//, 404, { success: false, data: null }],

  // Content detail
  [/^\/api\/v1\/content\/content-001$/, 200, { success: true, data: MOCK_PAID_CONTENT }],
  [/^\/api\/v1\/content\/content-002$/, 200, { success: true, data: MOCK_FREE_CONTENT }],

  // Comments thread (read-only preview for guests)
  [/^\/api\/v1\/content\/[^/]+\/comments/, 200, { success: true, data: EMPTY_COMMENTS }],

  // Home + discover feed sections — empty arrays so the page renders empty rails
  [/^\/api\/v1\/feed\/[^/?]+/, 200, { success: true, data: EMPTY_FEED }],
  [/^\/api\/v1\/discover\/cities/, 200, { success: true, data: [] }],
  [/^\/api\/v1\/discover\/search/, 200, { success: true, data: { content: [], total: 0 } }],

  // Sitemap (returns empty entries for tests; classic sitemap test asserts only on static routes)
  [/^\/api\/v1\/feed\/sitemap/, 200, { success: true, data: { entries: [] } }],

  // Anything else under /api/v1/content is unknown
  [/^\/api\/v1\/content\//, 404, { success: false, data: null }],

  // Anything else under /api/v1/ — fall through to a generic 404
  [/^\/api\/v1\//, 404, { success: false, data: null }],
]

// ── Server ────────────────────────────────────────────────────────────────────

const server = createServer((req, res) => {
  const url = req.url ?? ''
  for (const [pattern, status, body] of ROUTES) {
    if (pattern.test(url)) {
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(body))
      return
    }
  }
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ success: false }))
})

const PORT = 9876
server.listen(PORT, () => {
  console.log(`[mock-api] Listening on http://localhost:${PORT}`)
})

process.on('SIGTERM', () => server.close())
process.on('SIGINT', () => server.close())
