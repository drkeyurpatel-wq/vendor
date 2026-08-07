'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import ConfirmDialog from './ConfirmDialog'

export interface ConfirmOptions {
  title: string
  description: string
  confirmLabel?: string
  confirmVariant?: 'danger' | 'primary' | 'warning'
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

/**
 * Promise-based replacement for window.confirm().
 *
 * Native confirm() blocks the main thread, cannot be styled or branded, traps
 * no focus, and is unreachable for screen-reader users. This gives the same
 * sequential `await` ergonomics so multi-step validation flows keep reading
 * top-to-bottom, while rendering the branded ConfirmDialog instead.
 *
 *   const confirm = useConfirm()
 *   if (!(await confirm({ title: 'Delete draft PO', description: '...' }))) return
 */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    throw new Error('useConfirm must be used within a ConfirmProvider')
  }
  return ctx
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>(opts => {
    return new Promise<boolean>(resolve => {
      resolverRef.current = resolve
      setOptions(opts)
    })
  }, [])

  const settle = useCallback((result: boolean) => {
    const resolve = resolverRef.current
    resolverRef.current = null
    setOptions(null)
    resolve?.(result)
  }, [])

  const handleClose = useCallback(() => settle(false), [settle])
  const handleConfirm = useCallback(() => settle(true), [settle])

  // Identity-stable so consumers can safely list `confirm` in dependency arrays.
  const value = useMemo(() => confirm, [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {options && (
        <ConfirmDialog
          open
          onClose={handleClose}
          onConfirm={handleConfirm}
          title={options.title}
          description={options.description}
          confirmLabel={options.confirmLabel}
          confirmVariant={options.confirmVariant}
        />
      )}
    </ConfirmContext.Provider>
  )
}
