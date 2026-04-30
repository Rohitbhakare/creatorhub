import { expect } from '@playwright/test'
import { Then } from '../fixtures'

Then(
  'there should be exactly {int} visible {string} button',
  async ({ page }, expected: number, label: string) => {
    // Strict label match (not "Join free" or "Joining…") to avoid double counting.
    const buttons = page.locator(
      `:is(a, button) >> text=/^\\s*${label}\\s*$/`,
    )
    const visible = await buttons.evaluateAll((els) =>
      els.filter((e) => {
        const r = (e as HTMLElement).getBoundingClientRect()
        const cs = getComputedStyle(e as HTMLElement)
        return (
          r.width > 0 &&
          r.height > 0 &&
          cs.visibility !== 'hidden' &&
          cs.display !== 'none'
        )
      }).length,
    )
    expect(visible).toBe(expected)
  },
)

Then(
  'there should not be a {string} pink button next to the hero greeting',
  async ({ page }, label: string) => {
    // The earlier hero had a `ch-btn-primary` "Join free" beside the h1 —
    // we removed it. Guard against regression.
    const heroSection = page.locator('main > section').first()
    const btn = heroSection.locator(`a:has-text("${label}")`)
    await expect(btn).toHaveCount(0)
  },
)

Then(
  'the right rail should contain {string}',
  async ({ page }, needle: string) => {
    const aside = page.locator('main aside, main [role="complementary"]').first()
    await expect(aside).toContainText(needle)
  },
)

Then(
  'the right rail should not contain a {string} primary button paired with a {string} ghost button',
  async ({ page }, primary: string, ghost: string) => {
    const aside = page.locator('main aside').first()
    const primaryBtn = aside.locator(`a.ch-btn-primary:has-text("${primary}")`)
    const ghostBtn = aside.locator(`a.ch-btn-ghost:has-text("${ghost}")`)
    // Either of the two missing means the loud old card is gone.
    expect(
      (await primaryBtn.count()) === 0 || (await ghostBtn.count()) === 0,
    ).toBe(true)
  },
)

Then(
  'the footer should contain {string}',
  async ({ page }, needle: string) => {
    await expect(page.locator('footer')).toContainText(needle)
  },
)

Then(
  'the footer should not contain {string}',
  async ({ page }, needle: string) => {
    await expect(page.locator('footer')).not.toContainText(needle)
  },
)

Then(
  'I should see the comments header',
  async ({ page }) => {
    // CommentsSection is an async RSC streamed via Suspense. While the
    // section is suspended, its <section> sits inside a <div hidden>
    // placeholder so Playwright sees it as not visible. Explicitly wait
    // for the streamed reveal (10s ceiling — comments fetch is fast).
    await expect(
      page.locator('section[aria-label="Comments"]'),
    ).toBeVisible({ timeout: 10_000 })
  },
)

Then(
  'I should see the {string} stub',
  async ({ page }, label: string) => {
    await expect(
      page.locator(`button:has-text("${label}")`).first(),
    ).toBeVisible()
  },
)

Then(
  'I should see the creator-acquisition band',
  async ({ page }) => {
    await expect(
      page.locator('section[aria-label="For creators"]'),
    ).toBeVisible()
  },
)

Then(
  'the hero should not contain travel-only language',
  async ({ page }) => {
    const hero = page.locator('main > section').first()
    await expect(hero).not.toContainText('Travel stories worth saving')
  },
)
