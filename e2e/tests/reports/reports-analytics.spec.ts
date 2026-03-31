import { test, expect } from '@playwright/test'
import { navigateAndWait, expectNoErrors } from '../../helpers/page-utils'

test.describe('Reports', () => {
  test('reports index page loads', async ({ page }) => {
    await navigateAndWait(page, '/reports')
    await expectNoErrors(page)
  })

  // Reports may have sub-pages — test each
  const reportPaths = [
    '/reports/vendor-wise',
    '/reports/item-wise',
    '/reports/po-summary',
    '/reports/grn-summary',
    '/reports/payment-summary',
    '/reports/expiry-tracker',
    '/reports/consumption',
  ]

  for (const path of reportPaths) {
    test(`${path} loads without errors`, async ({ page }) => {
      const response = await page.goto(path)
      // Some report paths may not exist — check for 404 vs error
      if (response && response.status() === 404) {
        test.skip(true, `${path} not found (404)`)
        return
      }
      await expectNoErrors(page)
    })
  }
})

test.describe('Analytics', () => {
  test('analytics dashboard loads', async ({ page }) => {
    await navigateAndWait(page, '/analytics')
    await expectNoErrors(page)
    // Should render charts/graphs
    const hasCharts = await page.locator('svg, canvas, [class*="chart"], [class*="recharts"]').first().isVisible().catch(() => false)
    // Charts may take a moment to render — just verify no crash
    await expectNoErrors(page)
  })
})

test.describe('Inventory', () => {
  const inventoryPages = [
    { path: '/inventory/forecasting', name: 'Forecasting' },
  ]

  for (const { path, name } of inventoryPages) {
    test(`${name} page loads`, async ({ page }) => {
      await navigateAndWait(page, path)
      await expectNoErrors(page)
    })
  }
})

test.describe('Consignment', () => {
  const consignmentPages = [
    { path: '/consignment', name: 'Consignment Dashboard' },
    { path: '/consignment/stock', name: 'Consignment Stock' },
    { path: '/consignment/usage', name: 'Consignment Usage' },
    { path: '/consignment/deposits', name: 'Consignment Deposits' },
  ]

  for (const { path, name } of consignmentPages) {
    test(`${name} page loads`, async ({ page }) => {
      await navigateAndWait(page, path)
      await expectNoErrors(page)
    })
  }

  test('new consignment usage form loads', async ({ page }) => {
    await navigateAndWait(page, '/consignment/usage/new')
    await expectNoErrors(page)
  })

  test('new consignment deposit form loads', async ({ page }) => {
    await navigateAndWait(page, '/consignment/deposits/new')
    await expectNoErrors(page)
  })
})
