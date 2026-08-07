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

  // Capture the element that was focused before the trap activated, move focus
  // inside, and put it back afterwards.
  //
  // Restoration lives in this effect's cleanup rather than in an `active ===
  // false` branch so it also runs when the trapped component unmounts. Modals
  // are commonly rendered conditionally ({open && <Dialog />}), which unmounts
  // the hook outright and would otherwise drop focus onto <body>.
  useEffect(() => {
    if (!active) return

    triggerRef.current = document.activeElement as HTMLElement

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

    return () => {
      clearTimeout(timer)
      const trigger = triggerRef.current
      triggerRef.current = null
      // Skip a trigger that has since left the DOM — focusing a detached node
      // silently sends focus to <body>.
      if (trigger && typeof trigger.focus === 'function' && document.contains(trigger)) {
        trigger.focus()
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

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(el => {
    if (el.hasAttribute('disabled')) return false
    if (el.getAttribute('aria-hidden') === 'true') return false
    if (el.hidden) return false
    // Visibility is checked through computed style rather than offsetParent:
    // offsetParent is always null under jsdom, which would make the trap look
    // empty in tests, and it is also null for any position:fixed element --
    // exactly what a modal is.
    const style = typeof window !== 'undefined' ? window.getComputedStyle(el) : null
    if (style && (style.display === 'none' || style.visibility === 'hidden')) return false
    return true
  })
}

export default useFocusTrap
