/**
 * Live walkthrough — opens a real Chromium against http://localhost:3004
 * (real Hono API on :3001), visits each public route, captures:
 *   • HTTP status of the navigation
 *   • console errors / warnings during the page lifecycle
 *   • failed network requests
 *   • whether key DOM markers we care about are present
 *   • a screenshot per route into tests/walkthrough-shots/
 *
 * Reports a tabular summary at the end. Designed to run once on demand:
 *   node tests/walkthrough.mjs
 */

// `playwright` (the standalone runtime) isn't installed; @playwright/test
// re-exports the same chromium driver. Use that.
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = 'http://localhost:3004'
const SHOT_DIR = path.resolve('tests/walkthrough-shots')

const ROUTES = [
  // [path, optional DOM probe — text we'd expect to see for a healthy render]
  ['/', 'Stories, plans, and live moments'],
  ['/?type=itinerary', null],
  ['/?type=experience', null],
  ['/?type=event', null],
  ['/?type=post', null],
  ['/discover', 'Find your next'],
  ['/discover?q=spiti', null],
  ['/discover?section=hot-near-you', 'Showing rail'],
  ['/discover?section=for-you-trips', null],
  ['/discover/results', 'Filtered results'],
  ['/discover/results?q=spiti', 'Searching for'],
  ['/discover/results?type=post', 'Active filters'],
  ['/creators', 'Build your creator business'],
  ['/content/dd000000-2000-2000-2000-000000000001', null],
  ['/content/dd000000-2000-2000-2000-000000000017', null],
  ['/u/priyasharma', null],
  ['/u/arjunmehta', null],
  ['/travel/priyasharma', null], // legacy URL — middleware 301s to /u/priyasharma
  ['/signin', 'Send code'],
  ['/signup', null],
  ['/forgot-password', 'Reset'],
  ['/terms', null],
  ['/privacy', null],
  ['/community-guidelines', null],
  ['/sitemap.xml', '<urlset'],
  ['/robots.txt', 'Sitemap:'],
  // Protected routes — guest expected to be 307'd to /signin
  ['/you', null],
  ['/saved', null],
  ['/studio', null],
  ['/publish', null],
  ['/notifications', null],
]

await mkdir(SHOT_DIR, { recursive: true })

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  // Guest mode — no cookies.
})

const rows = []

for (const [route, probe] of ROUTES) {
  const page = await context.newPage()
  const consoleErrors = []
  const consoleWarns = []
  const failedRequests = []

  // Things to ignore so the signal-to-noise ratio stays sane:
  // - Next.js prefetches RSC payloads on link hover; navigating cancels them
  //   with net::ERR_ABORTED. These are not user-visible failures.
  // - favicon.ico 404 is harmless dev noise.
  // - Server Components prefetch headers that 404 (`_rsc=…`) when a page is
  //   not yet built in dev are also link-prefetch cancellations.
  // - React Devtools nudge.
  // - Fast Refresh internal logs.
  const isNoise = (text) =>
    text.includes('Download the React DevTools') ||
    text.includes('[Fast Refresh]') ||
    text.includes('favicon.ico') ||
    text.includes('_rsc=') ||
    text.includes('Failed to load resource: the server responded with a status of 404') ||
    text.includes('net::ERR_ABORTED')

  page.on('console', (msg) => {
    const text = msg.text()
    if (isNoise(text)) return
    const t = msg.type()
    if (t === 'error') consoleErrors.push(text)
    else if (t === 'warning') consoleWarns.push(text)
  })
  page.on('pageerror', (err) => {
    if (isNoise(err.message)) return
    consoleErrors.push(`pageerror: ${err.message}`)
  })
  page.on('requestfailed', (req) => {
    const url = req.url()
    if (!url.startsWith(BASE) && !url.startsWith('http://localhost:3001')) return
    if (url.includes('_rsc=')) return
    if (url.endsWith('/favicon.ico')) return
    failedRequests.push(`${req.method()} ${url} — ${req.failure()?.errorText ?? 'n/a'}`)
  })
  page.on('response', (res) => {
    const url = res.url()
    const status = res.status()
    if (url.includes('_rsc=')) return
    if (
      (url.startsWith(BASE) || url.startsWith('http://localhost:3001')) &&
      status >= 500
    ) {
      failedRequests.push(`${status} ${res.request().method()} ${url}`)
    }
  })

  let status = 0
  let navError = null
  let finalUrl = ''
  try {
    const response = await page.goto(BASE + route, {
      waitUntil: 'domcontentloaded',
      timeout: 15_000,
    })
    status = response?.status() ?? 0
    finalUrl = page.url().replace(BASE, '') || '/'
    // Give RSC streaming a moment to flush so probes for late-streamed
    // sections (CommentsSection, EndOfArticleRail) work.
    await page.waitForTimeout(500)
  } catch (err) {
    navError = err.message ?? String(err)
  }

  let probeFound = null
  if (probe) {
    try {
      probeFound = await page.locator(`text=${probe}`).first().isVisible({ timeout: 1500 })
    } catch {
      probeFound = false
    }
  }

  // Screenshot for visual review
  const safeName = route.replace(/[^\w]+/g, '_').replace(/^_|_$/g, '') || 'home'
  await page.screenshot({
    path: path.join(SHOT_DIR, `${safeName}.png`),
    fullPage: false,
  })

  rows.push({
    route,
    finalUrl,
    status,
    navError,
    probe,
    probeFound,
    consoleErrors,
    consoleWarns,
    failedRequests,
  })
  await page.close()
  // Pace ourselves so the API rate-limiter doesn't fire. A real user opens
  // routes at human speed; the limiter is sized for that — bursting 27
  // routes in a few seconds would 429 the upstream and our pages would
  // (correctly) render empty.
  await new Promise((r) => setTimeout(r, 1500))
}

