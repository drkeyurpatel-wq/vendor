'use client'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  useEffect(() => { Sentry.captureException(error) }, [error])
  return (
    <html>
      <body>
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'system-ui' }}>
          <h2 style={{ color: '#1B3A6B' }}>Something went wrong</h2>
          <p style={{ color: '#666' }}>Our team has been notified. Please try again.</p>
          <button onClick={reset} style={{ background: '#0D7E8A', color: 'white', padding: '0.5rem 1rem', border: 'none', borderRadius: '0.375rem', cursor: 'pointer' }}>
            Try Again
          </button>
        </div>
      </body>
    </html>
  )
}
