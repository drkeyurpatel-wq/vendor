import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatCurrency, formatDate, formatDateTime, formatLakhs } from '@/lib/utils'
import { ArrowLeft, CheckCircle, AlertTriangle, Package } from 'lucide-react'

const GRN_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-800',
  verified: 'bg-green-100 text-green-800',
  discrepancy: 'bg-red-100 text-red-800',
}

export default async function GRNDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: grn, error } = await supabase
    .from('grns')
    .select('*, vendor:vendors(id, vendor_code, legal_name), centre:centres(code, name), po:purchase_orders(id, po_number, total_amount)')
    .eq('id', id)
    .single()

  if (!grn || error) redirect('/grn')

  const { data: grnItems } = await supabase
    .from('grn_items')
    .select('*, item:items(item_code, generic_name, unit)')
    .eq('grn_id', id)
    .order('created_at')

  const totalReceived = grnItems?.reduce((s, i: any) => s + i.received_qty, 0) ?? 0
  const totalAccepted = grnItems?.reduce((s, i: any) => s + i.accepted_qty, 0) ?? 0
  const totalRejected = grnItems?.reduce((s, i: any) => s + i.rejected_qty, 0) ?? 0

  return (
    <div>
      <Link href="/grn" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to GRNs
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[#1B3A6B] font-mono">{grn.grn_number}</h1>
              <span className={cn('badge', GRN_STATUS_COLORS[grn.status] || 'bg-gray-100 text-gray-700')}>
                {grn.status}
              </span>
            </div>
            <p className="text-gray-500 mt-1">
              Against PO: <Link href={`/purchase-orders/${grn.po?.id}`} className="text-[#0D7E8A] hover:underline font-mono">{grn.po?.po_number}</Link>
              {' | '}Centre: <span className="font-medium text-gray-700">{grn.centre?.code} — {grn.centre?.name}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="text-sm text-gray-500">Items Received</div>
          <div className="text-xl font-bold text-[#1B3A6B]">{totalReceived}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-gray-500">Accepted</div>
          <div className="text-xl font-bold text-green-600">{totalAccepted}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-gray-500">Rejected</div>
          <div className={cn('text-xl font-bold', totalRejected > 0 ? 'text-red-600' : 'text-gray-400')}>{totalRejected}</div>
        </div>
        <div className="stat-card">
          <div className="text-sm text-gray-500">Invoice Amount</div>
          <div className="text-xl font-bold text-[#1B3A6B]">{grn.vendor_invoice_amount ? formatLakhs(grn.vendor_invoice_amount) : '—'}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Vendor & GRN Info */}
        <div className="card p-5">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-3">GRN Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Vendor:</span>
              <Link href={`/vendors/${grn.vendor?.id}`} className="text-[#0D7E8A] hover:underline font-medium">{grn.vendor?.legal_name}</Link>
            </div>
            <div className="flex justify-between"><span className="text-gray-500">GRN Date:</span><span className="font-medium">{formatDate(grn.grn_date)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Created:</span><span className="font-medium">{formatDateTime(grn.created_at)}</span></div>
          </div>
        </div>

        {/* Invoice Info */}
        <div className="card p-5">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-3">Vendor Invoice</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Invoice No.:</span><span className="font-mono font-medium">{grn.vendor_invoice_no || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Invoice Date:</span><span className="font-medium">{grn.vendor_invoice_date ? formatDate(grn.vendor_invoice_date) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Amount:</span><span className="font-bold">{grn.vendor_invoice_amount ? formatCurrency(grn.vendor_invoice_amount) : '—'}</span></div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package size={16} className="text-[#0D7E8A]" />
          <h2 className="font-semibold text-gray-900">Received Items ({grnItems?.length ?? 0})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Unit</th>
                <th>Received</th>
                <th>Accepted</th>
                <th>Rejected</th>
                <th>Batch No.</th>
                <th>Expiry</th>
                <th>Rejection Reason</th>
              </tr>
            </thead>
            <tbody>
              {grnItems?.map((gi: any) => (
                <tr key={gi.id}>
                  <td>
                    <div className="font-medium text-gray-900 text-sm">{gi.item?.generic_name}</div>
                    <div className="font-mono text-xs text-gray-400">{gi.item?.item_code}</div>
                  </td>
                  <td className="text-sm text-gray-600">{gi.item?.unit}</td>
                  <td className="text-sm font-medium">{gi.received_qty}</td>
                  <td className="text-sm text-green-600 font-medium">{gi.accepted_qty}</td>
                  <td className={cn('text-sm font-medium', gi.rejected_qty > 0 ? 'text-red-600' : 'text-gray-400')}>{gi.rejected_qty}</td>
                  <td className="font-mono text-xs text-gray-600">{gi.batch_no || '—'}</td>
                  <td className="text-sm text-gray-600">{gi.expiry_date ? formatDate(gi.expiry_date) : '—'}</td>
                  <td className="text-sm text-red-600">{gi.rejection_reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {grn.notes && (
        <div className="card p-5 mt-6">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Notes</h3>
          <p className="text-sm text-gray-700">{grn.notes}</p>
        </div>
      )}
    </div>
  )
}
