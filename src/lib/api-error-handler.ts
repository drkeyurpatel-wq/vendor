import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { AuthError } from '@/lib/auth'

// ─── Structured API error response ───────────────────────────

interface ApiErrorResponse {
  error: string
  code?: string
  details?: string
}

// ─── API route wrapper ───────────────────────────────────────
// Wraps any API route handler with:
// 1. try/catch to prevent unhandled crashes
// 2. Sentry capture for production alerting
// 3. Structured JSON error responses
// 4. Request context in error reports
//
// Usage:
//   export const POST = withApiErrorHandler(async (req) => {
//     // your logic — throw freely, errors are caught
//     return NextResponse.json({ ok: true })
//   })

type ApiHandler = (
  request: NextRequest,
  context?: { params?: Promise<Record<string, string>> }
) => Promise<NextResponse>

export function withApiErrorHandler(handler: ApiHandler): ApiHandler {
  return async (request, context) => {
    try {
      return await handler(request, context)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))

      // Capture in Sentry with request context
      Sentry.withScope((scope) => {
        scope.setTag('api_route', request.nextUrl.pathname)
        scope.setTag('method', request.method)
        scope.setContext('request', {
          url: request.nextUrl.toString(),
          method: request.method,
          headers: Object.fromEntries(
            ['content-type', 'user-agent', 'x-forwarded-for'].map(h => [h, request.headers.get(h)])
          ),
        })
        Sentry.captureException(err)
      })

      // Log in dev
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[API Error] ${request.method} ${request.nextUrl.pathname}:`, err.message)
      }

      // AuthError from requireApiAuth — clean 401, no Sentry noise
      if (err instanceof AuthError) {
        return NextResponse.json(
          { error: err.message, code: 'AUTH_ERROR' } satisfies ApiErrorResponse,
          { status: 401 }
        )
      }

      // Supabase-specific errors
      if (err.message?.includes('JWT') || err.message?.includes('auth')) {
        return NextResponse.json(
          { error: 'Authentication failed', code: 'AUTH_ERROR' } satisfies ApiErrorResponse,
          { status: 401 }
        )
      }

      if (err.message?.includes('rate') || err.message?.includes('too many')) {
        return NextResponse.json(
          { error: 'Too many requests', code: 'RATE_LIMIT' } satisfies ApiErrorResponse,
          { status: 429 }
        )
      }

      // JSON parse errors (malformed request body)
      if (err instanceof SyntaxError) {
        return NextResponse.json(
          { error: 'Invalid request body', code: 'INVALID_JSON' } satisfies ApiErrorResponse,
          { status: 400 }
        )
      }

      // Default 500
      return NextResponse.json(
        {
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
          ...(process.env.NODE_ENV !== 'production' && { details: err.message }),
        } satisfies ApiErrorResponse,
        { status: 500 }
      )
    }
  }
}
