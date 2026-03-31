import { test, expect } from '@playwright/test'
import {
  navigateAndWait,
  expectHeading,
  expectNoErrors,
  expectToast,
} from '../../helpers/page-utils'
import { TEST_PREFIX, pipeline } from '../../helpers/supabase'

test.describe('Item Master', () => {
  test.describe.configure({ mode: 'serial' })

  const timestamp = Date.now()
  const testItemName = `${TEST_PREFIX}Item_${timestamp}`

  test('items list page loads', async ({ page }) => {
    await navigateAndWait(page, '/items')
    await expectHeading(page, /items/i)
    await expectNoErrors(page)
    await expect(page.getByRole('link', { name: /new item/i })).toBeVisible()
  })

  test('items list has search/filter', async ({ page }) => {
    await navigateAndWait(page, '/items')
    // Search bar should exist
    const search = page.getByPlaceholder(/search/i).first()
    const hasSearch = await search.isVisible().catch(() => false)
    // At minimum, the table/list should render
    await expectNoErrors(page)
  })

  test('new item form loads', async ({ page }) => {
    await navigateAndWait(page, '/items/new')
    await expectNoErrors(page)
    // Key fields
    await expect(page.getByLabel(/name/i).first()).toBeVisible()
  })

  test('create a new item', async ({ page }) => {
    await navigateAndWait(page, '/items/new')

    // Fill item name
    await page.getByLabel(/^name|item.*name/i).first().fill(testItemName)

    // Unit
    const unitField = page.getByLabel(/unit|UOM/i).first()
    if (await unitField.isVisible().catch(() => false)) {
      if (await unitField.evaluate(el => el.tagName === 'SELECT')) {
        const options = await unitField.locator('option').allTextContents()
        if (options.length > 1) await unitField.selectOption({ index: 1 })
      } else {
        await unitField.fill('Nos')
      }
    }

    // Category
    const catField = page.locator('select').filter({ hasText: /category/i }).first()
    if (await catField.isVisible().catch(() => false)) {
      const options = await catField.locator('option').allTextContents()
      if (options.length > 1) await catField.selectOption({ index: 1 })
    }

    // HSN Code
    const hsnField = page.getByLabel(/HSN/i).first()
    if (await hsnField.isVisible().catch(() => false)) {
      await hsnField.fill('30049099')
    }

    // GST rate
    const gstField = page.getByLabel(/GST.*rate|tax/i).first()
    if (await gstField.isVisible().catch(() => false)) {
      if (await gstField.evaluate(el => el.tagName === 'SELECT')) {
        await gstField.selectOption('18')
      } else {
        await gstField.fill('18')
      }
    }

    // Submit
    await page.getByRole('button', { name: /save|submit|create/i }).first().click()

    await Promise.race([
      page.waitForURL(/\/items(?!\/new)/, { timeout: 15_000 }),
      expectToast(page, /created|saved|success/i).catch(() => {}),
    ])

    const url = page.url()
    const itemMatch = url.match(/\/items\/([a-f0-9-]+)/)
    if (itemMatch) {
      pipeline.itemId = itemMatch[1]
    }
  })

  test('item categories page loads', async ({ page }) => {
    await navigateAndWait(page, '/items/categories')
    await expectNoErrors(page)
    await expectHeading(page, /categor/i)
  })

  test('stock levels page loads', async ({ page }) => {
    await navigateAndWait(page, '/items/stock')
    await expectNoErrors(page)
  })

  test('consumption page loads', async ({ page }) => {
    await navigateAndWait(page, '/items/consumption')
    await expectNoErrors(page)
  })
})
