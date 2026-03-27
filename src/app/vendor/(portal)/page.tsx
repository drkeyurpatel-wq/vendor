import { requireVendorAuth } from '@/lib/vendor-auth'
import Link from 'next/link'
import { cn, formatDate, formatLakhs, formatCurrency, PO_STATUS_COLORS, PAYMENT_STATUS_COLORS } from '@/lib/utils'
import { ShoppingCart, FileText, CreditCard, AlertTriangle, Upload, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function VendorDashboardPage() {
  const { supabase, vendorId, legalName, vendorCode } = await requireVendorAuth()

  // Fetch vendor's POs, invoices, GRNs in parallel
  const [{ data: pos }, { data: invoices }, { data: grns }] = await Promise.all([
    supabase
      .from('purchase_orders')
      .select('id, po_number, po_date, status, total_amount, centre:centres(code)')
      .eq('vendor_id', vendorId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('invoices')
      .select('id, invoice_ref, vendor_invoice_no, total_amount, paid_amount, due_date, payment_status, status, centre:centres(code)')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('grns')
      .select('id, grn_number, grn_date, status, centre:centres(code)')
      .eq('vendor_id', vendorId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // Compute stats
  const totalPOValue = pos?.reduce((s, p: any) => s + (p.total_amount || 0), 0) ?? 0
  const outstanding = invoices?.reduce((s, i: any) => {
    if (i.payment_status !== 'paid') return s + ((i.total_amount || 0) - (i.paid_amount || 0))
    return s
  }, 0) ?? 0
  const paidAmount = invoices?.reduce((s, i: any) => s + (i.paid_amount || 0), 0) ?? 0
  const pendingAckCount = pos?.filter((p: any) => p.status === 'sent_to_vendor').length ?? 0
  const openRFQCount = 0 // Will be populated when RFQ system is active

  return (
    <div>
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">{legalName} ({vendorCode})</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#1B3A6B]/10 flex items-center justify-center">
              <ShoppingCart size={16} className="text-[#1B3A6B]" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Purchase Orders</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{pos?.length ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">{formatLakhs(totalPOValue)} total value</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#0D7E8A]/10 flex items-center justify-center">
              <FileText size={16} className="text-[#0D7E8A]" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Invoices</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{invoices?.length ?? 0}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
              <CreditCard size={16} className="text-green-600" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Total Paid</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{formatLakhs(paidAmount)}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-500" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Outstanding</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{formatLakhs(outstanding)}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Link href="/vendor/invoices/upload" className="flex items-center gap-2 px-4 py-2.5 bg-[#0D7E8A] text-white text-sm font-semibold rounded-xl hover:bg-[#0a6972] transition-colors shadow-sm cursor-pointer">
          <Upload size={14} /> Upload Invoice
        </Link>
        {pendingAckCount > 0 && (
          <Link href="/vendor/orders?status=sent_to_vendor" className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition-colors shadow-sm cursor-pointer">
            <Clock size={14} /> {pendingAckCount} PO{pendingAckCount > 1 ? 's' : ''} to acknowledge
          </Link>
        )}
        <Link href="/vendor/outstanding" className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
          View Outstanding
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent POs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Purchase Orders</h2>
            <Link href="/vendor/orders" className="text-xs font-medium text-[#0D7E8A] hover:underline">View all</Link>
          </div>
          {pos && pos.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">PO#</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Centre</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pos.map((po: any) => (
                    <tr key={po.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <Link href={`/vendor/orders/${po.id}`} className="font-mono text-xs font-semibold text-[#0D7E8A] hover:underline">{po.po_number}</Link>
                      </td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">{(po.centre as any)?.code}</span></td>
                      <td className="px-4 py-3 font-semibold text-xs">{formatCurrency(po.total_amount)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', PO_STATUS_COLORS[po.status as keyof typeof PO_STATUS_COLORS])}>
                          {po.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">No purchase orders yet</div>
          )}
        </div>

        {/* Invoices & Payments */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Invoices & Payments</h2>
            <Link href="/vendor/invoices" className="text-xs font-medium text-[#0D7E8A] hover:underline">View all</Link>
          </div>
          {invoices && invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Due</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-semibold">{inv.invoice_ref}</div>
                        <div className="text-[11px] text-gray-500">{inv.vendor_invoice_no}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-xs">{formatCurrency(inv.total_amount)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{inv.due_date ? formatDate(inv.due_date) : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', PAYMENT_STATUS_COLORS[inv.payment_status as keyof typeof PAYMENT_STATUS_COLORS])}>
                          {inv.payment_status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500 text-sm">No invoices yet</div>
          )}
        </div>
      </div>

      {/* GRN History */}
      {grns && grns.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Goods Receipts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">GRN#</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Centre</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {grns.map((grn: any) => (
                  <tr key={grn.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold">{grn.grn_number}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">{(grn.centre as any)?.code}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-600">{formatDate(grn.grn_date)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('px-2 py-0.5 rounded text-xs font-medium',
                        grn.status === 'verified' ? 'bg-green-100 text-green-700' :
                        grn.status === 'discrepancy' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      )}>{grn.status}</span>
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
