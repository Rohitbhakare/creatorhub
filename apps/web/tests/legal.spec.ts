import { test, expect } from '@playwright/test'

test.describe('Terms of Service page', () => {
  test('loads and contains terms content', async ({ page }) => {
    await page.goto('/terms')
    await expect(page).toHaveTitle(/Terms/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('back-links to home via CreatorHub logo', async ({ page }) => {
    await page.goto('/terms')
    const homeLink = page.getByRole('link', { name: 'CreatorHub' })
    await expect(homeLink).toBeVisible()
  })
})

test.describe('Privacy Policy page', () => {
  test('loads and contains privacy content', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page).toHaveTitle(/Privacy/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('Community Guidelines page', () => {
  test('loads and contains guidelines content', async ({ page }) => {
    await page.goto('/community-guidelines')
    await expect(page).toHaveTitle(/Community/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
