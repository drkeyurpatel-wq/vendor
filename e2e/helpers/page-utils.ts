import { Page, expect, Locator } from '@playwright/test'

// ─── Navigation helpers ──────────────────────────────────────

/** Navigate and wait for page to fully load (no spinners) */
export async function navigateAndWait(page: Page, path: string): Promise<void> {
  await page.goto(path)
  // Wait for loading states to resolve
  await page.waitForLoadState('networkidle')
  // Ensure no skeleton loaders are visible
  await expect(page.locator('.animate-pulse')).toHaveCount(0, { timeout: 10_000 }).catch(() => {
    // Some pages may not have skeleton loaders — that's fine
  })
}

/** Click a sidebar nav link and wait for navigation */
export async function navigateSidebar(page: Page, text: string): Promise<void> {
  await page.getByRole('link', { name: new RegExp(text, 'i') }).first().click()
  await page.waitForLoadState('networkidle')
}

// ─── Form helpers ────────────────────────────────────────────

/** Fill a form field by label */
export async function fillField(page: Page, label: string, value: string): Promise<void> {
  const field = page.getByLabel(label, { exact: false }).first()
  await field.clear()
  await field.fill(value)
}

/** Select an option from a <select> by label */
export async function selectOption(page: Page, label: string, value: string): Promise<void> {
  await page.getByLabel(label, { exact: false }).first().selectOption(value)
}

/** Click a button by text and wait for network */
export async function clickButton(page: Page, text: string | RegExp): Promise<void> {
  await page.getByRole('button', { name: text }).first().click()
  await page.waitForLoadState('networkidle')
}

/** Wait for a toast message */
export async function expectToast(page: Page, text: string | RegExp, type: 'success' | 'error' = 'success'): Promise<void> {
  const toast = page.locator('[role="status"], [data-sonner-toast], .go3958317564') // react-hot-toast classes
  await expect(toast.filter({ hasText: text })).toBeVisible({ timeout: 10_000 })
}

// ─── Table helpers ───────────────────────────────────────────

/** Get the count of rows in a data table */
export async function getTableRowCount(page: Page): Promise<number> {
  const rows = page.locator('table tbody tr, [role="row"]')
  return rows.count()
}

/** Click on a table row containing specific text */
export async function clickTableRow(page: Page, text: string): Promise<void> {
  const row = page.locator('table tbody tr, [role="row"]').filter({ hasText: text }).first()
  // Click the first link or the row itself
  const link = row.locator('a').first()
  if (await link.isVisible().catch(() => false)) {
    await link.click()
  } else {
    await row.click()
  }
  await page.waitForLoadState('networkidle')
}

// ─── Assertion helpers ───────────────────────────────────────

/** Verify page heading */
export async function expectHeading(page: Page, text: string | RegExp): Promise<void> {
  await expect(page.locator('h1, h2').filter({ hasText: text }).first()).toBeVisible({ timeout: 10_000 })
}

/** Verify no error states on page */
export async function expectNoErrors(page: Page): Promise<void> {
  // No Next.js error overlay
  await expect(page.locator('#__next-build-error, [data-nextjs-dialog]')).toHaveCount(0)
  // No unhandled error messages (but allow form validation errors)
  const errorBanner = page.locator('[role="alert"]').filter({ hasText: /internal|500|unexpected/i })
  await expect(errorBanner).toHaveCount(0)
}

/** Wait for API response on a specific path */
export async function waitForApi(page: Page, pathPattern: string | RegExp): Promise<void> {
  await page.waitForResponse(
    (response) => {
      const url = response.url()
      if (typeof pathPattern === 'string') return url.includes(pathPattern)
      return pathPattern.test(url)
    },
    { timeout: 15_000 }
  )
}

// ─── Auth helpers ────────────────────────────────────────────

/** Check if user is authenticated (not on login page) */
export async function expectAuthenticated(page: Page): Promise<void> {
  await expect(page).not.toHaveURL(/\/login/)
}

/** Check page is accessible (basic WCAG checks) */
export async function checkBasicA11y(page: Page): Promise<void> {
  // All images should have alt text
  const images = page.locator('img:not([alt])')
  const count = await images.count()
  if (count > 0) {
    console.warn(`[A11y] ${count} images without alt text`)
  }

  // All form inputs should have labels
  const inputs = page.locator('input:not([type="hidden"]):not([aria-label]):not([aria-labelledby])')
  for (const input of await inputs.all()) {
    const id = await input.getAttribute('id')
    if (id) {
      const label = page.locator(`label[for="${id}"]`)
      if (!(await label.isVisible().catch(() => false))) {
        console.warn(`[A11y] Input #${id} has no associated label`)
      }
    }
  }
}