await browser.close()

// ── Report ────────────────────────────────────────────────────────────────────
const reset = '\x1b[0m'
const red = '\x1b[31m'
const green = '\x1b[32m'
const yellow = '\x1b[33m'
const dim = '\x1b[2m'

function fmtStatus(s) {
  if (s === 0) return red + '   ?' + reset
  if (s >= 500) return red + ` ${s}` + reset
  if (s >= 400) return yellow + ` ${s}` + reset
  if (s >= 300) return dim + ` ${s}` + reset
  if (s >= 200) return green + ` ${s}` + reset
  return ` ${s}`
}

let issues = 0
console.log('')
console.log(
  'Route                                                   HTTP  probe  errs  warns  → final',
)
console.log(
  '──────────────────────────────────────────────────────────────────────────────────────────',
)
for (const row of rows) {
  const probeMark =
    row.probe == null ? '  -  ' : row.probeFound ? `${green}  ✓  ${reset}` : `${red}  ✗  ${reset}`
  const errs = row.consoleErrors.length
  const warns = row.consoleWarns.length
  const fails = row.failedRequests.length
  const errsCol = errs > 0 ? red + String(errs).padStart(4) + reset : '   0'
  const warnsCol = warns > 0 ? yellow + String(warns).padStart(5) + reset : '    0'
  const flag =
    row.navError ||
    row.status >= 500 ||
    (row.probe && row.probeFound === false) ||
    errs > 0 ||
    fails > 0
  if (flag) issues++
  const redirectMark =
    row.finalUrl && row.finalUrl !== row.route ? `${dim}→${reset} ${row.finalUrl}` : ''
  console.log(
    `${row.route.padEnd(56)}${fmtStatus(row.status)}  ${probeMark}  ${errsCol} ${warnsCol}  ${redirectMark}`,
  )
  if (row.navError) {
    console.log(`  ${red}nav error: ${row.navError}${reset}`)
  }
  for (const e of row.consoleErrors) {
    console.log(`  ${red}console.error:${reset} ${e.slice(0, 220)}`)
  }
  for (const f of row.failedRequests) {
    console.log(`  ${red}5xx/failed:${reset} ${f}`)
  }
}
console.log('')
console.log(
  `${rows.length} routes walked · ${issues} with issues · screenshots in tests/walkthrough-shots/`,
)
process.exit(issues > 0 ? 1 : 0)
