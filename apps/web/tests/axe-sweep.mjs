/**
 * axe-core sweep — runs WCAG 2.2 AA scan against every M2.5 public route.
 *
 *   pnpm exec node tests/axe-sweep.mjs
 *
 * Requires `pnpm dev` (web on :3004) AND the API on :3001 running. Reports
 * critical / serious / moderate / minor violation counts per route, then a
 * grand total. Exits non-zero if any route has > 0 critical violations
 * (matches WEB-A11Y-FR-106).
 *
 * Output: tests/axe-sweep-report.json with the full violation tree per route.
 */

import { chromium } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const BASE = 'http://localhost:3004'
const OUT = path.resolve('tests/axe-sweep-report.json')

// Curated subset — every distinct route the M2.5 series touched. Skips noisy
// duplicates (e.g., /?type=foo permutations re-render the same chrome) and
// skips guest-redirect routes that just bounce to /signin.
const ROUTES = [
  '/',
  '/discover',
  '/discover/results',
  '/discover/results?q=spiti',
  '/creators',
  '/content/dd000000-2000-2000-2000-000000000001',
  '/u/priyasharma',
  '/signin',
  '/signup',
  '/forgot-password',
  '/onboarding/welcome',
  '/onboarding/city',
  '/onboarding/sub-categories',
  '/terms',
  '/privacy',
  '/community-guidelines',
]

const SEV_ORDER = ['critical', 'serious', 'moderate', 'minor']

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

// Suppress Next.js + framer dev noise so we see only real violations.
page.on('console', (msg) => {
  if (msg.type() === 'error' && !msg.text().includes('Failed to load resource')) {
    // surface only true console errors
    console.error('  console:', msg.text().slice(0, 160))
  }
})

await mkdir(path.dirname(OUT), { recursive: true })

const summary = []
const totals = { critical: 0, serious: 0, moderate: 0, minor: 0 }
const fullReport = []

for (const route of ROUTES) {
  process.stdout.write(`scan ${route} ... `)
  try {
    const resp = await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 30000 })
    const status = resp?.status() ?? 0

    // Wait an extra beat for client-side hydration + entry animations to settle
    await page.waitForTimeout(400)

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze()

    const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 }
    for (const v of results.violations) {
      counts[v.impact ?? 'minor']++
      totals[v.impact ?? 'minor']++
    }

    summary.push({ route, status, ...counts, total: results.violations.length })
    fullReport.push({ route, status, violations: results.violations })

    process.stdout.write(
      `${String(status)}  C:${String(counts.critical)} S:${String(counts.serious)} M:${String(counts.moderate)} m:${String(counts.minor)}\n`,
    )
  } catch (err) {
    summary.push({ route, error: err.message })
    process.stdout.write(`ERROR ${err.message}\n`)
  }
}

await browser.close()
await writeFile(OUT, JSON.stringify(fullReport, null, 2))

// ─── Print table ────────────────────────────────────────────────
console.log('\n┌─────────────────────────────────────────────────────────────┬─────┬──────┬──────┬──────┬──────┐')
console.log('│ Route                                                       │ HTTP│ Crit │ Ser  │ Mod  │ Minor│')
console.log('├─────────────────────────────────────────────────────────────┼─────┼──────┼──────┼──────┼──────┤')
for (const r of summary) {
  if (r.error) {
    console.log(`│ ${r.route.padEnd(60)}│ ERR │  -   │  -   │  -   │  -   │`)
    continue
  }
  console.log(
    `│ ${r.route.padEnd(60)}│ ${String(r.status).padStart(3)} │ ${String(r.critical).padStart(4)} │ ${String(r.serious).padStart(4)} │ ${String(r.moderate).padStart(4)} │ ${String(r.minor).padStart(4)} │`,
  )
}
console.log('├─────────────────────────────────────────────────────────────┼─────┼──────┼──────┼──────┼──────┤')
console.log(
  `│ ${'TOTAL'.padEnd(60)}│     │ ${String(totals.critical).padStart(4)} │ ${String(totals.serious).padStart(4)} │ ${String(totals.moderate).padStart(4)} │ ${String(totals.minor).padStart(4)} │`,
)
console.log('└─────────────────────────────────────────────────────────────┴─────┴──────┴──────┴──────┴──────┘\n')

console.log(`Full report: ${OUT}`)

if (totals.critical > 0) {
  console.log(`\n❌ ${String(totals.critical)} critical violation(s) — gate FAILS (WEB-A11Y-FR-106 = 0 critical)`)
  process.exit(1)
}
console.log(`\n✅ 0 critical violations — gate PASSES`)
