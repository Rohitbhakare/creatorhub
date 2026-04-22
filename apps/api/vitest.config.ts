import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  resolve: {
    alias: {
      // Resolve the workspace package without going through npm symlinks
      '@creatorhub/shared': resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  test: {
    // Use Node environment (not jsdom) — API is server-side
    environment: 'node',

    // Colocated test files
    include: ['src/**/*.test.ts'],

    // Coverage thresholds (fail CI if critical modules drop below 70%)
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/index.ts', 'src/env.ts'],
      thresholds: {
        // Global minimum
        lines: 50,
        functions: 50,
        // Per-file minimums for critical modules
      },
    },

    // Global setup for env vars in tests — avoid hitting real services
    env: {
      NODE_ENV: 'test',
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n',
      FIREBASE_CLIENT_EMAIL: 'test@test.iam.gserviceaccount.com',
      JWT_SECRET: 'test-jwt-secret-minimum-32-characters-long',
      RAZORPAY_KEY_ID: 'rzp_test_placeholder',
      RAZORPAY_KEY_SECRET: 'test_secret',
      RAZORPAY_WEBHOOK_SECRET: 'test_webhook',
      GOOGLE_PLACES_API_KEY: 'test_places_key',
      ADMIN_SESSION_SECRET: 'test-admin-session-secret-minimum-32-characters',
      FIREBASE_WEB_API_KEY: 'test-firebase-web-api-key',
      ADMIN_SECRET: 'test-admin-legacy-secret-16chars',
    },
  },
})
