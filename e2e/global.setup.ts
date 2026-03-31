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

  // Wait for redirect to dashboard
  await page.waitForURL('/', { timeout: 15_000 })

  // Verify dashboard loaded (role-based dashboard component renders)
  await expect(page.locator('body')).not.toContainText('Sign in')

  // Save session state
  await page.context().storageState({ path: path.join(authDir, 'staff.json') })
})
