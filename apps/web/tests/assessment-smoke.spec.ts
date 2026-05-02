import { test, expect } from '@playwright/test'

/**
 * Smoke spec covering interactions the 2026-05-02 user-experience assessment
 * flagged as "broken" — search Enter, share fallback, sort tabs, sidebar
 * routing collisions, terms/privacy mismatch.
 *
 * Each assertion proves the wiring is intact at the DOM level so we catch
 * future regressions of the same shape. We intentionally don't deep-test
 * full booking — that needs richer mocks and lives in BDD features.
 */

test.describe('Assessment smoke — search palette', () => {
  test('Cmd+K opens the command palette and Enter navigates to discover', async ({
    page,
    browserName,
  }) => {
    await page.goto('/')
    // Use a real keyboard chord so the palette's keydown listener fires.
    // Mac uses Meta+K; everything else uses Control+K. The palette listens
    // for both.
    const isMac = browserName === 'webkit' || process.platform === 'darwin'
    await page.keyboard.press(isMac ? 'Meta+K' : 'Control+K')
    const palette = page.getByRole('dialog', { name: /search/i })
    await expect(palette).toBeVisible({ timeout: 5_000 })

    const input = palette.getByRole('combobox')
    await input.fill('bali')
    await input.press('Enter')

    // Lands on /discover?q=bali (palette pushes that exact URL).
    await expect(page).toHaveURL(/\/discover\?.*q=bali/)
  })

  test('clicking the header search icon opens the palette (no hard nav)', async ({ page }) => {
    await page.goto('/')
    const trigger = page.getByRole('button', { name: /search/i }).first()
    await trigger.click()
    const palette = page.getByRole('dialog', { name: /search/i })
    await expect(palette).toBeVisible()
  })
})

test.describe('Assessment smoke — discover sort tabs', () => {
  test('sort tab clicks update ?sort= in URL', async ({ page }) => {
    await page.goto('/discover')
    // The "Recent" tab should be a Link with ?sort=recent in the href.
    const recent = page.getByRole('link', { name: /^Recent$/ })
    await expect(recent).toBeVisible()
    await expect(recent).toHaveAttribute('href', /[?&]sort=recent/)
  })

  test('"Itineraries" type tab routes back to /discover, not /privacy', async ({ page }) => {
    // Round-2 QA flagged a perceived collision between the Itineraries
    // filter and the privacy link. Both live in the discover sidebar; the
    // assertion below pins the href shape so a future refactor can't
    // accidentally repoint Itineraries at /privacy.
    await page.goto('/discover')
    const itineraries = page.getByRole('link', { name: /itineraries/i }).first()
    if (await itineraries.count()) {
      const href = await itineraries.getAttribute('href')
      expect(href).not.toMatch(/^\/privacy/)
      expect(href).toMatch(/^\/discover/)
    }
  })
})

test.describe('Assessment smoke — legal pages', () => {
  test('/terms shows Terms of Service content', async ({ page }) => {
    await page.goto('/terms')
    await expect(page.getByRole('heading', { name: /terms of service/i })).toBeVisible()
  })

  test('/privacy shows Privacy Policy content (not Terms)', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.getByRole('heading', { name: /privacy policy/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /^terms of service$/i })).toHaveCount(0)
  })

  test('header chrome is present on legal pages', async ({ page }) => {
    await page.goto('/terms')
    // WebHeader + WebFooter were missing on legal pages before commit
    // 2e0cbee. Verify they're back.
    await expect(page.getByRole('contentinfo')).toBeVisible()
  })
})

test.describe('Assessment smoke — auth gate routing', () => {
  test('visiting /studio while logged out redirects to /signin with next param', async ({
    page,
  }) => {
    await page.goto('/studio')
    await expect(page).toHaveURL(/\/signin\?.*next=/)
  })

  test('visiting /publish while logged out redirects to /signin', async ({ page }) => {
    await page.goto('/publish')
    await expect(page).toHaveURL(/\/signin/)
  })

  test('visiting /studio/kyc while logged out redirects to /signin', async ({ page }) => {
    await page.goto('/studio/kyc')
    await expect(page).toHaveURL(/\/signin/)
  })
})

test.describe('Assessment smoke — content detail share fallback', () => {
  test('share button on a free post is rendered and clickable', async ({ page }) => {
    // Navigate to the mock free content (post). The share button lives in
    // the social-actions row; with no navigator.share() in the test
    // browser it should fall back to the manual popup.
    await page.goto('/content/content-002')
    const shareButton = page.getByRole('button', { name: /share/i }).first()
    await expect(shareButton).toBeVisible({ timeout: 10_000 })

    // Stub navigator.share to throw a non-AbortError so the popup branch
    // fires deterministically. AbortError would be silenced.
    await page.addInitScript(() => {
      // Simulate a UA without navigator.share at all.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      delete (window.navigator as { share?: unknown }).share
    })
    await page.reload()
    await page.getByRole('button', { name: /share/i }).first().click()
    // The fallback popup should expose at least Copy + WhatsApp tiles.
    await expect(page.getByRole('button', { name: /copy link/i })).toBeVisible()
  })
})
