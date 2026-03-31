import { test, expect } from '@playwright/test'
import { expectHeading, expectNoErrors, navigateAndWait } from '../../helpers/page-utils'

test.describe('Dashboard', () => {
  test('loads dashboard without errors', async ({ page }) => {
    await navigateAndWait(page, '/')
    await expectNoErrors(page)
    // Should show some dashboard content (role-based)
    await expect(page.locator('body')).not.toContainText('Sign in')
  })

  test('sidebar navigation is present', async ({ page }) => {
    await navigateAndWait(page, '/')
    // Key navigation items should be visible
    const nav = page.locator('nav, aside, [role="navigation"]')
    await expect(nav.first()).toBeVisible()
  })

  test('sidebar links are functional', async ({ page }) => {
    await navigateAndWait(page, '/')

    const navLinks = [
      { text: /vendors/i, url: '/vendors' },
      { text: /purchase.*order|PO/i, url: '/purchase-orders' },
      { text: /GRN|goods/i, url: '/grn' },
      { text: /items|inventory/i, url: '/items' },
    ]

    for (const { text, url } of navLinks) {
      const link = page.getByRole('link', { name: text }).first()
      if (await link.isVisible().catch(() => false)) {
        await link.click()
        await page.waitForLoadState('networkidle')
        await expect(page).toHaveURL(new RegExp(url))
        await expectNoErrors(page)
        // Navigate back
        await page.goto('/')
        await page.waitForLoadState('networkidle')
      }
    }
  })

  test('MyActions component renders', async ({ page }) => {
    await navigateAndWait(page, '/')
    // MyActions shows pending approvals, tasks, etc.
    // Just verify no crash — content depends on data state
    await expectNoErrors(page)
  })
})
