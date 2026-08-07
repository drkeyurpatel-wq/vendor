import { test as setup, expect } from '@playwright/test'
import { mkdirSync } from 'fs'
import path from 'path'

const authDir = path.join(__dirname, '.auth')

setup('authenticate staff user', async ({ page }) => {
  mkdirSync(authDir, { recursive: true })

  const email = process.env.E2E_USER_EMAIL
  const password = process.env.E2E_USER_PASSWORD

  if (!email || !password) {
    throw new Error('E2E_USER_EMAIL and E2E_USER_PASSWORD must be set')
  }

  // A sign-in that neither redirects nor shows an error usually means the page
  // threw before its click handler could run — a Supabase client that cannot
  // build itself throws exactly that way. Collect anything the browser reports
  // so the failure below can say so instead of guessing.
  const browserErrors: string[] = []
  page.on('pageerror', err => browserErrors.push(`pageerror: ${err.message}`))
  page.on('console', msg => {
    if (msg.type() === 'error') browserErrors.push(`console.error: ${msg.text()}`)
  })
  const failedRequests: string[] = []
  page.on('requestfailed', req => {
    failedRequests.push(`${req.method()} ${req.url()} — ${req.failure()?.errorText ?? 'failed'}`)
  })

  // Navigate to login page
  await page.goto('/login')
  await expect(page.locator('h1')).toContainText('Health1 VPMS')

  // Fill credentials
  await page.getByLabel('Email address').fill(email)
  await page.getByLabel('Password').fill(password)

  // Submit. Playwright will click a button that React has not hydrated yet, and
  // against a cold `next dev` server the first route compiles on demand — the
  // click then lands on inert markup and nothing at all happens. Waiting for
  // the network to settle first keeps that from looking like a login failure.
  await page.waitForLoadState('networkidle').catch(() => {})
  const submit = page.getByRole('button', { name: /sign in/i })
  await expect(submit).toBeEnabled()
  await submit.click()

  // Wait for the redirect to the dashboard, but surface a rejected sign-in
  // rather than sitting here until the timeout. Waiting on the URL alone turns
  // "Invalid login credentials" into a bare 15s TimeoutError, which says
  // nothing about why the whole suite is about to skip.
  // Scoped to the form: the page carries a second, empty [role="alert"] node
  // (the dev overlay's portal container), and a bare getByRole('alert') hits a
  // strict-mode violation whose rejection is easy to swallow into an empty
  // message — which is exactly what hid the real reason for one CI run.
  const loginError = page.locator('form [role="alert"]')
  const outcome = await Promise.race([
    page.waitForURL('/', { timeout: 15_000 }).then(() => 'ok' as const),
    loginError
      .waitFor({ state: 'visible', timeout: 15_000 })
      .then(() => 'rejected' as const)
      .catch(() => new Promise<never>(() => {})),
  ]).catch(() => 'timeout' as const)

  if (outcome === 'rejected') {
    // Report a failure to read the message distinctly from an empty one, so a
    // locator problem here is never mistaken for a credentials problem.
    let message: string
    try {
      message = (await loginError.innerText()).trim()
    } catch (err) {
      message = `<could not read the error element: ${(err as Error).message.split('\n')[0]}>`
    }
    throw new Error(
      `Sign-in was rejected: ${message || '<the error element was empty>'}\n` +
        'Supabase returned this rather than signing the user in. "Invalid login credentials" ' +
        'means the E2E_USER_EMAIL/E2E_USER_PASSWORD secrets need updating; anything else is ' +
        'a connectivity or configuration problem.'
    )
  }

  if (outcome === 'timeout') {
    const detail = [
      `still on ${page.url()}`,
      browserErrors.length
        ? `browser errors:\n  ${browserErrors.slice(0, 5).join('\n  ')}`
        : 'no browser errors reported',
      failedRequests.length
        ? `failed requests:\n  ${failedRequests.slice(0, 5).join('\n  ')}`
        : 'no failed requests',
    ].join('\n')

    throw new Error(
      'Sign-in neither redirected nor showed an error within 15s, so the form did not ' +
        'reach Supabase at all. Bad credentials would have rendered the error alert, ' +
        `so this is configuration or connectivity rather than the E2E account.\n${detail}`
    )
  }

  // Verify dashboard loaded (role-based dashboard component renders)
  await expect(page.locator('body')).not.toContainText('Sign in')

  // Save session state
  await page.context().storageState({ path: path.join(authDir, 'staff.json') })
})
