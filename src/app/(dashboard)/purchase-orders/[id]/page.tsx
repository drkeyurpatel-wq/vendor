import { createClient } from '@/lib/supabase/server'
import { cn, formatDate, formatLakhs, formatCurrency, PO_STATUS_COLORS } from '@/lib/utils'
import { ArrowLeft, Edit, Printer, CheckCircle, Package, FileText, Truck } from 'lucide-react'
import Link from 'next/link'

export default async function PODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: po, error } = await supabase
    .from('purchase_orders')
    .select('*, vendor:vendors(id, legal_name, vendor_code, gstin, state), centre:centres(code, name, state), created_by_user:user_profiles!created_by(full_name)')
    .eq('id', id)
    .single()

  const [{ data: lineItems }, { data: approvals }, { data: grns }] = await Promise.all([
    supabase.from('purchase_order_items').select('*, item:items(item_code, generic_name, manufacturer)').eq('po_id', id),
    supabase.from('po_approvals').select('*, approver:user_profiles(full_name)').eq('po_id', id).order('approval_level'),
    supabase.from('grns').select('id, grn_number, grn_date, status, quality_status, total_amount').eq('po_id', id),
  ])

  if (!po || error) {
    return (
      <div>
        <Link href="/purchase-orders" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={14} /> Back</Link>
        <div className="card p-8 text-center"><h2 className="text-xl font-semibold text-gray-700">PO Not Found</h2></div>
      </div>
    )
  }

  const subtotal = (lineItems ?? []).reduce((s: number, li: any) => s + (li.ordered_qty * (li.net_rate || li.rate || 0)), 0)
  const totalCGST = (lineItems ?? []).reduce((s: number, li: any) => s + (li.cgst_amount || 0), 0)
  const totalSGST = (lineItems ?? []).reduce((s: number, li: any) => s + (li.sgst_amount || 0), 0)
  const totalIGST = (lineItems ?? []).reduce((s: number, li: any) => s + (li.igst_amount || 0), 0)
  const isInterState = totalIGST > 0

  return (
    <div>
      <Link href="/purchase-orders" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={14} /> Back to Purchase Orders</Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[#1B3A6B] font-mono">{po.po_number}</h1>
              <span className={cn('badge', PO_STATUS_COLORS[po.status as keyof typeof PO_STATUS_COLORS])}>{po.status.replace(/_/g, ' ')}</span>
              {po.priority === 'urgent' && <span className="badge bg-orange-100 text-orange-700">Urgent</span>}
              {po.priority === 'emergency' && <span className="badge bg-red-100 text-red-700">Emergency</span>}
              {(po.revision_number || 0) > 0 && <span className="badge bg-purple-100 text-purple-700">Rev {po.revision_number}</span>}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              <Link href={`/vendors/${po.vendor?.id}`} className="text-[#0D7E8A] hover:underline">{po.vendor?.legal_name}</Link>
              {' '}<span className="font-mono text-xs text-gray-400">({po.vendor?.vendor_code})</span>
              {' | '}<span className="font-medium">{po.centre?.code} — {po.centre?.name}</span>
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['approved', 'sent_to_vendor', 'partially_received'].includes(po.status) && (
              <Link href={`/grn/new?po=${po.id}`} className="btn-primary flex items-center gap-1.5"><Truck size={15} /> Create GRN</Link>
            )}
            {po.status === 'draft' && (
              <Link href={`/purchase-orders/${id}/edit`} className="btn-secondary flex items-center gap-1.5"><Edit size={15} /> Edit</Link>
            )}
            <button className="btn-secondary flex items-center gap-1.5"><Printer size={15} /> Print</button>
          </div>
        </div>
      </div>

      {/* 3-col summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card p-5">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-3">Order Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">PO Date:</span><span className="font-medium">{formatDate(po.po_date)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Expected Delivery:</span><span className="font-medium">{po.expected_delivery_date ? formatDate(po.expected_delivery_date) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Priority:</span><span className="font-medium capitalize">{po.priority}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Created By:</span><span className="font-medium">{po.created_by_user?.full_name || '—'}</span></div>
            {po.quotation_ref && <div className="flex justify-between"><span className="text-gray-500">Quotation:</span><span className="font-mono text-xs">{po.quotation_ref}</span></div>}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-3">Vendor</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Name:</span><Link href={`/vendors/${po.vendor?.id}`} className="text-[#0D7E8A] hover:underline font-medium">{po.vendor?.legal_name}</Link></div>
            <div className="flex justify-between"><span className="text-gray-500">GSTIN:</span><span className="font-mono text-xs">{po.vendor?.gstin || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Supply:</span><span className="badge bg-gray-100 text-gray-700 text-[10px]">{isInterState ? 'Inter-State' : 'Intra-State'}</span></div>
          </div>
        </div>
        <div className="card p-5">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-3">Amount Summary</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span className="font-mono">{formatCurrency(subtotal)}</span></div>
            {(po.discount_amount || 0) > 0 && <div className="flex justify-between text-green-600"><span>Discount:</span><span className="font-mono">-{formatCurrency(po.discount_amount)}</span></div>}
            {!isInterState ? (
              <><div className="flex justify-between"><span className="text-gray-500">CGST:</span><span className="font-mono">{formatCurrency(totalCGST)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">SGST:</span><span className="font-mono">{formatCurrency(totalSGST)}</span></div></>
            ) : (
              <div className="flex justify-between"><span className="text-gray-500">IGST:</span><span className="font-mono">{formatCurrency(totalIGST)}</span></div>
            )}
            {(po.freight_amount || 0) > 0 && <div className="flex justify-between"><span className="text-gray-500">Freight:</span><span className="font-mono">{formatCurrency(po.freight_amount)}</span></div>}
            <div className="flex justify-between border-t pt-1.5 border-gray-200">
              <span className="font-semibold text-[#1B3A6B]">Grand Total:</span>
              <span className="font-bold text-[#1B3A6B] font-mono">{formatLakhs(po.total_amount)}</span>
            </div>
            {po.tds_applicable && <div className="flex justify-between text-orange-600"><span>TDS ({po.tds_section} @ {po.tds_rate}%):</span><span className="font-mono">-{formatCurrency(po.tds_amount || 0)}</span></div>}
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-semibold text-[#1B3A6B] flex items-center gap-2"><Package size={16} /> Line Items ({lineItems?.length ?? 0})</h2></div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th><th>HSN</th><th>Unit</th><th>Qty</th><th>Free</th><th>Recv</th>
                <th className="text-right">Rate</th><th className="text-right">Net Rate</th>
                {!isInterState ? <><th className="text-right">CGST</th><th className="text-right">SGST</th></> : <th className="text-right">IGST</th>}
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems?.map((li: any) => (
                <tr key={li.id}>
                  <td>
                    <div className="font-medium text-gray-900 text-sm">{li.item?.generic_name}</div>
                    <div className="font-mono text-xs text-gray-400">{li.item?.item_code}</div>
                    {li.item?.manufacturer && <div className="text-[10px] text-gray-400">{li.item.manufacturer}</div>}
                    {li.trade_discount_percent > 0 && <div className="text-[10px] text-green-600">Disc: {li.trade_discount_percent}%</div>}
                  </td>
                  <td className="font-mono text-xs text-gray-500">{li.hsn_code || '—'}</td>
                  <td className="text-sm text-gray-600">{li.purchase_unit && li.purchase_unit !== li.unit ? <>{li.purchase_unit}<div className="text-[10px] text-gray-400">×{li.conversion_factor} {li.unit}</div></> : li.unit}</td>
                  <td className="text-sm font-medium">{li.ordered_qty}</td>
                  <td className="text-sm text-gray-500">{li.free_qty || '—'}</td>
                  <td><span className={cn('text-sm font-medium', (li.received_qty || 0) >= li.ordered_qty ? 'text-green-600' : (li.received_qty || 0) > 0 ? 'text-yellow-600' : 'text-gray-400')}>{li.received_qty || 0}/{li.ordered_qty}</span></td>
                  <td className="text-sm text-right font-mono">{formatCurrency(li.rate)}</td>
                  <td className="text-sm text-right font-mono">{li.net_rate ? formatCurrency(li.net_rate) : '—'}</td>
                  {!isInterState ? (
                    <><td className="text-xs text-right text-gray-500">{li.cgst_percent || (li.gst_percent / 2)}%<br /><span className="font-mono">{formatCurrency(li.cgst_amount || 0)}</span></td>
                    <td className="text-xs text-right text-gray-500">{li.sgst_percent || (li.gst_percent / 2)}%<br /><span className="font-mono">{formatCurrency(li.sgst_amount || 0)}</span></td></>
                  ) : (
                    <td className="text-xs text-right text-gray-500">{li.igst_percent || li.gst_percent}%<br /><span className="font-mono">{formatCurrency(li.igst_amount || 0)}</span></td>
                  )}
                  <td className="text-sm font-semibold text-right font-mono">{formatCurrency(li.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Terms */}
      {(po.terms_and_conditions || po.delivery_instructions || po.payment_terms || po.notes) && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Terms & Notes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {po.payment_terms && <div><span className="text-gray-500 block mb-1">Payment Terms</span><p>{po.payment_terms}</p></div>}
            {po.delivery_instructions && <div><span className="text-gray-500 block mb-1">Delivery Instructions</span><p>{po.delivery_instructions}</p></div>}
            {po.terms_and_conditions && <div className="md:col-span-2"><span className="text-gray-500 block mb-1">Terms & Conditions</span><p className="whitespace-pre-line">{po.terms_and_conditions}</p></div>}
            {po.notes && <div className="md:col-span-2"><span className="text-gray-500 block mb-1">Notes</span><p>{po.notes}</p></div>}
          </div>
        </div>
      )}

      {/* Approval History */}
      {approvals && approvals.length > 0 && (
        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Approval History</h2>
          <table className="data-table"><thead><tr><th>Level</th><th>Role</th><th>Status</th><th>Approver</th><th>Date</th></tr></thead>
            <tbody>{approvals.map((a: any) => (
              <tr key={a.id}>
                <td className="text-sm">{a.approval_level}</td>
                <td className="text-sm capitalize">{a.approver_role?.replace(/_/g, ' ')}</td>
                <td><span className={cn('badge', a.status === 'approved' ? 'bg-green-100 text-green-800' : a.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')}>{a.status === 'approved' && <CheckCircle size={12} className="inline mr-1" />}{a.status}</span></td>
                <td className="text-sm">{a.approver?.full_name || '—'}</td>
                <td className="text-sm text-gray-500">{a.approved_at ? formatDate(a.approved_at) : '—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* Related GRNs */}
      {grns && grns.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2"><FileText size={16} /> GRNs ({grns.length})</h2>
          <table className="data-table"><thead><tr><th>GRN #</th><th>Date</th><th>Amount</th><th>Status</th><th>QC</th></tr></thead>
            <tbody>{grns.map((g: any) => (
              <tr key={g.id}>
                <td><Link href={`/grn/${g.id}`} className="text-[#0D7E8A] hover:underline font-mono text-sm">{g.grn_number}</Link></td>
                <td className="text-sm text-gray-600">{formatDate(g.grn_date)}</td>
                <td className="text-sm font-medium">{g.total_amount ? formatCurrency(g.total_amount) : '—'}</td>
                <td><span className={cn('badge', g.status === 'verified' ? 'bg-green-100 text-green-800' : g.status === 'submitted' ? 'bg-blue-100 text-blue-800' : g.status === 'discrepancy' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700')}>{g.status}</span></td>
                <td><span className={cn('badge', g.quality_status === 'approved' ? 'bg-green-100 text-green-800' : g.quality_status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')}>{g.quality_status || 'pending'}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
