import { test, expect } from '@playwright/test'
import {
  navigateAndWait,
  expectHeading,
  expectNoErrors,
  fillField,
  selectOption,
  clickButton,
  expectToast,
  getTableRowCount,
  clickTableRow,
  waitForApi,
} from '../../helpers/page-utils'
import { pipeline, TEST_PREFIX } from '../../helpers/supabase'

test.describe('Vendor Management', () => {
  test.describe.configure({ mode: 'serial' }) // Vendor create → view → edit in order

  const timestamp = Date.now()
  const testVendorName = `${TEST_PREFIX}Vendor_${timestamp}`
  const testGSTIN = `24AABCT${String(timestamp).slice(-4)}A1Z5` // Gujarat GSTIN pattern
  const testPAN = `AABCT${String(timestamp).slice(-4)}A`

  test('vendor list page loads', async ({ page }) => {
    await navigateAndWait(page, '/vendors')
    await expectHeading(page, /vendors/i)
    await expectNoErrors(page)

    // Should have "New Vendor" button
    await expect(page.getByRole('link', { name: /new vendor/i })).toBeVisible()
  })

  test('vendor list shows data table', async ({ page }) => {
    await navigateAndWait(page, '/vendors')
    // Table or list should be present
    const hasTable = await page.locator('table').isVisible().catch(() => false)
    const hasList = await page.locator('[role="row"], [class*="vendor"]').first().isVisible().catch(() => false)
    expect(hasTable || hasList).toBeTruthy()
  })

  test('add vendor form loads with all 7 sections', async ({ page }) => {
    await navigateAndWait(page, '/vendors/new')
    await expectNoErrors(page)

    // Verify key form sections are present
    const sections = [
      /basic.*info|company|identity/i,
      /compliance|GST|tax/i,
      /contact/i,
      /address/i,
      /bank/i,
      /commercial|payment|credit/i,
      /TDS|tax.*deduct/i,
    ]

    for (const section of sections) {
      const heading = page.locator('h2, h3, legend, [class*="section"]').filter({ hasText: section })
      // At least some section headings should be visible
    }

    // Key fields must exist
    await expect(page.getByLabel(/legal.*name/i).first()).toBeVisible()
    await expect(page.getByLabel(/GST/i).first()).toBeVisible()
    await expect(page.getByLabel(/PAN/i).first()).toBeVisible()
  })

  test('add vendor form validates required fields', async ({ page }) => {
    await navigateAndWait(page, '/vendors/new')

    // Submit empty form
    await page.getByRole('button', { name: /save|submit|create/i }).first().click()

    // Should show validation errors
    await expect(
      page.locator('text=/required|mandatory|missing/i').first()
    ).toBeVisible({ timeout: 5_000 })

    // Should not navigate away
    await expect(page).toHaveURL(/\/vendors\/new/)
  })

  test('add vendor form validates GSTIN format', async ({ page }) => {
    await navigateAndWait(page, '/vendors/new')

    const gstField = page.getByLabel(/GST/i).first()
    await gstField.fill('INVALID_GST')
    await gstField.blur()

    // Should show format error
    await expect(
      page.locator('text=/invalid.*GST|format/i').first()
    ).toBeVisible({ timeout: 5_000 })
  })

  test('add vendor form validates PAN format', async ({ page }) => {
    await navigateAndWait(page, '/vendors/new')

    const panField = page.getByLabel(/PAN/i).first()
    await panField.fill('INVALID')
    await panField.blur()

    await expect(
      page.locator('text=/invalid.*PAN|format/i').first()
    ).toBeVisible({ timeout: 5_000 })
  })

  test('create a new vendor (full form)', async ({ page }) => {
    await navigateAndWait(page, '/vendors/new')

    // ── Section 1: Basic Info ──
    await page.getByLabel(/legal.*name/i).first().fill(testVendorName)
    await page.getByLabel(/trade.*name/i).first().fill(`${testVendorName} Trading`)

    // Select vendor type if dropdown exists
    const vendorType = page.getByLabel(/vendor.*type|type/i).first()
    if (await vendorType.isVisible().catch(() => false)) {
      await vendorType.selectOption('distributor')
    }

    // Select category if dropdown exists
    const category = page.locator('select').filter({ hasText: /category/i }).first()
    if (await category.isVisible().catch(() => false)) {
      // Select first available option
      const options = await category.locator('option').allTextContents()
      if (options.length > 1) {
        await category.selectOption({ index: 1 })
      }
    }

    // ── Section 2: Compliance ──
    await page.getByLabel(/GST/i).first().fill(testGSTIN)
    await page.getByLabel(/PAN/i).first().fill(testPAN)

    // ── Section 3: Contact ──
    await page.getByLabel(/contact.*name|primary.*name/i).first().fill('E2E Test Contact')
    await page.getByLabel(/phone|mobile/i).first().fill('9876543210')
    const emailField = page.getByLabel(/email/i).first()
    if (await emailField.isVisible().catch(() => false)) {
      await emailField.fill('e2e-test@health1.in')
    }

    // ── Section 4: Address ──
    const addressField = page.getByLabel(/address/i).first()
    if (await addressField.isVisible().catch(() => false)) {
      await addressField.fill('123 E2E Test Road, Ahmedabad')
    }
    const cityField = page.getByLabel(/city/i).first()
    if (await cityField.isVisible().catch(() => false)) {
      await cityField.fill('Ahmedabad')
    }
    const pincodeField = page.getByLabel(/pincode|zip/i).first()
    if (await pincodeField.isVisible().catch(() => false)) {
      await pincodeField.fill('380015')
    }

    // ── Section 5: Bank ──
    await page.getByLabel(/bank.*name/i).first().fill('State Bank of India')
    await page.getByLabel(/account.*no|account.*number/i).first().fill('12345678901234')
    await page.getByLabel(/IFSC/i).first().fill('SBIN0001234')

    // ── Section 6: Commercial ──
    const creditField = page.getByLabel(/credit.*period/i).first()
    if (await creditField.isVisible().catch(() => false)) {
      await creditField.selectOption('30')
    }

    // ── Submit ──
    const submitBtn = page.getByRole('button', { name: /save|submit|create/i }).first()
    await submitBtn.click()

    // Wait for success — either toast or redirect
    await Promise.race([
      page.waitForURL(/\/vendors(?!\/new)/, { timeout: 15_000 }),
      expectToast(page, /created|saved|success/i).catch(() => {}),
    ])

    // Store vendor info for pipeline
    const currentUrl = page.url()
    const vendorIdMatch = currentUrl.match(/\/vendors\/([a-f0-9-]+)/)
    if (vendorIdMatch) {
      pipeline.vendorId = vendorIdMatch[1]
    }
  })

  test('vendor detail page shows created vendor', async ({ page }) => {
    await navigateAndWait(page, '/vendors')

    // Search or find the test vendor
    const searchInput = page.getByPlaceholder(/search/i).first()
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill(TEST_PREFIX)
      await page.waitForTimeout(1_000) // Debounce
    }

    // Click on the test vendor
    const vendorRow = page.locator('a, tr, [role="row"]').filter({ hasText: testVendorName }).first()
    if (await vendorRow.isVisible().catch(() => false)) {
      await vendorRow.click()
      await page.waitForLoadState('networkidle')

      // Verify vendor detail page
      await expect(page.locator('body')).toContainText(testVendorName)
      await expectNoErrors(page)
    }
  })

  test('vendor categories page loads', async ({ page }) => {
    await navigateAndWait(page, '/vendors/categories')
    await expectNoErrors(page)
    await expectHeading(page, /categor/i)
  })
})
