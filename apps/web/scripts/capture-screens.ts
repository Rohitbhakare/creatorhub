/**
 * Capture E5.1 home-page screenshots at 5 breakpoints.
 *
 * Usage:
 *   pnpm tsx scripts/capture-screens.ts
 *
 * Requires the dev server to be reachable at http://localhost:3004.
 * Output: docs/epics/E5.1-home-v3/screens/<route>-<width>.png
 */
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const BASE = process.env.SCREENS_BASE_URL ?? 'http://localhost:3004'
const OUT_DIR = '../../docs/epics/E5.1-home-v3/screens'

const BREAKPOINTS: { name: string; width: number; height: number }[] = [
  { name: 'mobile-390',     width: 390,  height: 844 },
  { name: 'tablet-768',     width: 768,  height: 1024 },
  { name: 'desktop-1080',   width: 1080, height: 800 },
  { name: 'wide-1440',      width: 1440, height: 900 },
  { name: 'ultrawide-1920', width: 1920, height: 1080 },
]

const ROUTES: { path: string; slug: string }[] = [
  { path: '/',              slug: 'home-magazine' },
  { path: '/?type=post',    slug: 'home-posts-mode' },
  { path: '/?mood=slow',    slug: 'home-mood-slow' },
]

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch()
  try {
    for (const route of ROUTES) {
      for (const bp of BREAKPOINTS) {
        const ctx = await browser.newContext({
          viewport: { width: bp.width, height: bp.height },
          deviceScaleFactor: 1,
          colorScheme: 'light',
        })
        const page = await ctx.newPage()
        const url = `${BASE}${route.path}`
        const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => null)
        if (!res || !res.ok()) {
          console.warn(`  ! ${route.path} @ ${String(bp.width)}px — HTTP ${String(res?.status() ?? 'failed')}`)
          await ctx.close()
          continue
        }
        // Disable animations + force everything visible so framer-motion's
        // `whileInView` opacity:0 doesn't blank below-the-fold sections in
        // a fullPage capture (Playwright doesn't scroll, so IntersectionObserver
        // never fires, and `<ScrollReveal>` content stays at opacity:0 forever).
        await page.addStyleTag({
          content: `
            *, *::before, *::after {
              animation-duration: 0s !important;
              transition-duration: 0s !important;
            }
            /* framer-motion's initial='hidden' applies inline opacity:0;
               override with !important so all sections capture filled. */
            [style*="opacity: 0"] { opacity: 1 !important; }
          `,
        })
        // Programmatically scroll top-to-bottom so any IntersectionObserver
        // animations (like ScrollReveal) fire before the snapshot — belt-
        // and-braces alongside the CSS override above.
        await page.evaluate(async () => {
          const total = document.documentElement.scrollHeight
          const step = window.innerHeight
          for (let y = 0; y <= total; y += step) {
            window.scrollTo(0, y)
            await new Promise((r) => setTimeout(r, 80))
          }
          window.scrollTo(0, 0)
          await new Promise((r) => setTimeout(r, 200))
        })
        const out = `${OUT_DIR}/${route.slug}-${bp.name}.png`
        await page.screenshot({ path: out, fullPage: true })
        console.log(`  + ${route.slug} @ ${String(bp.width)}px -> ${out}`)
        await ctx.close()
      }
    }
  } finally {
    await browser.close()
  }
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})
