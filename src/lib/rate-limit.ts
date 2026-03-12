import { NextRequest } from 'next/server'

/**
 * Rate limiter with Upstash Redis support.
 * Falls back to in-memory token bucket when UPSTASH_REDIS_REST_URL is not set.
 *
 * Set these env vars in Vercel for production:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return '127.0.0.1'
}

// ─── Upstash Redis Rate Limiter ─────────────────────────────

let upstashRateLimiter: any = null
let upstashInitialized = false

async function getUpstashLimiter(limit: number, windowMs: number) {
  if (upstashInitialized) return upstashRateLimiter

  upstashInitialized = true

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }

  try {
    const { Ratelimit } = await import('@upstash/ratelimit')
    const { Redis } = await import('@upstash/redis')

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    upstashRateLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${Math.round(windowMs / 1000)} s`),
      analytics: true,
      prefix: 'h1vpms',
    })

    return upstashRateLimiter
  } catch {
    console.warn('Upstash rate limiter unavailable, using in-memory fallback')
    return null
  }
}

// ─── In-Memory Fallback ─────────────────────────────────────

interface TokenBucket {
  tokens: number
  lastRefill: number
}

const buckets = new Map<string, TokenBucket>()
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  const staleThreshold = now - windowMs * 2
  for (const [key, bucket] of Array.from(buckets.entries())) {
    if (bucket.lastRefill < staleThreshold) {
      buckets.delete(key)
    }
  }
}

function inMemoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  cleanup(windowMs)

  const now = Date.now()
  let bucket = buckets.get(key)

  if (!bucket) {
    bucket = { tokens: limit - 1, lastRefill: now }
    buckets.set(key, bucket)
    return { success: true, remaining: limit - 1, reset: now + windowMs }
  }

  const elapsed = now - bucket.lastRefill
  const refillRate = limit / windowMs
  const refillAmount = elapsed * refillRate
  bucket.tokens = Math.min(limit, bucket.tokens + refillAmount)
  bucket.lastRefill = now

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return { success: true, remaining: Math.floor(bucket.tokens), reset: now + windowMs }
  }

  const resetTime = now + Math.ceil((1 - bucket.tokens) / refillRate)
  return { success: false, remaining: 0, reset: resetTime }
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Rate limit a request. Uses Upstash Redis in production, in-memory fallback in dev.
 */
export async function rateLimit(
  request: NextRequest,
  limit: number,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const ip = getClientIp(request)
  const path = request.nextUrl.pathname
  const key = `${ip}:${path}`

  // Try Upstash first
  const limiter = await getUpstashLimiter(limit, windowMs)
  if (limiter) {
    try {
      const result = await limiter.limit(key)
      return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
      }
    } catch {
      // Upstash failure → fall through to in-memory
    }
  }

  return inMemoryRateLimit(key, limit, windowMs)
}
