import { createClient } from '@/lib/supabase/server'
import { cn, formatDate, formatLakhs, formatCurrency, PO_STATUS_COLORS } from '@/lib/utils'
import { ArrowLeft, Edit, Printer, Send, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default async function PODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch PO with joins
  const { data: po, error } = await supabase
    .from('purchase_orders')
    .select('*, vendor:vendors(legal_name, vendor_code), centre:centres(code, name), created_by_user:user_profiles!created_by(full_name)')
    .eq('id', id)
    .single()

  // Fetch PO items
  const { data: lineItems } = await supabase
    .from('purchase_order_items')
    .select('*, item:items(item_code, generic_name)')
    .eq('po_id', id)

  // Fetch PO approvals
  const { data: approvals } = await supabase
    .from('po_approvals')
    .select('*, approver:user_profiles(full_name)')
    .eq('po_id', id)

  // Fetch related GRNs
  const { data: grns } = await supabase
    .from('grns')
    .select('id, grn_number, grn_date, status')
    .eq('po_id', id)

  // Not found
  if (!po || error) {
    return (
      <div>
        <Link href="/purchase-orders" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={14} /> Back to Purchase Orders
        </Link>
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Purchase Order Not Found</h2>
          <p className="text-sm text-gray-500">The purchase order you are looking for does not exist or has been deleted.</p>
        </div>
      </div>
    )
  }

  // Compute totals from line items
  const subtotal = (lineItems ?? []).reduce((sum: number, li: any) => sum + ((li.rate ?? 0) * (li.qty ?? 0)), 0)
  const gstTotal = (lineItems ?? []).reduce((sum: number, li: any) => sum + (li.gst_amount ?? 0), 0)
  const grandTotal = subtotal + gstTotal

  return (
    <div>
      {/* Back link */}
      <Link href="/purchase-orders" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Purchase Orders
      </Link>

      {/* PO Header */}
      <div className="page-header card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="page-title text-2xl font-bold text-[#1B3A6B]">{po.po_number}</h1>
              <span className={cn('badge', PO_STATUS_COLORS[po.status as keyof typeof PO_STATUS_COLORS])}>
                {po.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {po.status === 'draft' && (
              <Link href={`/purchase-orders/${id}/edit`} className="btn-secondary flex items-center gap-1.5">
                <Edit size={15} /> Edit
              </Link>
            )}
            <button className="btn-secondary flex items-center gap-1.5">
              <Printer size={15} /> Print
            </button>
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">PO Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Centre</span>
            <p className="font-medium text-gray-900">{po.centre?.code} — {po.centre?.name}</p>
          </div>
          <div>
            <span className="text-gray-500">Vendor</span>
            <p className="font-medium text-gray-900">{po.vendor?.vendor_code} — {po.vendor?.legal_name}</p>
          </div>
          <div>
            <span className="text-gray-500">PO Date</span>
            <p className="font-medium text-gray-900">{po.po_date ? formatDate(po.po_date) : '—'}</p>
          </div>
          <div>
            <span className="text-gray-500">Expected Delivery</span>
            <p className="font-medium text-gray-900">{po.expected_delivery_date ? formatDate(po.expected_delivery_date) : '—'}</p>
          </div>
          <div>
            <span className="text-gray-500">Priority</span>
            <p className="font-medium text-gray-900 capitalize">{po.priority ?? '—'}</p>
          </div>
          <div>
            <span className="text-gray-500">Created By</span>
            <p className="font-medium text-gray-900">{po.created_by_user?.full_name ?? '—'}</p>
          </div>
          {po.notes && (
            <div className="md:col-span-2 lg:col-span-3">
              <span className="text-gray-500">Notes</span>
              <p className="font-medium text-gray-700">{po.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Line Items Table */}
      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Line Items ({lineItems?.length ?? 0})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Generic Name</th>
                <th>Qty</th>
                <th>Unit</th>
                <th className="text-right">Rate</th>
                <th className="text-center">GST %</th>
                <th className="text-right">GST Amt</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems?.map((li: any) => {
                const lineTotal = (li.rate ?? 0) * (li.qty ?? 0) + (li.gst_amount ?? 0)
                return (
                  <tr key={li.id}>
                    <td className="font-mono text-xs text-gray-600">{li.item?.item_code}</td>
                    <td className="text-sm font-medium text-gray-900">{li.item?.generic_name}</td>
                    <td className="text-sm">{li.qty}</td>
                    <td className="text-sm text-gray-600">{li.unit}</td>
                    <td className="text-sm text-right">{formatCurrency(li.rate)}</td>
                    <td className="text-sm text-center">{li.gst_percent}%</td>
                    <td className="text-sm text-right">{formatCurrency(li.gst_amount)}</td>
                    <td className="text-sm font-semibold text-right">{formatCurrency(lineTotal)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* Totals Row */}
        <div className="px-5 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col items-end gap-1 text-sm">
            <div className="flex gap-8">
              <span className="text-gray-500">Subtotal:</span>
              <span className="font-medium w-28 text-right">{formatLakhs(subtotal)}</span>
            </div>
            <div className="flex gap-8">
              <span className="text-gray-500">GST:</span>
              <span className="font-medium w-28 text-right">{formatLakhs(gstTotal)}</span>
            </div>
            <div className="flex gap-8 border-t border-gray-300 pt-1 mt-1">
              <span className="font-semibold text-[#1B3A6B]">Grand Total:</span>
              <span className="font-bold text-[#1B3A6B] w-28 text-right">{formatLakhs(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Approval History */}
      {approvals && approvals.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Approval History</h2>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Approver</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((a: any) => (
                  <tr key={a.id}>
                    <td className="text-sm">{a.approval_level}</td>
                    <td className="text-sm capitalize">{a.approver_role?.replace(/_/g, ' ') ?? '—'}</td>
                    <td>
                      <span className={cn(
                        'badge',
                        a.status === 'approved' ? 'bg-green-100 text-green-800' :
                        a.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      )}>
                        {a.status === 'approved' && <CheckCircle size={12} className="inline mr-1" />}
                        {a.status}
                      </span>
                    </td>
                    <td className="text-sm">{a.approver?.full_name ?? '—'}</td>
                    <td className="text-sm text-gray-500">{a.approved_at ? formatDate(a.approved_at) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Related GRNs */}
      {grns && grns.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Related GRNs</h2>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>GRN Number</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {grns.map((g: any) => (
                  <tr key={g.id}>
                    <td>
                      <Link href={`/grn/${g.id}`} className="text-[#0D7E8A] hover:underline font-mono text-sm">
                        {g.grn_number}
                      </Link>
                    </td>
                    <td className="text-sm text-gray-600">{g.grn_date ? formatDate(g.grn_date) : '—'}</td>
                    <td>
                      <span className={cn('badge',
                        g.status === 'verified' ? 'bg-green-100 text-green-800' :
                        g.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                        g.status === 'discrepancy' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-700'
                      )}>
                        {g.status}
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
