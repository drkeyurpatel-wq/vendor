import { test, expect } from '@playwright/test'

test.describe('API Health Checks', () => {
  test('health endpoint responds', async ({ request }) => {
    const response = await request.get('/api/health')
    // May return 200 or 401 depending on auth requirement
    expect([200, 401]).toContain(response.status())
  })

  test('sequence API rejects unauthenticated requests', async ({ request }) => {
    const response = await request.get('/api/sequence?type=po&centre_code=SHI')
    // Without auth, should return 401
    expect(response.status()).toBe(401)
  })

  test('sequence API returns valid format for authenticated user', async ({ request }) => {
    // This uses the stored auth state from the chromium project
    const response = await request.get('/api/sequence?type=po&centre_code=SHI')

    if (response.status() === 200) {
      const data = await response.json()
      expect(data.number).toBeDefined()
      expect(data.number).toMatch(/^H1-/)
    }
    // 429 (rate limited) is also acceptable
    expect([200, 429]).toContain(response.status())
  })

  test('sequence API validates type param', async ({ request }) => {
    const response = await request.get('/api/sequence?centre_code=SHI')
    expect(response.status()).toBe(400)
  })

  test('sequence API rejects unknown type', async ({ request }) => {
    const response = await request.get('/api/sequence?type=invalid&centre_code=SHI')
    // Should return 400 or 500
    expect([400, 500]).toContain(response.status())
  })

  test('vendor search API exists', async ({ request }) => {
    const response = await request.get('/api/search?q=test')
    expect([200, 401]).toContain(response.status())
  })

  test('CSRF protection blocks cross-origin POST', async ({ request }) => {
    const response = await request.post('/api/vendors', {
      headers: {
        'Origin': 'https://evil.example.com',
        'Content-Type': 'application/json',
      },
      data: { name: 'test' },
    })
    // Should be blocked by CSRF middleware
    expect(response.status()).toBe(403)
  })

  test('vendor auth send-otp rejects invalid phone', async ({ request }) => {
    const response = await request.post('/api/vendor-auth/send-otp', {
      data: { phone: '123' },
    })
    expect(response.status()).toBe(400)
  })

  test('vendor auth send-otp rejects unregistered phone', async ({ request }) => {
    const response = await request.post('/api/vendor-auth/send-otp', {
      data: { phone: '0000000000' },
    })
    expect([404, 400]).toContain(response.status())
  })
})
