import Link from 'next/link'
import { cn } from '@/lib/utils'
import { formatLakhs, formatDate } from '@/lib/utils'
import { PO_STATUS_COLORS } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

// ─── Shared dashboard UI helpers ─────────────────────────────
// Extracted from the 1,554-line dashboard god file.

export function StatCard({ label, value, sub, icon, bg, href, alert: hasAlert }: {
  label: string
  value: string | number
  sub: string
  icon: React.ReactNode
  bg: string
  href: string
  alert?: boolean
}) {
  return (
    <Link href={href} className="bg-white rounded-xl border border-gray-200/80 shadow-card p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-gradient-to-br from-gray-50 to-transparent -translate-y-8 translate-x-8 pointer-events-none" />
      <div className="flex items-start justify-between mb-3 relative">
        <div className={cn('p-2.5 rounded-xl transition-transform duration-200 group-hover:scale-110', bg)}>
          {icon}
        </div>
        {hasAlert && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        )}
      </div>
      <div className="relative">
        <div className="text-2xl font-bold text-gray-900 tracking-tight">{value}</div>
        <div className="text-sm font-medium text-gray-700 mt-0.5">{label}</div>
        <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
      </div>
    </Link>
  )
}

export function QuickAction({ href, icon, label, variant = 'primary' }: {
  href: string
  icon: React.ReactNode
  label: string
  variant?: 'primary' | 'navy' | 'secondary'
}) {
  const cls = variant === 'primary' ? 'btn-primary' : variant === 'navy' ? 'btn-navy' : 'btn-secondary'
  return (
    <Link href={href} className={cn(cls, 'text-sm')}>
      {icon}
      {label}
    </Link>
  )
}

export function SectionHeader({ title, href, linkText, icon }: {
  title: string
  href?: string
  linkText?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
      <h2 className="font-semibold text-gray-900 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {href && (
        <Link href={href} className="text-xs text-teal-500 hover:underline flex items-center gap-1">
          {linkText || 'View all'} <ArrowRight size={12} />
        </Link>
      )}
    </div>
  )
}

export function EmptyRow({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="empty-state py-10">
      {icon}
      <p className="text-sm mt-2">{message}</p>
    </div>
  )
}

export function PORow({ po }: { po: any }) {
  return (
    <Link href={`/purchase-orders/${po.id}`}
      className="flex items-center px-5 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{po.po_number}</span>
          <span className={cn('badge', PO_STATUS_COLORS[po.status as keyof typeof PO_STATUS_COLORS])}>
            {po.status.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {po.vendor?.legal_name} {po.centre?.code ? `· ${po.centre.code}` : ''}
        </div>
      </div>
      <div className="text-sm font-semibold text-gray-800 ml-4">
        {formatLakhs(po.total_amount)}
      </div>
    </Link>
  )
}

export function InvoiceRow({ inv }: { inv: any }) {
  return (
    <div className="flex items-center px-5 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">{inv.vendor?.legal_name}</span>
          {inv.centre && <span className="text-xs text-gray-500">{inv.centre.code}</span>}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          Due {formatDate(inv.due_date)} · {inv.vendor_invoice_no}
        </div>
      </div>
      <div className="text-right ml-4">
        <div className="text-sm font-semibold text-red-600">{formatLakhs(inv.total_amount)}</div>
        <div className="text-xs text-red-500">Overdue</div>
      </div>
    </div>
  )
}

export function LowStockTable({ items }: { items: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Centre</th>
            <th>Current Stock</th>
            <th>Reorder Level</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s: any) => (
            <tr key={s.id}>
              <td>
                <div className="font-medium text-gray-900">{s.item?.generic_name}</div>
                <div className="text-xs text-gray-500">{s.item?.item_code}</div>
              </td>
              <td><span className="badge bg-blue-50 text-blue-700">{s.centre?.code}</span></td>
              <td>
                <span className={cn(
                  'font-semibold',
                  s.current_stock === 0 ? 'text-red-600' : 'text-orange-600'
                )}>
                  {s.current_stock} {s.item?.unit}
                </span>
              </td>
              <td className="text-gray-600">{s.reorder_level} {s.item?.unit}</td>
              <td>
                <Link href={`/purchase-orders/new?item=${s.item_id}`}
                  className="text-xs text-teal-500 hover:underline font-medium">
                  Raise PO
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
