import { expect } from '@playwright/test'
import { Given, When, Then, gotoAndStash, visibleText } from '../fixtures'

// ── Backgrounds ──────────────────────────────────────────────────────────────

Given('I am browsing as a guest', async ({ ctx, context }) => {
  await context.clearCookies()
  ctx.isGuest = true
})

Given('I am on the home page', async ({ page, ctx }) => {
  await gotoAndStash(page, ctx, '/')
})

// ── Navigation primitives ─────────────────────────────────────────────────────

When('I visit the home page', async ({ page, ctx }) => {
  await gotoAndStash(page, ctx, '/')
})

When('I visit the discover page', async ({ page, ctx }) => {
  await gotoAndStash(page, ctx, '/discover')
})

When('I visit {string}', async ({ page, ctx }, path: string) => {
  await gotoAndStash(page, ctx, path)
})

When(
  'I visit the content detail page for {string}',
  async ({ page, ctx }, id: string) => {
    await gotoAndStash(page, ctx, `/content/${id}`)
  },
)

When(
  'I visit the creator profile {string}',
  async ({ page, ctx }, username: string) => {
    await gotoAndStash(page, ctx, `/travel/${username}`)
  },
)

When('I fetch {string}', async ({ request, ctx }, path: string) => {
  ctx.lastResponse = (await request.get(path)) as unknown as typeof ctx.lastResponse
})

// ── Status assertions ─────────────────────────────────────────────────────────

Then(
  'the page should respond with status {int}',
  async ({ ctx }, expected: number) => {
    expect(ctx.lastResponse, 'no response stashed — call a navigation step first').not.toBeNull()
    expect(ctx.lastResponse!.status()).toBe(expected)
  },
)

Then(
  'the response status should be {int}',
  async ({ ctx }, expected: number) => {
    expect(ctx.lastResponse).not.toBeNull()
    expect(ctx.lastResponse!.status()).toBe(expected)
  },
)

Then(
  'the response body should contain {string}',
  async ({ ctx }, needle: string) => {
    expect(ctx.lastResponse).not.toBeNull()
    const body = await ctx.lastResponse!.text()
    expect(body).toContain(needle)
  },
)

// ── URL assertions ────────────────────────────────────────────────────────────

Then('the URL should be {string}', async ({ page }, expected: string) => {
  // Compare path + search; ignore origin so tests don't break on port changes.
  const url = new URL(page.url())
  expect(url.pathname + url.search).toBe(expected)
})

Then(
  'the URL should still be the content detail page',
  async ({ page }) => {
    expect(page.url()).toMatch(/\/content\//)
  },
)

// ── Visible-body assertions (strip scripts → human-visible text) ──────────────

Then(
  'the visible body should contain {string}',
  async ({ page }, needle: string) => {
    const html = await page.content()
    const text = visibleText(html)
    expect(text).toContain(needle)
  },
)

Then(
  'the visible body should not contain {string}',
  async ({ page }, needle: string) => {
    const html = await page.content()
    const text = visibleText(html)
    expect(text).not.toContain(needle)
  },
)

Then('I should see {string}', async ({ page }, needle: string) => {
  const html = await page.content()
  const text = visibleText(html)
  expect(text).toContain(needle)
})

Then(
  'I should see the heading {string}',
  async ({ page }, partial: string) => {
    const headings = page.locator('h1, h2, h3')
    await expect(headings.filter({ hasText: partial }).first()).toBeVisible()
  },
)

Then(
  'I should see the brand {string}',
  async ({ page }, brand: string) => {
    await expect(page.locator('.ch-brand').first()).toContainText(brand)
  },
)
