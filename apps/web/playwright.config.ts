import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3003',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'iPhone 14',
      use: { ...devices['iPhone 14'] },
    },
  ],
  webServer: [
    {
      // Lightweight Node.js mock — intercepts SSR fetch() calls from Next.js server
      command: 'node tests/mock-api-server.mjs',
      url: 'http://localhost:9876/health',
      reuseExistingServer: !process.env.CI,
      timeout: 10_000,
    },
    {
      // Next.js dev server on 3003 (3001=API, 3002=admin app — both already in use)
      // Pointed at mock API so SSR pages don't need a real Hono/DB.
      // reuseExistingServer: false prevents accidentally reusing a wrong server.
      command: 'API_BASE_URL=http://localhost:9876 pnpm exec next dev --port 3003',
      url: 'http://localhost:3003',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
