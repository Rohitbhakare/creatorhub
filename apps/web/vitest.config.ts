import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const aliases = {
  '@': path.resolve(__dirname, 'src'),
}

/**
 * Two project trees:
 * - "node"   — pure JS/TS unit tests (errors, slug helpers, etc.)
 * - "widget" — React component tests with jsdom + Testing Library
 *
 * Mirrors the Flutter widget-test pattern from
 * apps/mobile/test/features/<feature>/widgets/. Each component test
 * renders the component in isolation and asserts on its rendered DOM
 * + behaviour.
 *
 * Both projects need the @/ → src/ alias declared explicitly because
 * vitest's projects array doesn't inherit `resolve` from the root config.
 */
export default defineConfig({
  resolve: { alias: aliases },
  test: {
    globals: true,
    projects: [
      {
        resolve: { alias: aliases },
        test: {
          name: 'node',
          environment: 'node',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.test.tsx'],
        },
      },
      {
        resolve: { alias: aliases },
        plugins: [react()],
        test: {
          name: 'widget',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./vitest.setup.ts'],
        },
      },
    ],
  },
})
