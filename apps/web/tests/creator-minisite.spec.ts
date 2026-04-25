import { test, expect } from '@playwright/test'

// Mock data matches tests/mock-api-server.mjs MOCK_CREATOR fixture
const CREATOR_URL = '/travel/testcreator'

test.describe('Creator mini-site — known creator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CREATOR_URL)
  })

  test('renders creator display name as H1', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Rohit Travels' })).toBeVisible()
  })

  test('renders creator @username', async ({ page }) => {
    await expect(page.getByText('@testcreator')).toBeVisible()
  })

  test('renders creator bio', async ({ page }) => {
    await expect(page.getByText('Exploring India one city at a time')).toBeVisible()
  })

  test('renders follower count', async ({ page }) => {
    await expect(page.getByText('1,234')).toBeVisible()
    await expect(page.getByText('Followers')).toBeVisible()
  })

  test('renders content count', async ({ page }) => {
    // exact:true avoids matching ancestor divs whose combined text also contains these strings
    await expect(page.getByText('8', { exact: true })).toBeVisible()
    await expect(page.getByText('Posts', { exact: true })).toBeVisible()
  })

  test('renders average rating', async ({ page }) => {
    await expect(page.getByText(/4\.7/)).toBeVisible()
    await expect(page.getByText('Rating')).toBeVisible()
  })

  test('renders content grid with both content items', async ({ page }) => {
    await expect(page.getByText('Bali in 5 Days')).toBeVisible()
    await expect(page.getByText('Sunrise at Kedarnath')).toBeVisible()
  })

  test('paid content card shows formatted price', async ({ page }) => {
    await expect(page.getByText('₹6,500')).toBeVisible()
  })

  test('free content card shows FREE label', async ({ page }) => {
    await expect(page.getByText('FREE')).toBeVisible()
  })

  test('content card links to content detail page', async ({ page }) => {
    const link = page.getByRole('link', { name: /Bali in 5 Days/ })
    await expect(link).toHaveAttribute('href', '/content/content-001')
  })

  test('"Open in App" button is present', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Open in App' })).toBeVisible()
  })

  test('"Open in App" button deep-links to app', async ({ page }) => {
    const btn = page.getByRole('link', { name: 'Open in App' })
    await expect(btn).toHaveAttribute('href', /creatorhub:\/\/creator\/testcreator/)
  })

  test('CreatorHub logo links back to home', async ({ page }) => {
    const logo = page.getByRole('link', { name: 'CreatorHub' })
    await expect(logo).toHaveAttribute('href', '/')
  })

  test('app store download links in footer are present', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'App Store' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Google Play' })).toBeVisible()
  })
})

test.describe('Creator mini-site — unknown creator', () => {
  test('returns 404 for an unknown username', async ({ page }) => {
    const response = await page.goto('/travel/nobody-real')
    expect(response?.status()).toBe(404)
  })
})
