import type { ErrorEvent, EventHint } from '@sentry/nextjs'

/**
 * PII-safe Sentry beforeSend handler.
 * Redacts vendor IDs, bank accounts, PO amounts, phone numbers,
 * Aadhaar numbers, and other sensitive data from error reports.
 */

// Patterns that match sensitive data
const PII_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Bank account numbers (8-18 digits)
  { pattern: /\b\d{8,18}\b(?=.*(?:bank|account|ifsc|neft|rtgs))/gi, replacement: '[REDACTED_BANK_ACCOUNT]' },
  // IFSC codes
  { pattern: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g, replacement: '[REDACTED_IFSC]' },
  // Indian phone numbers
  { pattern: /\b[6-9]\d{9}\b/g, replacement: '[REDACTED_PHONE]' },
  // Aadhaar numbers (12 digits, possibly with spaces)
  { pattern: /\b\d{4}\s?\d{4}\s?\d{4}\b/g, replacement: '[REDACTED_AADHAAR]' },
  // PAN numbers
  { pattern: /\b[A-Z]{5}\d{4}[A-Z]\b/g, replacement: '[REDACTED_PAN]' },
  // GSTIN
  { pattern: /\b\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/g, replacement: '[REDACTED_GSTIN]' },
  // Email addresses
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[REDACTED_EMAIL]' },
  // Currency amounts (INR) — redact large amounts only to avoid over-scrubbing
  { pattern: /₹\s?[\d,]+\.?\d{0,2}/g, replacement: '₹[REDACTED_AMOUNT]' },
]

// Keys whose values should be fully redacted
const SENSITIVE_KEYS = new Set([
  'bank_account_no', 'bank_ifsc', 'bank_name', 'bank_account_type',
  'primary_contact_phone', 'primary_contact_email',
  'phone', 'email', 'mobile',
  'aadhaar', 'pan', 'gstin',
  'vendor_id', 'vendor_code',
  'patient_name', 'patient_uhid',
  'total_amount', 'paid_amount', 'subtotal', 'gst_amount',
  'credit_limit', 'total_outstanding', 'overdue_amount',
  'utr_number', 'cheque_number',
])

function scrubString(value: string): string {
  let result = value
  for (const { pattern, replacement } of PII_PATTERNS) {
    result = result.replace(pattern, replacement)
  }
  return result
}

function scrubObject(obj: Record<string, unknown>): Record<string, unknown> {
  const scrubbed: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key)) {
      scrubbed[key] = '[REDACTED]'
    } else if (typeof value === 'string') {
      scrubbed[key] = scrubString(value)
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      scrubbed[key] = scrubObject(value as Record<string, unknown>)
    } else {
      scrubbed[key] = value
    }
  }
  return scrubbed
}

export function piiSafeBeforeSend(event: ErrorEvent, hint: EventHint): ErrorEvent | null {
  // Scrub exception messages
  if (event.exception?.values) {
    for (const exception of event.exception.values) {
      if (exception.value) {
        exception.value = scrubString(exception.value)
      }
    }
  }

  // Scrub breadcrumb messages
  if (event.breadcrumbs) {
    for (const breadcrumb of event.breadcrumbs) {
      if (breadcrumb.message) {
        breadcrumb.message = scrubString(breadcrumb.message)
      }
      if (breadcrumb.data && typeof breadcrumb.data === 'object') {
        breadcrumb.data = scrubObject(breadcrumb.data as Record<string, unknown>)
      }
    }
  }

  // Scrub extra context
  if (event.extra && typeof event.extra === 'object') {
    event.extra = scrubObject(event.extra as Record<string, unknown>)
  }

  // Scrub contexts
  if (event.contexts) {
    for (const [key, ctx] of Object.entries(event.contexts)) {
      if (ctx && typeof ctx === 'object') {
        event.contexts[key] = scrubObject(ctx as Record<string, unknown>)
      }
    }
  }

  // Scrub tags
  if (event.tags && typeof event.tags === 'object') {
    for (const [key, value] of Object.entries(event.tags)) {
      if (SENSITIVE_KEYS.has(key)) {
        event.tags[key] = '[REDACTED]'
      } else if (typeof value === 'string') {
        event.tags[key] = scrubString(value)
      }
    }
  }

  // Remove user IP
  if (event.user) {
    delete event.user.ip_address
  }

  return event
}
