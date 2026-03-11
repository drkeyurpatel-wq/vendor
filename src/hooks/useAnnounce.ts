'use client'

import { useCallback, useEffect, useRef } from 'react'

type Priority = 'polite' | 'assertive'

/**
 * Creates an ARIA live region for screen reader announcements.
 * Use for: form submissions, data loading, errors, status changes.
 *
 * @returns announce(message, priority) function
 */
export function useAnnounce() {
  const politeRef = useRef<HTMLDivElement | null>(null)
  const assertiveRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Create the live region elements if they don't exist
    if (!document.getElementById('sr-announce-polite')) {
      const polite = document.createElement('div')
      polite.id = 'sr-announce-polite'
      polite.setAttribute('aria-live', 'polite')
      polite.setAttribute('aria-atomic', 'true')
      polite.setAttribute('role', 'status')
      Object.assign(polite.style, {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: '0',
      })
      document.body.appendChild(polite)
      politeRef.current = polite
    } else {
      politeRef.current = document.getElementById('sr-announce-polite') as HTMLDivElement
    }

    if (!document.getElementById('sr-announce-assertive')) {
      const assertive = document.createElement('div')
      assertive.id = 'sr-announce-assertive'
      assertive.setAttribute('aria-live', 'assertive')
      assertive.setAttribute('aria-atomic', 'true')
      assertive.setAttribute('role', 'alert')
      Object.assign(assertive.style, {
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        borderWidth: '0',
      })
      document.body.appendChild(assertive)
      assertiveRef.current = assertive
    } else {
      assertiveRef.current = document.getElementById('sr-announce-assertive') as HTMLDivElement
    }

    return () => {
      // Cleanup: remove the live region elements on unmount
      // Only remove if no other components are using them
      // In practice, these persist for the app lifetime
    }
  }, [])

  const announce = useCallback((message: string, priority: Priority = 'polite') => {
    const el = priority === 'assertive' ? assertiveRef.current : politeRef.current
    if (el) {
      // Clear and re-set to ensure screen readers re-announce
      el.textContent = ''
      requestAnimationFrame(() => {
        el.textContent = message
      })
    }
  }, [])

  return { announce }
}

export default useAnnounce
