import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatDate, formatLakhs, PO_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '@/lib/utils'
import { ShoppingCart, FileText, CreditCard, Package, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function VendorPortalPage() {
  const { supabase, user, profile, role, centreId, isGroupLevel } = await requireAuth()
  if (!profile || role !== 'vendor') {
    return (
      <div className="card p-12 text-center">
        <Package size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="font-medium text-gray-500">Vendor Portal</p>
        <p className="text-sm text-gray-400 mt-1">This page is only accessible to vendor users</p>
      </div>
    )
  }

  // Find vendor linked to this user
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, vendor_code, legal_name, status, credit_period_days')
    .eq('primary_contact_email', user.email)
    .single()

  if (!vendor) {
    return (
      <div className="card p-12 text-center">
        <AlertTriangle size={40} className="mx-auto mb-3 text-yellow-400" />
        <p className="font-medium text-gray-500">Vendor Profile Not Found</p>
        <p className="text-sm text-gray-400 mt-1">No vendor profile is linked to your email. Contact the admin.</p>
      </div>
    )
  }

  // Fetch vendor's POs, invoices, GRNs
  const [{ data: pos }, { data: invoices }, { data: grns }] = await Promise.all([
    supabase
      .from('purchase_orders')
      .select('id, po_number, po_date, status, total_amount, centre:centres(code)')
      .eq('vendor_id', vendor.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('invoices')
      .select('id, invoice_ref, vendor_invoice_no, total_amount, paid_amount, due_date, payment_status, centre:centres(code)')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('grns')
      .select('id, grn_number, grn_date, status, centre:centres(code)')
      .eq('vendor_id', vendor.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  const totalPOValue = pos?.reduce((s, p: any) => s + (p.total_amount || 0), 0) ?? 0
  const outstanding = invoices?.reduce((s, i: any) => {
    if (i.payment_status !== 'paid') return s + ((i.total_amount || 0) - (i.paid_amount || 0))
    return s
  }, 0) ?? 0
  const paidAmount = invoices?.reduce((s, i: any) => s + (i.paid_amount || 0), 0) ?? 0
  const pendingAckCount = pos?.filter((p: any) => p.status === 'sent_to_vendor').length ?? 0

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Portal</h1>
          <p className="page-subtitle">Welcome, {vendor.legal_name} ({vendor.vendor_code})</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card border-l-4 border-[#1B3A6B]">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart size={18} className="text-[#1B3A6B]" />
            <span className="text-sm text-gray-500">Purchase Orders</span>
          </div>
          <div className="text-2xl font-bold text-[#1B3A6B]">{pos?.length ?? 0}</div>
          <div className="text-xs text-gray-400 mt-1">{formatLakhs(totalPOValue)} total value</div>
        </div>
        <div className="stat-card border-l-4 border-[#0D7E8A]">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={18} className="text-[#0D7E8A]" />
            <span className="text-sm text-gray-500">Invoices</span>
          </div>
          <div className="text-2xl font-bold text-[#0D7E8A]">{invoices?.length ?? 0}</div>
        </div>
        <div className="stat-card border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={18} className="text-green-500" />
            <span className="text-sm text-gray-500">Total Paid</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{formatLakhs(paidAmount)}</div>
        </div>
        <div className="stat-card border-l-4 border-red-500">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={18} className="text-red-500" />
            <span className="text-sm text-gray-500">Outstanding</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{formatLakhs(outstanding)}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Link href="/vendor-portal/invoices/upload" className="btn-primary text-sm"><FileText size={14} /> Upload Invoice</Link>
        {pendingAckCount > 0 && (
          <Link href="/vendor-portal/orders?status=sent_to_vendor" className="text-sm px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 font-medium">
            {pendingAckCount} PO{pendingAckCount > 1 ? 's' : ''} to acknowledge →
          </Link>
        )}
        <Link href="/vendor-portal/outstanding" className="btn-secondary text-sm">View Outstanding</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent POs */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Purchase Orders</h2>
          </div>
          {pos && pos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Centre</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pos.map((po: any) => (
                    <tr key={po.id}>
                      <td><span className="font-mono text-xs font-semibold">{po.po_number}</span></td>
                      <td><span className="badge bg-blue-50 text-blue-700">{po.centre?.code}</span></td>
                      <td className="text-sm text-gray-600">{formatDate(po.po_date)}</td>
                      <td className="text-sm font-semibold">{formatLakhs(po.total_amount)}</td>
                      <td>
                        <span className={cn('badge', PO_STATUS_COLORS[po.status as keyof typeof PO_STATUS_COLORS])}>
                          {po.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">No purchase orders yet</div>
          )}
        </div>

        {/* Invoices & Payments */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Invoices & Payments</h2>
          </div>
          {invoices && invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Amount</th>
                    <th>Due</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <tr key={inv.id}>
                      <td>
                        <div className="font-mono text-xs font-semibold">{inv.invoice_ref}</div>
                        <div className="text-xs text-gray-400">{inv.vendor_invoice_no}</div>
                      </td>
                      <td className="text-sm font-semibold">{formatLakhs(inv.total_amount)}</td>
                      <td className="text-sm text-gray-600">{formatDate(inv.due_date)}</td>
                      <td>
                        <span className={cn('badge', PAYMENT_STATUS_COLORS[inv.payment_status as keyof typeof PAYMENT_STATUS_COLORS])}>
                          {inv.payment_status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">No invoices yet</div>
          )}
        </div>
      </div>

      {/* GRN History */}
      {grns && grns.length > 0 && (
        <div className="card overflow-hidden mt-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Goods Receipts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>GRN Number</th>
                  <th>Centre</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {grns.map((grn: any) => (
                  <tr key={grn.id}>
                    <td><span className="font-mono text-xs font-semibold">{grn.grn_number}</span></td>
                    <td><span className="badge bg-blue-50 text-blue-700">{grn.centre?.code}</span></td>
                    <td className="text-sm text-gray-600">{formatDate(grn.grn_date)}</td>
                    <td>
                      <span className={cn('badge', grn.status === 'verified' ? 'bg-green-100 text-green-700' : grn.status === 'discrepancy' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}>
                        {grn.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
