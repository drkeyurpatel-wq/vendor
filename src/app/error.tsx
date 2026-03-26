'use client'

import { useEffect, useRef } from 'react'
import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    console.error('Application error:', error)
    Sentry.captureException(error)
    // Auto-focus the error heading for screen readers
    headingRef.current?.focus()
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4" role="alert">
      <div className="card p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle size={32} className="text-red-600" aria-hidden="true" />
        </div>

        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-navy-600 mb-2 outline-none">
          Something went wrong
        </h1>

        <p className="text-sm text-gray-500 mb-6">
          An unexpected error occurred while processing your request.
          Please try again or return to the dashboard.
        </p>

        {error.digest && (
          <p className="text-xs text-gray-500 mb-6 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <RefreshCw size={15} aria-hidden="true" />
            Try Again
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-navy-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <LayoutDashboard size={15} aria-hidden="true" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
