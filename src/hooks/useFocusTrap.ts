'use client'

import { useEffect, useRef, useCallback } from 'react'

interface UseFocusTrapOptions {
  /** Whether the focus trap is currently active */
  active: boolean
  /** Callback when Escape key is pressed */
  onEscape?: () => void
}

/**
 * Traps focus within a container element (for modals/dialogs).
 * Returns a ref to attach to the container.
 * Handles Escape key to close and restores focus to trigger element on close.
 */
export function useFocusTrap({ active, onEscape }: UseFocusTrapOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  // Capture the element that was focused before the trap activated
  useEffect(() => {
    if (active) {
      triggerRef.current = document.activeElement as HTMLElement
      // Focus the first focusable element inside the container
      const timer = setTimeout(() => {
        if (containerRef.current) {
          const focusable = getFocusableElements(containerRef.current)
          if (focusable.length > 0) {
            focusable[0].focus()
          } else {
            // If no focusable children, focus the container itself
            containerRef.current.setAttribute('tabindex', '-1')
            containerRef.current.focus()
          }
        }
      }, 0)
      return () => clearTimeout(timer)
    } else {
      // Restore focus to the trigger element when trap deactivates
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus()
        triggerRef.current = null
      }
    }
  }, [active])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!active || !containerRef.current) return

      if (event.key === 'Escape') {
        event.preventDefault()
        onEscape?.()
        return
      }

      if (event.key !== 'Tab') return

      const focusable = getFocusableElements(containerRef.current)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    },
    [active, onEscape]
  )

  useEffect(() => {
    if (active) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [active, handleKeyDown])

  return containerRef
}

/**
 * Returns all focusable elements within a container, in DOM order.
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ')

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
  )
}

export default useFocusTrap
