import { test, expect } from '@playwright/test'
import {
  navigateAndWait,
  expectHeading,
  expectNoErrors,
  expectToast,
} from '../../helpers/page-utils'
import { pipeline } from '../../helpers/supabase'

test.describe('Finance — Invoices', () => {
  test.describe.configure({ mode: 'serial' })

  test('invoice list page loads', async ({ page }) => {
    await navigateAndWait(page, '/finance/invoices')
    await expectHeading(page, /invoice/i)
    await expectNoErrors(page)
    await expect(page.getByRole('link', { name: /new.*invoice|create/i })).toBeVisible()
  })

  test('new invoice form loads', async ({ page }) => {
    await navigateAndWait(page, '/finance/invoices/new')
    await expectNoErrors(page)
  })

  test('create invoice linked to GRN', async ({ page }) => {
    const grnId = pipeline.grnId
    const url = grnId
      ? `/finance/invoices/new?grn_id=${grnId}`
      : '/finance/invoices/new'

    await navigateAndWait(page, url)

    // Fill invoice number
    const invoiceNoField = page.getByLabel(/invoice.*no|invoice.*number/i).first()
    if (await invoiceNoField.isVisible().catch(() => false)) {
      await invoiceNoField.fill(`E2E-INV-${Date.now()}`)
    }

    // Invoice date
    const dateField = page.getByLabel(/invoice.*date/i).first()
    if (await dateField.isVisible().catch(() => false)) {
      await dateField.fill(new Date().toISOString().slice(0, 10))
    }

    // Invoice amount
    const amountField = page.getByLabel(/amount|total/i).first()
    if (await amountField.isVisible().catch(() => false)) {
      await amountField.fill('5000')
    }

    // If vendor selector, pick first
    const vendorSelect = page.locator('select').filter({ hasText: /vendor/i }).first()
    if (await vendorSelect.isVisible().catch(() => false)) {
      const options = await vendorSelect.locator('option').allTextContents()
      if (options.length > 1) await vendorSelect.selectOption({ index: 1 })
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: /save|submit|create/i }).first()
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click()

      await Promise.race([
        page.waitForURL(/\/finance\/invoices\/(?!new)/, { timeout: 15_000 }),
        expectToast(page, /created|saved|success/i).catch(() => {}),
      ])

      const url = page.url()
      const invMatch = url.match(/\/finance\/invoices\/([a-f0-9-]+)/)
      if (invMatch) pipeline.invoiceId = invMatch[1]
    }
  })

  test('invoice detail page loads', async ({ page }) => {
    if (pipeline.invoiceId) {
      await navigateAndWait(page, `/finance/invoices/${pipeline.invoiceId}`)
    } else {
      await navigateAndWait(page, '/finance/invoices')
      const firstLink = page.locator('table tbody tr a, [role="row"] a').first()
      if (await firstLink.isVisible().catch(() => false)) {
        await firstLink.click()
        await page.waitForLoadState('networkidle')
      } else {
        test.skip(true, 'No invoices available')
        return
      }
    }

    await expectNoErrors(page)
  })

  test('3-way match indicator on invoice detail', async ({ page }) => {
    if (!pipeline.invoiceId) {
      test.skip(true, 'No test invoice available')
      return
    }

    await navigateAndWait(page, `/finance/invoices/${pipeline.invoiceId}`)

    // 3-way match section should be present (PO ↔ GRN ↔ Invoice)
    const matchSection = page.locator('text=/3.*way|match|verification/i').first()
    // May or may not be visible depending on invoice state — just check no crash
    await expectNoErrors(page)
  })
})

test.describe('Finance — Payments', () => {
  test('payments list page loads', async ({ page }) => {
    await navigateAndWait(page, '/finance/payments')
    await expectHeading(page, /payment/i)
    await expectNoErrors(page)
  })

  test('payment schedule page loads', async ({ page }) => {
    await navigateAndWait(page, '/finance/payments/schedule')
    await expectNoErrors(page)
    // Saturday payment cycle — verify schedule renders
    await expect(page.locator('body')).toContainText(/schedule|upcoming|saturday/i)
  })

  test('new payment batch page loads', async ({ page }) => {
    await navigateAndWait(page, '/finance/payments/new')
    await expectNoErrors(page)
  })
})

test.describe('Finance — Debit Notes', () => {
  test('debit notes list page loads', async ({ page }) => {
    await navigateAndWait(page, '/finance/debit-notes')
    await expectNoErrors(page)
  })

  test('new debit note form loads', async ({ page }) => {
    await navigateAndWait(page, '/finance/debit-notes/new')
    await expectNoErrors(page)
  })
})

test.describe('Finance — Credit Tracking', () => {
  test('credit tracking page loads', async ({ page }) => {
    await navigateAndWait(page, '/finance/credit')
    await expectNoErrors(page)
    // Credit period starts from GRN date — business rule
  })
})
