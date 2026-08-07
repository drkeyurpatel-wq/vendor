'use client'

import { AlertCircle } from 'lucide-react'

interface FieldErrorProps {
  message?: string
  show?: boolean
  /**
   * Give the message an id so the field it describes can point at it with
   * aria-describedby. Without that link a screen reader announces the invalid
   * state but never reads out what is actually wrong.
   */
  id?: string
}

export default function FieldError({ message, show = true, id }: FieldErrorProps) {
  if (!message || !show) return null
  return (
    <p id={id} className="flex items-center gap-1 mt-1 text-xs text-red-600" role="alert">
      <AlertCircle size={12} className="flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  )
}
