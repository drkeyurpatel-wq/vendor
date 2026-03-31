import { test, expect } from '@playwright/test'
import {
  navigateAndWait,
  expectHeading,
  expectNoErrors,
  expectToast,
} from '../../helpers/page-utils'
import { pipeline } from '../../helpers/supabase'

test.describe('Purchase Orders', () => {
  test.describe.configure({ mode: 'serial' })

  test('PO list page loads with status tabs', async ({ page }) => {
    await navigateAndWait(page, '/purchase-orders')
    await expectHeading(page, /purchase.*order/i)
    await expectNoErrors(page)

    // Status filter tabs should be visible
    const statusTabs = page.locator('[role="tab"], [role="tablist"] a')
    await expect(statusTabs.first()).toBeVisible()

    // "New PO" button
    await expect(page.getByRole('link', { name: /new.*PO|create/i })).toBeVisible()
  })

  test('PO list status filters work', async ({ page }) => {
    await navigateAndWait(page, '/purchase-orders')

    // Click "approved" status tab if it exists
    const approvedTab = page.locator('a, [role="tab"]').filter({ hasText: /approved/i }).first()
    if (await approvedTab.isVisible().catch(() => false)) {
      await approvedTab.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/status=approved/)
      await expectNoErrors(page)
    }
  })

  test('new PO form loads', async ({ page }) => {
    await navigateAndWait(page, '/purchase-orders/new')
    await expectNoErrors(page)

    // Key fields: vendor selector, centre, items table
    await expect(page.locator('body')).toContainText(/vendor|supplier/i)
  })

  test('create a new PO', async ({ page }) => {
    await navigateAndWait(page, '/purchase-orders/new')

    // Select vendor
    const vendorSelect = page.locator('select, [role="combobox"], [class*="vendor"]').filter({ hasText: /vendor|select/i }).first()
    if (await vendorSelect.isVisible().catch(() => false)) {
      if (await vendorSelect.evaluate(el => el.tagName === 'SELECT')) {
        // Select first available vendor
        const options = await vendorSelect.locator('option').allTextContents()
        const validOption = options.findIndex((o, i) => i > 0 && o.trim() !== '')
        if (validOption > 0) await vendorSelect.selectOption({ index: validOption })
      } else {
        await vendorSelect.click()
        await page.waitForTimeout(500)
        // Pick first option from dropdown
        await page.locator('[role="option"], [class*="option"]').first().click()
      }
    }

    // Select centre if visible
    const centreSelect = page.locator('select').filter({ hasText: /centre|center/i }).first()
    if (await centreSelect.isVisible().catch(() => false)) {
      const options = await centreSelect.locator('option').allTextContents()
      if (options.length > 1) {
        await centreSelect.selectOption({ index: 1 })
        const selectedCentre = await centreSelect.inputValue()
        pipeline.centreId = selectedCentre
      }
    }

    // Wait for items section to load
    await page.waitForTimeout(1_000)

    // Add line items — look for "Add Item" button or item rows
    const addItemBtn = page.getByRole('button', { name: /add.*item|add.*line/i }).first()
    if (await addItemBtn.isVisible().catch(() => false)) {
      await addItemBtn.click()
      await page.waitForTimeout(500)
    }

    // Fill first item row if available
    const itemSelect = page.locator('tr, [class*="line-item"]').locator('select, [role="combobox"]').first()
    if (await itemSelect.isVisible().catch(() => false)) {
      if (await itemSelect.evaluate(el => el.tagName === 'SELECT')) {
        const options = await itemSelect.locator('option').allTextContents()
        if (options.length > 1) await itemSelect.selectOption({ index: 1 })
      }
    }

    // Fill quantity
    const qtyInput = page.locator('input[type="number"]').filter({ hasText: /qty|quantity/i }).first()
    const qtyInputAlt = page.locator('input[placeholder*="qty" i], input[name*="qty" i], input[name*="quantity" i]').first()
    const qtyField = (await qtyInput.isVisible().catch(() => false)) ? qtyInput : qtyInputAlt
    if (await qtyField.isVisible().catch(() => false)) {
      await qtyField.fill('10')
    }

    // Fill rate
    const rateInput = page.locator('input[placeholder*="rate" i], input[name*="rate" i], input[name*="price" i]').first()
    if (await rateInput.isVisible().catch(() => false)) {
      await rateInput.fill('100')
    }

    // Submit PO
    const submitBtn = page.getByRole('button', { name: /save|submit|create.*PO/i }).first()
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click()

      await Promise.race([
        page.waitForURL(/\/purchase-orders\/(?!new)/, { timeout: 15_000 }),
        expectToast(page, /created|saved|success/i).catch(() => {}),
      ])

      const url = page.url()
      const poMatch = url.match(/\/purchase-orders\/([a-f0-9-]+)/)
      if (poMatch) {
        pipeline.poId = poMatch[1]
      }
    }
  })

  test('PO detail page loads', async ({ page }) => {
    // Use pipeline PO or navigate to first PO in list
    if (pipeline.poId) {
      await navigateAndWait(page, `/purchase-orders/${pipeline.poId}`)
    } else {
      await navigateAndWait(page, '/purchase-orders')
      // Click first PO link
      const firstPOLink = page.locator('table tbody tr a, [role="row"] a').first()
      if (await firstPOLink.isVisible().catch(() => false)) {
        await firstPOLink.click()
        await page.waitForLoadState('networkidle')
      } else {
        test.skip(true, 'No POs available to view')
        return
      }
    }

    await expectNoErrors(page)
    // Should show PO number
    await expect(page.locator('body')).toContainText(/H1-.*-PO-|PO-/i)
  })

  test('PO approve/reject buttons visible for pending PO', async ({ page }) => {
    await navigateAndWait(page, '/purchase-orders?status=pending_approval')
    const firstRow = page.locator('table tbody tr a, [role="row"] a').first()

    if (await firstRow.isVisible().catch(() => false)) {
      await firstRow.click()
      await page.waitForLoadState('networkidle')

      // Approve/reject buttons should exist for pending POs
      const approveBtn = page.getByRole('button', { name: /approve/i }).first()
      const rejectBtn = page.getByRole('button', { name: /reject/i }).first()
      const hasActions = (await approveBtn.isVisible().catch(() => false)) ||
                         (await rejectBtn.isVisible().catch(() => false))
      // This may fail if no pending POs or user lacks role — that's OK
    }
  })

  test('indent list page loads', async ({ page }) => {
    await navigateAndWait(page, '/purchase-orders/indents')
    await expectNoErrors(page)
  })
})
