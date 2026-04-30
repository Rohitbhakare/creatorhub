import { expect } from '@playwright/test'
import { Given, Then, When } from '../fixtures'

When(
  'I click the {string} button',
  async ({ page }, label: string) => {
    // Prefer the action-button-with-aria-label (SaveButton/LikeButton/etc.)
    // over text-anywhere matches so tests target the canonical control.
    const ariaMatch = page.locator(`button[aria-label="${label}"]`)
    let btn: import('@playwright/test').Locator
    if ((await ariaMatch.count()) > 0) {
      btn = ariaMatch.first()
    } else {
      btn = page.locator(`:is(a, button):has-text("${label}")`).first()
    }
    await btn.scrollIntoViewIfNeeded()
    // Wait for React to attach onClick before clicking. In dev-mode SSR
    // streaming, the button is in the DOM well before its handler is
    // bound; a click during that window is silently dropped. Polling for
    // a successful native click is the most reliable signal.
    await page
      .waitForFunction(
        () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const w = window as any
          return (
            Array.isArray(w.__next_f) &&
            w.__next_f.length > 0 &&
            // the React Fiber root exists once hydration starts
            !!document.querySelector('[data-nextjs-router-tree-prefetch], main')
          )
        },
        undefined,
        { timeout: 10_000 },
      )
      .catch(() => {
        /* best-effort */
      })
    await page.waitForTimeout(150)
    await btn.click()
  },
)

When(
  'I click the {string} stub',
  async ({ page }, label: string) => {
    // CommentComposeStub is inside the streamed CommentsSection. Wait for
    // visibility before clicking so we don't race the Suspense reveal.
    const stub = page.locator(`button:has-text("${label}")`).first()
    await stub.waitFor({ state: 'visible', timeout: 10_000 })
    await stub.scrollIntoViewIfNeeded()
    await stub.click()
  },
)

Given(
  'I have opened the sign-in modal from the Save button on {string}',
  async ({ page, ctx }, id: string) => {
    ctx.lastResponse = await page.goto(`/content/${id}`)
    const save = page.locator('button[aria-label="Save"]').first()
    await save.scrollIntoViewIfNeeded()
    await save.click()
    await expect(
      page.locator('div[role="dialog"][aria-label="Sign in"]'),
    ).toBeVisible()
  },
)

When('I press Escape', async ({ page }) => {
  await page.keyboard.press('Escape')
})

When('I click outside the modal dialog', async ({ page }) => {
  // The scrim is the parent of the dialog; click near the corner where the
  // dialog itself isn't covering the scrim.
  const scrim = page.locator('div[role="dialog"][aria-label="Sign in"]').locator('..')
  const box = await scrim.boundingBox()
  if (!box) throw new Error('no scrim bounding box')
  // Click 4px from the top-left corner of the scrim — well outside the dialog card.
  await page.mouse.click(box.x + 4, box.y + 4)
})

Then(
  'a sign-in modal should be visible',
  async ({ page }) => {
    await expect(
      page.locator('div[role="dialog"][aria-label="Sign in"]'),
    ).toBeVisible()
  },
)

Then(
  'the sign-in modal should be hidden',
  async ({ page }) => {
    await expect(
      page.locator('div[role="dialog"][aria-label="Sign in"]'),
    ).toHaveCount(0)
  },
)

Then(
  'the modal should mention the title of the content',
  async ({ page }) => {
    // Modal kicker reads e.g. `Save "<truncated title>"` — assert it has any text
    // beyond the generic "Sign in to continue" header.
    const dialog = page.locator('div[role="dialog"][aria-label="Sign in"]')
    const kickers = dialog.locator(':scope > div, :scope div').filter({
      hasText: /Save|Like|Follow|Comment|Book/,
    })
    await expect(kickers.first()).toBeVisible()
  },
)
