/**
 * Hermetic mock API server for Playwright E2E tests.
 * Started by playwright.config.ts webServer[0] on port 4000.
 * Next.js is started with API_BASE_URL=http://localhost:4000 so all SSR
 * fetch() calls land here — tests run without a real Hono API or DB.
 */

import { createServer } from 'node:http'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_CREATOR = {
  id: 'test-creator-001',
  username: 'testcreator',
  displayName: 'Rohit Travels',
  bio: 'Exploring India one city at a time. Travel stories from the road.',
  avatarUrl: null,
  coverUrl: null,
  vertical: 'travel',
  followerCount: 1234,
  contentCount: 8,
  averageRating: 4.7,
  isCreator: true,
  content: [
    {
      id: 'content-001',
      type: 'itinerary',
      title: 'Bali in 5 Days',
      coverImageUrl: null,
      priceInPaisa: 650000,
      isFree: false,
      status: 'published',
    },
    {
      id: 'content-002',
      type: 'post',
      title: 'Sunrise at Kedarnath',
      coverImageUrl: null,
      priceInPaisa: 0,
      isFree: true,
      status: 'published',
    },
  ],
}

const MOCK_PAID_CONTENT = {
  id: 'content-001',
  type: 'itinerary',
  title: 'Bali in 5 Days',
  description: 'A curated 5-day travel plan through Bali\'s best spots.',
  body: null,
  coverImageUrl: null,
  priceInPaisa: 650000,
  isFree: false,
  startsAt: null,
  endsAt: null,
  creator: {
    id: 'test-creator-001',
    username: 'testcreator',
    displayName: 'Rohit Travels',
    avatarUrl: null,
    vertical: 'travel',
  },
}

const MOCK_FREE_CONTENT = {
  id: 'content-002',
  type: 'post',
  title: 'Sunrise at Kedarnath',
  description: 'A breathtaking sunrise from one of India\'s holiest shrines.',
  body: 'The air was cold, the trail was steep, but nothing prepared me for the view...',
  coverImageUrl: null,
  priceInPaisa: 0,
  isFree: true,
  startsAt: null,
  endsAt: null,
  creator: {
    id: 'test-creator-001',
    username: 'testcreator',
    displayName: 'Rohit Travels',
    avatarUrl: null,
    vertical: 'travel',
  },
}

// ── Route table ───────────────────────────────────────────────────────────────

const ROUTES = [
  [/^\/health$/, 200, { ok: true }],
  [/^\/api\/v1\/users\/by-username\/testcreator$/, 200, { success: true, data: MOCK_CREATOR }],
  [/^\/api\/v1\/users\/by-username\//, 404, { success: false, data: null }],
  [/^\/api\/v1\/content\/content-001$/, 200, { success: true, data: MOCK_PAID_CONTENT }],
  [/^\/api\/v1\/content\/content-002$/, 200, { success: true, data: MOCK_FREE_CONTENT }],
  [/^\/api\/v1\/content\//, 404, { success: false, data: null }],
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
