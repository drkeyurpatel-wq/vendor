/**
 * @jest-environment node
 */

/**
 * Tests for the in-memory rate limiter (token bucket algorithm).
 */

import { rateLimit } from '@/lib/rate-limit'
import { NextRequest } from 'next/server'

function makeRequest(path: string = '/api/test', ip: string = '192.168.1.1'): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: {
      'x-forwarded-for': ip,
      'Content-Type': 'application/json',
    },
  })
}

describe('rateLimit', () => {
  it('allows first request', async () => {
    const result = await rateLimit(makeRequest('/api/rl-test-1', '10.0.0.1'), 5, 60000)
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('decrements remaining tokens', async () => {
    const req = () => makeRequest('/api/rl-test-2', '10.0.0.2')
    const r1 = await rateLimit(req(), 3, 60000)
    expect(r1.remaining).toBe(2)

    const r2 = await rateLimit(req(), 3, 60000)
    expect(r2.success).toBe(true)
    // remaining should decrease (may be slightly higher due to refill)
    expect(r2.remaining).toBeLessThanOrEqual(2)
  })

  it('blocks requests after limit is exhausted', async () => {
    const ip = '10.0.0.3'
    const path = '/api/rl-test-3'
    const req = () => makeRequest(path, ip)

    // Exhaust the bucket (limit=2)
    await rateLimit(req(), 2, 60000)
    await rateLimit(req(), 2, 60000)

    // Third request should be blocked (no time for refill)
    const r3 = await rateLimit(req(), 2, 60000)
    expect(r3.success).toBe(false)
    expect(r3.remaining).toBe(0)
  })

  it('tracks different IPs independently', async () => {
    const path = '/api/rl-test-4'

    // Exhaust limit for IP A
    await rateLimit(makeRequest(path, '10.0.1.1'), 1, 60000)

    // IP B should still have tokens
    const result = await rateLimit(makeRequest(path, '10.0.1.2'), 1, 60000)
    expect(result.success).toBe(true)
  })

  it('tracks different paths independently', async () => {
    const ip = '10.0.2.1'

    await rateLimit(makeRequest('/api/path-a', ip), 1, 60000)

    // Different path should still have tokens
    const result = await rateLimit(makeRequest('/api/path-b', ip), 1, 60000)
    expect(result.success).toBe(true)
  })

  it('uses x-real-ip header as fallback', async () => {
    const req = new NextRequest('http://localhost/api/rl-test-5', {
      method: 'POST',
      headers: {
        'x-real-ip': '10.0.3.1',
        'Content-Type': 'application/json',
      },
    })

    const result = await rateLimit(req, 5, 60000)
    expect(result.success).toBe(true)
  })

  it('returns reset timestamp in the future', async () => {
    const now = Date.now()
    const result = await rateLimit(makeRequest('/api/rl-test-6', '10.0.4.1'), 5, 60000)
    expect(result.reset).toBeGreaterThan(now)
  })
})
