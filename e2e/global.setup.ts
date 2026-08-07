import { test as setup, expect } from '@playwright/test'
import { mkdirSync } from 'fs'
import path from 'path'

const authDir = path.join(__dirname, '.auth')

setup('authenticate staff user', async ({ page }) => {
  mkdirSync(authDir, { recursive: true })

  const email = process.env.E2E_USER_EMAIL
  const password = process.env.E2E_USER_PASSWORD

  if (!email || !password) {
    throw new Error('E2E_USER_EMAIL and E2E_USER_PASSWORD must be set')
  }

  // Navigate to login page
  await page.goto('/login')
  await expect(page.locator('h1')).toContainText('Health1 VPMS')

  // Fill credentials
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password').fill(password)

  // Submit
  await page.getByRole('button', { name: /sign in/i }).click()

  // Wait for the redirect to the dashboard, but surface a rejected sign-in
  // rather than sitting here until the timeout. Waiting on the URL alone turns
  // "Invalid login credentials" into a bare 15s TimeoutError, which says
  // nothing about why the whole suite is about to skip.
  const loginError = page.getByRole('alert')
  const outcome = await Promise.race([
    page.waitForURL('/', { timeout: 15_000 }).then(() => 'ok' as const),
    loginError
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => 'rejected' as const)
      .catch(() => new Promise<never>(() => {})),
  ]).catch(() => 'timeout' as const)

  if (outcome === 'rejected') {
    const message = (await loginError.innerText().catch(() => '')).trim()
    throw new Error(
      `Sign-in was rejected for E2E_USER_EMAIL: ${message || 'no message shown'}. ` +
        'Check that the E2E_USER_EMAIL and E2E_USER_PASSWORD secrets point at a real staff account.'
    )
  }

  if (outcome === 'timeout') {
    throw new Error(
      'Sign-in neither completed nor reported an error within 15s. The app may not have ' +
        'reached Supabase — check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }

  // Verify dashboard loaded (role-based dashboard component renders)
  await expect(page.locator('body')).not.toContainText('Sign in')

  // Save session state
  await page.context().storageState({ path: path.join(authDir, 'staff.json') })
})
