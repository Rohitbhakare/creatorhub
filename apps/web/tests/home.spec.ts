import { test, expect } from '@playwright/test'

test.describe('Home page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('renders correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/CreatorHub/)
  })

  test('renders hero H1 with brand copy', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Travel stories, real experiences')
  })

  test('App Store download link is present', async ({ page }) => {
    const link = page.getByRole('link', { name: /App Store/i }).first()
    await expect(link).toBeVisible()
  })

  test('Google Play download link is present', async ({ page }) => {
    const link = page.getByRole('link', { name: /Google Play/i }).first()
    await expect(link).toBeVisible()
  })

  test('renders all 3 feature cards', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Authentic Stories' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Book Experiences' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Meet Local Creators' })).toBeVisible()
  })

  test('renders all 4 content type cards', async ({ page }) => {
    // exact:true avoids case-insensitive substring matching hitting "events" in descriptions
    const section = page.locator('section').filter({ hasText: 'Four content types' })
    await expect(section.getByText('Posts', { exact: true })).toBeVisible()
    await expect(section.getByText('Itineraries', { exact: true })).toBeVisible()
    await expect(section.getByText('Experiences', { exact: true })).toBeVisible()
    await expect(section.getByText('Events', { exact: true })).toBeVisible()
  })

  test('navigation links point to correct pages', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Terms' }).first()).toHaveAttribute('href', '/terms')
    await expect(page.getByRole('link', { name: 'Privacy' }).first()).toHaveAttribute('href', '/privacy')
  })

  test('footer legal links are present', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Terms of Service' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Community Guidelines' })).toBeVisible()
  })

  test('footer copyright text is present', async ({ page }) => {
    // Use role selector to target footer specifically — avoids multi-match with header logo
    await expect(page.getByRole('contentinfo')).toContainText('CreatorHub')
  })
})
