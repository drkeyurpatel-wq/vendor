import { defineConfig, devices } from '@playwright/test'

/**
 * Health1 VPMS — Playwright E2E Configuration
 *
 * Runs against a real Supabase instance (production or staging).
 * Required env vars:
 *   E2E_BASE_URL          — App URL (default: http://localhost:3000)
 *   E2E_USER_EMAIL        — Supabase auth email for staff login
 *   E2E_USER_PASSWORD     — Supabase auth password
 *   E2E_VENDOR_PHONE      — Vendor portal test phone (10 digits)
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  — For test data setup/teardown
 */

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: false, // Sequential — P2P pipeline tests depend on order
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker — shared state across P2P pipeline
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['json', { outputFile: 'e2e-results.json' }]]
    : [['list'], ['html', { open: 'on-failure' }]],

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    // Setup: authenticate and save session state
    {
      name: 'setup',
      testDir: './e2e',
      testMatch: /global\.setup\.ts/,
    },

    // Main test suite — Desktop Chrome
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/staff.json',
      },
      dependencies: ['setup'],
    },

    // Mobile viewport tests (responsive)
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 7'],
        storageState: 'e2e/.auth/staff.json',
      },
      dependencies: ['setup'],
    },

    // Vendor portal — separate auth
    {
      name: 'vendor-portal',
      testMatch: /vendor-portal\/.*/,
      use: {
        ...devices['Desktop Chrome'],
        // Vendor portal uses cookie auth, not Supabase session
      },
      dependencies: ['setup'],
    },

    // Teardown: clean up test data
    {
      name: 'teardown',
      testDir: './e2e',
      testMatch: /global\.teardown\.ts/,
      dependencies: ['chromium', 'mobile-chrome', 'vendor-portal'],
    },
  ],

  // Dev server — start Next.js if not already running
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NODE_ENV: 'development', // Enables _dev_otp in vendor-auth
    },
  },
})
