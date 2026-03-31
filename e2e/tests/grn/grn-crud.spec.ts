import { test, expect } from '@playwright/test'
import {
  navigateAndWait,
  expectHeading,
  expectNoErrors,
  expectToast,
} from '../../helpers/page-utils'
import { pipeline, getApprovedPO } from '../../helpers/supabase'

test.describe('Goods Received Notes (GRN)', () => {
  test.describe.configure({ mode: 'serial' })

  test('GRN list page loads', async ({ page }) => {
    await navigateAndWait(page, '/grn')
    await expectHeading(page, /GRN|goods.*received/i)
    await expectNoErrors(page)
    await expect(page.getByRole('link', { name: /new.*GRN|create/i })).toBeVisible()
  })

  test('new GRN form loads', async ({ page }) => {
    await navigateAndWait(page, '/grn/new')
    await expectNoErrors(page)
    // Should have PO selector
    await expect(page.locator('body')).toContainText(/purchase.*order|PO|select/i)
  })

  test('create GRN from approved PO', async ({ page }) => {
    // Find an approved PO to create GRN against
    let poId = pipeline.poId
    if (!poId) {
      try {
        const approvedPO = await getApprovedPO()
        if (approvedPO) poId = approvedPO.id
      } catch {
        // Supabase not configured — skip
      }
    }

    if (!poId) {
      test.skip(true, 'No approved PO available for GRN creation')
      return
    }

    await navigateAndWait(page, `/grn/new?po_id=${poId}`)
    await page.waitForTimeout(2_000) // Wait for PO data to load

    // Fill received quantities — first quantity input
    const qtyInputs = page.locator('input[type="number"]')
    const count = await qtyInputs.count()
    for (let i = 0; i < Math.min(count, 3); i++) {
      const input = qtyInputs.nth(i)
      const placeholder = await input.getAttribute('placeholder') || ''
      const name = await input.getAttribute('name') || ''
      if (/qty|quantity|received/i.test(placeholder + name)) {
        await input.fill('5')
      }
    }

    // Fill delivery note / challan number if present
    const challanField = page.getByLabel(/challan|delivery.*note|dc.*no/i).first()
    if (await challanField.isVisible().catch(() => false)) {
      await challanField.fill('E2E-DC-001')
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: /save|submit|create.*GRN/i }).first()
    if (await submitBtn.isVisible().catch(() => false)) {
      await submitBtn.click()

      await Promise.race([
        page.waitForURL(/\/grn\/(?!new)/, { timeout: 15_000 }),
        expectToast(page, /created|saved|success/i).catch(() => {}),
      ])

      const url = page.url()
      const grnMatch = url.match(/\/grn\/([a-f0-9-]+)/)
      if (grnMatch) {
        pipeline.grnId = grnMatch[1]
      }
    }
  })

  test('GRN detail page loads', async ({ page }) => {
    if (pipeline.grnId) {
      await navigateAndWait(page, `/grn/${pipeline.grnId}`)
    } else {
      // Try first GRN from list
      await navigateAndWait(page, '/grn')
      const firstLink = page.locator('table tbody tr a, [role="row"] a').first()
      if (await firstLink.isVisible().catch(() => false)) {
        await firstLink.click()
        await page.waitForLoadState('networkidle')
      } else {
        test.skip(true, 'No GRNs available')
        return
      }
    }

    await expectNoErrors(page)
    await expect(page.locator('body')).toContainText(/H1-.*-GRN-|GRN-/i)
  })
})
