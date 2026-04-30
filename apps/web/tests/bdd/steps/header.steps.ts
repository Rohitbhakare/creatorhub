import { expect } from '@playwright/test'
import { Then, When } from '../fixtures'

// Selectors are scoped to <header> so the same labels elsewhere on the page
// (e.g. "Sign in" stub on a content page) don't false-positive.

Then(
  'the header should have a search icon linking to {string}',
  async ({ page }, expectedHref: string) => {
    const icon = page.locator('header a[aria-label="Search"]')
    await expect(icon).toBeVisible()
    const href = await icon.getAttribute('href')
    expect(href).toBe(expectedHref)
  },
)

Then(
  'the header should have exactly {int} {string} button',
  async ({ page }, expected: number, label: string) => {
    const matches = page.locator(`header :is(a, button):has-text("${label}")`)
    await expect(matches).toHaveCount(expected)
  },
)

Then(
  'the header should not contain a wide search-pill text {string}',
  async ({ page }, needle: string) => {
    await expect(page.locator('header')).not.toContainText(needle)
  },
)

Then(
  'the header should not contain a {string} text link',
  async ({ page }, label: string) => {
    const links = page.locator(`header a:has-text("${label}")`)
    await expect(links).toHaveCount(0)
  },
)

When(
  'I click the {string} button in the header',
  async ({ page }, label: string) => {
    await page.locator(`header :is(a, button):has-text("${label}")`).first().click()
    await page.waitForLoadState('domcontentloaded')
  },
)

When(
  'I click the search icon in the header',
  async ({ page }) => {
    await page.locator('header a[aria-label="Search"]').first().click()
    await page.waitForLoadState('domcontentloaded')
  },
)
