'use client'

import { AlertCircle } from 'lucide-react'

interface FieldErrorProps {
  message?: string
  show?: boolean
}

export default function FieldError({ message, show = true }: FieldErrorProps) {
  if (!message || !show) return null
  return (
    <p className="flex items-center gap-1 mt-1 text-xs text-red-600" role="alert">
      <AlertCircle size={12} className="flex-shrink-0" />
      <span>{message}</span>
    </p>
  )
}
