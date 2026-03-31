import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.use({ storageState: { cookies: [], origins: [] } }) // Start unauthenticated

  test('shows login page for unauthenticated user', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('h1')).toContainText('Health1 VPMS')
    await expect(page.getByLabel('Email address')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email address').fill('invalid@test.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    // Error message should appear
    await expect(page.locator('text=/invalid|unauthorized|error/i')).toBeVisible({ timeout: 10_000 })
    // Should still be on login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('successful login redirects to dashboard', async ({ page }) => {
    const email = process.env.E2E_USER_EMAIL
    const password = process.env.E2E_USER_PASSWORD
    if (!email || !password) {
      test.skip(true, 'E2E_USER_EMAIL/PASSWORD not set')
      return
    }

    await page.goto('/login')
    await page.getByLabel('Email address').fill(email)
    await page.getByLabel('Password').fill(password)
    await page.getByRole('button', { name: /sign in/i }).click()

    await page.waitForURL('/', { timeout: 15_000 })
    await expect(page.locator('body')).not.toContainText('Sign in')
  })

  test('protected routes redirect to login', async ({ page }) => {
    // Try accessing protected routes directly
    const protectedRoutes = [
      '/vendors',
      '/purchase-orders',
      '/grn',
      '/finance/invoices',
      '/items',
      '/settings/users',
    ]

    for (const route of protectedRoutes) {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/, {
        timeout: 10_000,
      })
    }
  })
})
