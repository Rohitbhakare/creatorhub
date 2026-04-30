import { defineConfig, devices } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'

/**
 * BDD bridge — generates `.spec.ts` files at test-time from the Gherkin
 * feature files in tests/bdd/features/, dispatching to step impls in
 * tests/bdd/steps/. Mirrors the apps/mobile/integration_test BDD structure
 * so the two suites read the same way.
 *
 * Generated specs land in tests/bdd/.features-gen and are git-ignored.
 */
const bddDir = defineBddConfig({
  features: 'tests/bdd/features/**/*.feature',
  steps: ['tests/bdd/steps/**/*.ts', 'tests/bdd/fixtures.ts'],
  outputDir: 'tests/bdd/.features-gen',
})

export default defineConfig({
  // Two test trees: classic specs in tests/*.spec.ts AND the BDD-generated
  // specs in tests/bdd/.features-gen — Playwright walks both because we
  // include the parent dir in projects below.
  testDir: '.',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3003',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'classic',
      testDir: './tests',
      testMatch: /.*\.spec\.ts$/,
      testIgnore: /bdd\//,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'bdd',
      testDir: bddDir,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'bdd-mobile',
      testDir: bddDir,
      use: { ...devices['iPhone 14'] },
      grep: /@mobile|@all-viewports/,
    },
  ],
  webServer: [
    {
      command: 'node tests/mock-api-server.mjs > /tmp/pw-mock.log 2>&1',
      url: 'http://localhost:9876/health',
      reuseExistingServer: !process.env.CI,
      timeout: 10_000,
    },
    {
      // E2E_API_BASE_URL wins over API_BASE_URL in api-client.ts so the
      // dev server points at the mock even when .env.local declares a
      // different real API.
      command:
        'E2E_API_BASE_URL=http://localhost:9876 pnpm exec next dev --port 3003 > /tmp/pw-dev.log 2>&1',
      url: 'http://localhost:3003',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
