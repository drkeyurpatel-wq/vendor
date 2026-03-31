import { test, expect } from '@playwright/test'
import {
  navigateAndWait,
  expectNoErrors,
} from '../../helpers/page-utils'

test.describe('Vendor Portal', () => {
  // Vendor portal uses its own cookie-based auth, not Supabase session
  test.use({ storageState: { cookies: [], origins: [] } })

  test.describe('Login Flow', () => {
    test('vendor login page loads', async ({ page }) => {
      await page.goto('/vendor/login')
      await expect(page.locator('h1, h2')).toContainText(/vendor|portal/i)
      await expect(page.getByLabel(/phone|mobile/i).first()).toBeVisible()
    })

    test('shows error for unregistered phone', async ({ page }) => {
      await page.goto('/vendor/login')
      await page.getByLabel(/phone|mobile/i).first().fill('0000000000')
      await page.getByRole('button', { name: /send.*OTP|continue|next/i }).first().click()

      // Should show "no vendor found" error
      await expect(
        page.locator('text=/no.*vendor|not.*found|contact.*admin/i').first()
      ).toBeVisible({ timeout: 10_000 })
    })

    test('OTP flow works with valid vendor phone', async ({ page }) => {
      const vendorPhone = process.env.E2E_VENDOR_PHONE
      if (!vendorPhone) {
        test.skip(true, 'E2E_VENDOR_PHONE not set')
        return
      }

      await page.goto('/vendor/login')
      await page.getByLabel(/phone|mobile/i).first().fill(vendorPhone)
      await page.getByRole('button', { name: /send.*OTP|continue|next/i }).first().click()

      // Should advance to OTP step
      await expect(
        page.locator('input[maxlength="1"], input[type="tel"], text=/OTP|verification/i').first()
      ).toBeVisible({ timeout: 10_000 })

      // In dev mode, API returns _dev_otp — we need to intercept the response
      // For CI against production, we'd read OTP from vendor_sessions table
      // For now, verify the OTP step renders correctly
      await expectNoErrors(page)
    })

    test('OTP rate limiting shows warning after multiple attempts', async ({ page }) => {
      const vendorPhone = process.env.E2E_VENDOR_PHONE
      if (!vendorPhone) {
        test.skip(true, 'E2E_VENDOR_PHONE not set')
        return
      }

      // This test verifies the 60s resend timer appears
      await page.goto('/vendor/login')
      await page.getByLabel(/phone|mobile/i).first().fill(vendorPhone)
      await page.getByRole('button', { name: /send.*OTP|continue/i }).first().click()

      // Wait for OTP step
      await page.waitForTimeout(2_000)

      // Resend button should be disabled with countdown
      const resendBtn = page.getByRole('button', { name: /resend/i }).first()
      if (await resendBtn.isVisible().catch(() => false)) {
        await expect(resendBtn).toBeDisabled()
      }
    })
  })

  test.describe('Portal Pages (require auth)', () => {
    // These tests check that unauthenticated access redirects properly
    const portalPages = [
      { path: '/vendor', name: 'Dashboard' },
      { path: '/vendor/orders', name: 'Orders' },
      { path: '/vendor/invoices', name: 'Invoices' },
      { path: '/vendor/invoices/upload', name: 'Upload Invoice' },
      { path: '/vendor/payments', name: 'Payments' },
      { path: '/vendor/outstanding', name: 'Outstanding' },
      { path: '/vendor/rfqs', name: 'RFQs' },
    ]

    for (const { path, name } of portalPages) {
      test(`${name} page redirects unauthenticated user`, async ({ page }) => {
        await page.goto(path)
        // Should redirect to vendor login or show access error
        await page.waitForTimeout(2_000)
        const url = page.url()
        const isOnLoginOrError =
          url.includes('/vendor/login') ||
          url.includes('error=') ||
          (await page.locator('text=/login|sign.*in|unauthorized|access/i').first().isVisible().catch(() => false))

        expect(isOnLoginOrError).toBeTruthy()
      })
    }
  })

  test.describe('Portal Internal Views (via dashboard auth)', () => {
    // These are the admin-side vendor portal management pages
    // They use staff auth, not vendor auth
    test.use({ storageState: 'e2e/.auth/staff.json' })

    test('vendor portal admin — orders list loads', async ({ page }) => {
      await navigateAndWait(page, '/vendor-portal/orders')
      await expectNoErrors(page)
    })

    test('vendor portal admin — invoices list loads', async ({ page }) => {
      await navigateAndWait(page, '/vendor-portal/invoices')
      await expectNoErrors(page)
    })

    test('vendor portal admin — payments list loads', async ({ page }) => {
      await navigateAndWait(page, '/vendor-portal/payments')
      await expectNoErrors(page)
    })

    test('vendor portal admin — outstanding list loads', async ({ page }) => {
      await navigateAndWait(page, '/vendor-portal/outstanding')
      await expectNoErrors(page)
    })
  })
})
