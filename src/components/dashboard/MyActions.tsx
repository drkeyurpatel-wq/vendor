import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn, formatCurrency } from '@/lib/utils'
import { AlertTriangle, CheckCircle2, Clock, FileText, Truck, CreditCard, Shield, Package } from 'lucide-react'

interface Props {
  userId: string
  role: string
  centreId?: string | null
  userName: string
}

export default async function MyActions({ userId, role, centreId, userName }: Props) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const isGroup = ['group_admin', 'group_cao'].includes(role)

  // Parallel queries for all action types
  const [
    { count: pendingApprovals },
    { data: overdueInvoices },
    { data: expiringDocs },
    { count: pendingConversions },
    { data: todayGRNs },
    { count: lowStockCount },
  ] = await Promise.all([
    // POs I need to approve
    supabase.from('purchase_orders').select('*', { count: 'exact', head: true })
      .eq('status', 'pending_approval')
      .is('deleted_at', null),
    // Invoices overdue
    supabase.from('invoices').select('id, invoice_ref, vendor_invoice_no, total_amount, due_date, vendor:vendors(legal_name)')
      .eq('payment_status', 'unpaid')
      .lt('due_date', today)
      .order('due_date')
      .limit(5),
    // Vendor documents expiring in 30 days
    supabase.from('vendor_documents').select('id, document_type, expires_at, vendor:vendors(legal_name)')
      .lte('expires_at', new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0])
      .gte('expires_at', today)
      .limit(5),
    // Consignment usage pending conversion
    supabase.from('consignment_usage').select('*', { count: 'exact', head: true })
      .eq('conversion_status', 'pending'),
    // GRNs received today
    supabase.from('grns').select('id, grn_number, total_amount')
      .gte('grn_date', today)
      .limit(5),
    // Items below reorder level
    supabase.from('item_centre_stock').select('*', { count: 'exact', head: true })
      .lt('current_stock', 10), // Simplified — ideally compare against item.reorder_level
  ])

  const actions: { icon: any; label: string; count: number; href: string; color: string; urgent: boolean }[] = []

  if ((pendingApprovals ?? 0) > 0 && ['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(role)) {
    actions.push({ icon: Shield, label: 'POs to Approve', count: pendingApprovals ?? 0, href: '/purchase-orders?status=pending_approval', color: 'border-purple-500 bg-purple-50', urgent: true })
  }
  if ((overdueInvoices?.length ?? 0) > 0 && ['group_admin', 'group_cao', 'unit_cao', 'finance_staff'].includes(role)) {
    const total = overdueInvoices?.reduce((s, i) => s + (i.total_amount || 0), 0) ?? 0
    actions.push({ icon: CreditCard, label: `Overdue Payments (${formatCurrency(total)})`, count: overdueInvoices?.length ?? 0, href: '/finance/credit', color: 'border-red-500 bg-red-50', urgent: true })
  }
  if ((pendingConversions ?? 0) > 0 && ['group_admin', 'group_cao', 'unit_cao', 'finance_staff'].includes(role)) {
    actions.push({ icon: Package, label: 'Consignment → Convert', count: pendingConversions ?? 0, href: '/consignment/usage', color: 'border-orange-500 bg-orange-50', urgent: true })
  }
  if ((expiringDocs?.length ?? 0) > 0) {
    actions.push({ icon: FileText, label: 'Docs Expiring (30d)', count: expiringDocs?.length ?? 0, href: '/settings/document-alerts?status=expiring_30', color: 'border-yellow-500 bg-yellow-50', urgent: false })
  }
  if ((lowStockCount ?? 0) > 0 && ['group_admin', 'unit_purchase_manager', 'store_staff'].includes(role)) {
    actions.push({ icon: AlertTriangle, label: 'Low Stock Items', count: lowStockCount ?? 0, href: '/items/stock?status=low', color: 'border-amber-500 bg-amber-50', urgent: false })
  }
  if ((todayGRNs?.length ?? 0) > 0 && ['store_staff', 'unit_purchase_manager', 'unit_cao'].includes(role)) {
    actions.push({ icon: Truck, label: "Today's GRNs", count: todayGRNs?.length ?? 0, href: '/grn', color: 'border-teal-500 bg-teal-50', urgent: false })
  }

  if (actions.length === 0) return null

  const firstName = userName?.split(' ')[0] || 'there'
  const urgentCount = actions.filter(a => a.urgent).length

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-gray-700">
          {urgentCount > 0 ? `${firstName}, you have ${urgentCount} urgent action${urgentCount > 1 ? 's' : ''}` : `Hi ${firstName} — you're all caught up`}
        </h2>
        {urgentCount > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action, idx) => {
          const Icon = action.icon
          return (
            <Link key={idx} href={action.href}
              className={cn('rounded-xl border-l-4 p-3 hover:shadow-md transition-all group', action.color)}>
              <div className="flex items-start justify-between">
                <Icon size={16} className="text-gray-500 mt-0.5" />
                <span className={cn('text-lg font-bold', action.urgent ? 'text-red-600' : 'text-navy-600')}>{action.count}</span>
              </div>
              <p className="text-[11px] font-medium text-gray-700 mt-1.5 leading-tight group-hover:text-navy-600">{action.label}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
