/**
 * Capture E5.6 auth + onboarding screenshots at 5 breakpoints.
 *
 * Usage:
 *   pnpm tsx scripts/capture-auth-screens.ts
 *
 * Requires the dev server reachable at http://localhost:3004.
 */
import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const BASE = process.env.SCREENS_BASE_URL ?? 'http://localhost:3004'
const OUT_DIR = '../../docs/epics/E5.6-auth-onboarding-v3/screens'

const BREAKPOINTS: { name: string; width: number; height: number }[] = [
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1080', width: 1080, height: 800 },
  { name: 'wide-1440', width: 1440, height: 900 },
  { name: 'ultrawide-1920', width: 1920, height: 1080 },
]

const ROUTES: { path: string; slug: string }[] = [
  { path: '/signin', slug: 'signin' },
  { path: '/signup', slug: 'signup' },
  { path: '/forgot-password', slug: 'forgot-password' },
  { path: '/onboarding/welcome', slug: 'onboarding-welcome' },
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
        if (!res) {
          console.warn(`  ! ${route.path} @ ${String(bp.width)}px — request failed`)
          await ctx.close()
          continue
        }
        await page.addStyleTag({
          content: `*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }`,
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
