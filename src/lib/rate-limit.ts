import { NextRequest } from 'next/server'

/**
 * In-memory rate limiter using token bucket algorithm.
 * IP-based tracking with automatic cleanup of stale entries.
 *
 * For production at scale, replace with Redis-backed implementation.
 */

interface TokenBucket {
  tokens: number
  lastRefill: number
}

const buckets = new Map<string, TokenBucket>()

// Clean up stale entries every 5 minutes
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

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // Take the first IP (client IP) from the chain
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return '127.0.0.1'
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

/**
 * Rate limit a request using token bucket algorithm.
 *
 * @param request - The incoming NextRequest
 * @param limit - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns Promise<RateLimitResult> - { success, remaining, reset }
 */
export async function rateLimit(
  request: NextRequest,
  limit: number,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const ip = getClientIp(request)
  const path = request.nextUrl.pathname
  const key = `${ip}:${path}`

  cleanup(windowMs)

  const now = Date.now()
  let bucket = buckets.get(key)

  if (!bucket) {
    bucket = { tokens: limit - 1, lastRefill: now }
    buckets.set(key, bucket)
    return { success: true, remaining: limit - 1, reset: now + windowMs }
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill
  const refillRate = limit / windowMs // tokens per ms
  const refillAmount = elapsed * refillRate
  bucket.tokens = Math.min(limit, bucket.tokens + refillAmount)
  bucket.lastRefill = now

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1
    return {
      success: true,
      remaining: Math.floor(bucket.tokens),
      reset: now + windowMs,
    }
  }

  // Rate limited
  const resetTime = now + Math.ceil((1 - bucket.tokens) / refillRate)
  return {
    success: false,
    remaining: 0,
    reset: resetTime,
  }
}
