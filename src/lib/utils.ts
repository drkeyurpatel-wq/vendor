import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isAfter, addDays } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatRate(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatLakhs(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(2)} K`
  return `₹${amount.toFixed(2)}`
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd MMM yyyy, h:mm a')
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function isOverdue(dueDate: string): boolean {
  return isAfter(new Date(), new Date(dueDate))
}

export function getDueDateStatus(dueDate: string): 'overdue' | 'critical' | 'warning' | 'ok' {
  const due = new Date(dueDate)
  const now = new Date()
  if (isAfter(now, due)) return 'overdue'
  if (isAfter(addDays(now, 3), due)) return 'critical'
  if (isAfter(addDays(now, 7), due)) return 'warning'
  return 'ok'
}

export function generateVendorCode(seq: number): string {
  return `H1V-${String(seq).padStart(4, '0')}`
}

export function generateItemCode(seq: number): string {
  return `H1I-${String(seq).padStart(5, '0')}`
}

export function generatePONumber(centreCode: string, seq: number): string {
  const now = new Date()
  const ym = format(now, 'yyMM')
  return `H1-${centreCode}-PO-${ym}-${String(seq).padStart(3, '0')}`
}

export function generateGRNNumber(centreCode: string, seq: number): string {
  const now = new Date()
  const ym = format(now, 'yyMM')
  return `H1-${centreCode}-GRN-${ym}-${String(seq).padStart(3, '0')}`
}

export function generateIndentNumber(centreCode: string, seq: number): string {
  const now = new Date()
  const ym = format(now, 'yyMM')
  return `H1-${centreCode}-IND-${ym}-${String(seq).padStart(3, '0')}`
}

export const VENDOR_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  blacklisted: 'bg-red-100 text-red-800',
  under_review: 'bg-blue-100 text-blue-800',
}

export const PO_STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  sent_to_vendor: 'bg-purple-100 text-purple-800',
  partially_received: 'bg-orange-100 text-orange-800',
  fully_received: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  closed: 'bg-gray-100 text-gray-600',
}

export const MATCH_STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-700',
  matched: 'bg-green-100 text-green-800',
  partial_match: 'bg-yellow-100 text-yellow-800',
  mismatch: 'bg-red-100 text-red-800',
}

export const PAYMENT_STATUS_COLORS = {
  unpaid: 'bg-red-100 text-red-800',
  partial: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  disputed: 'bg-orange-100 text-orange-800',
  on_hold: 'bg-gray-100 text-gray-700',
}

// ─── Financial Year (April–March) ────────────────────────
export function getCurrentFY(): { label: string; start: string; end: string } {
  const now = new Date()
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1
  return {
    label: `FY${String(year).slice(2)}-${String(year + 1).slice(2)}`,
    start: `${year}-04-01`,
    end: `${year + 1}-03-31`,
  }
}

export function getFYForDate(date: string | Date): { label: string; start: string; end: string } {
  const d = new Date(date)
  const year = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1
  return {
    label: `FY${String(year).slice(2)}-${String(year + 1).slice(2)}`,
    start: `${year}-04-01`,
    end: `${year + 1}-03-31`,
  }
}

export function getFYOptions(count = 3): { label: string; start: string; end: string }[] {
  const current = getCurrentFY()
  const startYear = parseInt(current.start.substring(0, 4))
  return Array.from({ length: count }, (_, i) => {
    const y = startYear - i
    return { label: `FY${String(y).slice(2)}-${String(y + 1).slice(2)}`, start: `${y}-04-01`, end: `${y + 1}-03-31` }
  })
}
