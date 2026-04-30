import { test as base, type Page, type Response } from '@playwright/test'
import { createBdd, test as bddTest } from 'playwright-bdd'

/**
 * Custom Playwright fixtures shared across BDD step definitions.
 * Adds a `ctx` slot so steps can stash response handles + flow flags
 * across step boundaries.
 *
 * Importantly, we extend the `test` re-exported from playwright-bdd —
 * createBdd() refuses to bind to a base @playwright/test test object.
 */
type CtxFixtures = {
  ctx: {
    lastResponse: Response | null
    isGuest: boolean
  }
}

export const test = bddTest.extend<CtxFixtures>({
  // eslint-disable-next-line no-empty-pattern
  ctx: async ({}, use) => {
    await use({ lastResponse: null, isGuest: false })
  },
})

export const { Given, When, Then, Step } = createBdd(test)
// Re-export Page in case step files need the type.
export type { Page }

/**
 * Strip script/style tags + collapse whitespace so "visible body should
 * contain X" reflects what a human reader sees, not the RSC payload that
 * is also embedded in the HTML response (which contains every string the
 * page references for hydration).
 */
export function visibleText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#xa0;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&hellip;/g, '…')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Navigate and stash the response so subsequent step assertions can read it.
 * Uses `domcontentloaded` (not networkidle) so quick redirects + clicks
 * settle fast. Steps that need streamed RSC content (CommentsSection,
 * EndOfArticleRail) should explicitly wait for their target selector. */
export async function gotoAndStash(
  page: Page,
  ctx: CtxFixtures['ctx'],
  path: string,
): Promise<void> {
  ctx.lastResponse = await page.goto(path, { waitUntil: 'domcontentloaded' })
}
