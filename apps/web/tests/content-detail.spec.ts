import { test, expect } from '@playwright/test'

// Mock data matches tests/mock-api-server.mjs fixtures
const FREE_URL = '/content/content-002'
const PAID_URL = '/content/content-001'

test.describe('Content detail — free post', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(FREE_URL)
  })

  test('renders page title from content title', async ({ page }) => {
    await expect(page).toHaveTitle(/Sunrise at Kedarnath/)
  })

  test('renders content title as H1', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Sunrise at Kedarnath' })).toBeVisible()
  })

  test('renders Post type badge', async ({ page }) => {
    await expect(page.getByText('Post')).toBeVisible()
  })

  test('renders FREE price label', async ({ page }) => {
    await expect(page.getByText('FREE')).toBeVisible()
  })

  test('renders post body text', async ({ page }) => {
    await expect(page.getByText('The air was cold, the trail was steep')).toBeVisible()
  })

  test('renders creator name', async ({ page }) => {
    await expect(page.getByText('Rohit Travels')).toBeVisible()
  })

  test('renders creator @username', async ({ page }) => {
    await expect(page.getByText('@testcreator')).toBeVisible()
  })

  test('View Profile link goes to creator mini-site', async ({ page }) => {
    const link = page.getByRole('link', { name: 'View Profile' })
    await expect(link).toHaveAttribute('href', '/travel/testcreator')
  })

  test('"Open in App" deep-link is present', async ({ page }) => {
    const btn = page.getByRole('link', { name: 'Open in App' })
    await expect(btn).toHaveAttribute('href', /creatorhub:\/\/content\/content-002/)
  })

  test('free CTA reads "Read more in App"', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Read more in App' })).toBeVisible()
  })
})

test.describe('Content detail — paid itinerary', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PAID_URL)
  })

  test('renders content title as H1', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Bali in 5 Days' })).toBeVisible()
  })

  test('renders Itinerary type badge', async ({ page }) => {
    await expect(page.getByText('Itinerary')).toBeVisible()
  })

  test('renders formatted price ₹6,500', async ({ page }) => {
    await expect(page.getByText('₹6,500')).toBeVisible()
  })

  test('renders content description', async ({ page }) => {
    await expect(page.getByText("A curated 5-day travel plan through Bali's best spots.")).toBeVisible()
  })

  test('paid CTA reads "Book on CreatorHub"', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Book on CreatorHub' })).toBeVisible()
  })

  test('"Open in App" deep-link is present', async ({ page }) => {
    const btn = page.getByRole('link', { name: 'Open in App' })
    await expect(btn).toHaveAttribute('href', /creatorhub:\/\/content\/content-001/)
  })
})

test.describe('Content detail — unknown content', () => {
  test('returns 404 for an unknown content ID', async ({ page }) => {
    const response = await page.goto('/content/does-not-exist')
    expect(response?.status()).toBe(404)
  })
})
