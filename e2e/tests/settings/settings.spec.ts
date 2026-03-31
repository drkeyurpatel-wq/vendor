import { test, expect } from '@playwright/test'
import { navigateAndWait, expectNoErrors, expectHeading } from '../../helpers/page-utils'

test.describe('Settings', () => {
  const settingsPages = [
    { path: '/settings/users', heading: /user/i },
    { path: '/settings/centres', heading: /centre|center/i },
    { path: '/settings/approvals', heading: /approval/i },
    { path: '/settings/delegations', heading: /delegat/i },
    { path: '/settings/rate-contracts', heading: /rate.*contract/i },
    { path: '/settings/audit-log', heading: /audit/i },
    { path: '/settings/audit-trail', heading: /audit.*trail/i },
    { path: '/settings/document-alerts', heading: /document|alert/i },
    { path: '/settings/data-import', heading: /import/i },
    { path: '/settings/api-docs', heading: /API/i },
    { path: '/settings/tally', heading: /tally/i },
  ]

  for (const { path, heading } of settingsPages) {
    test(`${path} loads without errors`, async ({ page }) => {
      await navigateAndWait(page, path)
      await expectNoErrors(page)
    })
  }

  test('rate contract creation form loads', async ({ page }) => {
    await navigateAndWait(page, '/settings/rate-contracts/new')
    await expectNoErrors(page)
  })

  test('user management shows user list', async ({ page }) => {
    await navigateAndWait(page, '/settings/users')
    await expectNoErrors(page)
    // Should show at least one user
    const rows = page.locator('table tbody tr, [role="row"]')
    await expect(rows.first()).toBeVisible({ timeout: 10_000 })
  })

  test('centres page shows active centres', async ({ page }) => {
    await navigateAndWait(page, '/settings/centres')
    await expectNoErrors(page)
    // Should show at least one centre (Shilaj, etc.)
    await expect(page.locator('body')).toContainText(/shilaj|vastral|modasa|gandhinagar|udaipur/i)
  })
})
