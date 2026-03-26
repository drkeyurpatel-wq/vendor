import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatCurrency, formatDate, formatDateTime, formatLakhs } from '@/lib/utils'
import { ArrowLeft, CheckCircle, AlertTriangle, Package, RotateCcw, ClipboardCheck, Printer, Download } from 'lucide-react'

import GRNStatusActions from '@/components/ui/GRNStatusActions'

const GRN_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-800',
  verified: 'bg-green-100 text-green-800',
  discrepancy: 'bg-red-100 text-red-800',
}

const QC_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  under_qc: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  partial_approved: 'bg-orange-100 text-orange-800',
  under_review: 'bg-yellow-100 text-yellow-800',
}

export default async function GRNDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, role } = await requireAuth()

  const { data: grn, error } = await supabase
    .from('grns')
    .select(`
      *,
      vendor:vendors(id, vendor_code, legal_name),
      centre:centres(code, name),
      po:purchase_orders(id, po_number, total_amount)
    `)
    .eq('id', id)
    .single()

  if (!grn || error) redirect('/grn')

  // Fetch QC user separately (FK may not exist)
  let qcUserName: string | null = null
  if (grn.qc_checked_by) {
    const { data: qcUser } = await supabase.from('user_profiles').select('full_name').eq('id', grn.qc_checked_by).single()
    qcUserName = qcUser?.full_name || null
  }

  const { data: grnItems } = await supabase
    .from('grn_items')
    .select('*, item:items(item_code, generic_name, unit, manufacturer)')
    .eq('grn_id', id)
    .order('id')

  const items = grnItems ?? []

  const totalReceived = items.reduce((s, i: any) => s + (i.received_qty || 0), 0)
  const totalAccepted = items.reduce((s, i: any) => s + (i.accepted_qty || 0), 0)
  const totalRejected = items.reduce((s, i: any) => s + (i.rejected_qty || 0), 0)
  const totalDamaged = items.reduce((s, i: any) => s + (i.damaged_qty || 0), 0)
  const totalShort = items.reduce((s, i: any) => s + (i.short_qty || 0), 0)

  const subtotal = items.reduce((s, i: any) => s + ((i.accepted_qty || 0) * (i.rate || 0)), 0)
  const cgstTotal = items.reduce((s, i: any) => s + (i.cgst_amount || 0), 0)
  const sgstTotal = items.reduce((s, i: any) => s + (i.sgst_amount || 0), 0)
  const igstTotal = items.reduce((s, i: any) => s + (i.igst_amount || 0), 0)
  const grandTotal = grn.net_amount || grn.total_amount || (subtotal + cgstTotal + sgstTotal + igstTotal)

  const hasRejections = totalRejected > 0 || totalDamaged > 0
  const rejectedItems = items.filter((i: any) => (i.rejected_qty > 0 || i.damaged_qty > 0))

  // Fetch linked system invoice
  const { data: linkedInvoice } = await supabase
    .from('invoices')
    .select('id, invoice_ref, total_amount, payment_status')
    .eq('grn_id', id)
    .limit(1)
    .single()

  // Check for backorder PO created from this GRN's short delivery
  const { data: backorderPO } = grn.po_id ? await supabase
    .from('purchase_orders')
    .select('id, po_number, status, total_amount')
    .eq('amended_from', grn.po_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single() : { data: null }

  return (
    <div>
      {/* Back link */}
      <Link href="/grn" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to GRNs
      </Link>

      {/* Backorder PO banner */}
      {backorderPO && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-600" />
            <div>
              <span className="text-sm font-semibold text-amber-800">Backorder PO created for short-delivered items</span>
              <p className="text-xs text-amber-600 mt-0.5">
                {formatCurrency(backorderPO.total_amount)} · Status: {backorderPO.status?.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <Link href={`/purchase-orders/${backorderPO.id}`}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors">
            View {backorderPO.po_number}
          </Link>
        </div>
      )}

      {/* Header card */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="page-title text-2xl font-bold text-navy-600 font-mono">{grn.grn_number}</h1>
              <span className={cn('badge', GRN_STATUS_COLORS[grn.status] || 'bg-gray-100 text-gray-700')}>
                {grn.status?.replace(/_/g, ' ')}
              </span>
              {grn.quality_status && (
                <span className={cn('badge', QC_STATUS_COLORS[grn.quality_status] || 'bg-gray-100 text-gray-700')}>
                  QC: {grn.quality_status?.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            <p className="text-gray-500 mt-1">
              Against PO:{' '}
              <Link href={`/purchase-orders/${grn.po?.id}`} className="text-teal-500 hover:underline font-mono">
                {grn.po?.po_number}
              </Link>
              {grn.po?.total_amount != null && (
                <span className="text-gray-500 ml-1">({formatCurrency(grn.po.total_amount)})</span>
              )}
              {' | '}Centre:{' '}
              <span className="font-medium text-gray-700">
                {grn.centre?.code} — {grn.centre?.name}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <a href={`/api/pdf/grn?id=${id}`} target="_blank" className="btn-secondary flex items-center gap-1.5 text-sm">
              <Printer size={15} /> PDF
            </a>
            <a href={`/api/docx/grn?id=${id}`} className="btn-secondary flex items-center gap-1.5 text-sm">
              <Download size={15} /> Word
            </a>
            {grn.status === 'verified' && (
              <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-3 py-1.5 rounded-lg text-sm font-medium">
                <CheckCircle size={16} />
                Verified
              </div>
            )}
            {grn.status === 'discrepancy' && (
              <div className="flex items-center gap-1.5 text-red-700 bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium">
                <AlertTriangle size={16} />
                Discrepancy
              </div>
            )}
            {grn.is_return_generated && (
              <div className="flex items-center gap-1.5 text-orange-700 bg-orange-50 px-3 py-1.5 rounded-lg text-sm font-medium">
                <RotateCcw size={16} />
                Return Generated
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GRN Actions */}
      <div className="card p-5 mb-6">
        <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">Actions</h3>
        <GRNStatusActions
          grnId={grn.id} grnNumber={grn.grn_number} currentStatus={grn.status}
          qualityStatus={grn.quality_status} poId={grn.po_id} vendorId={grn.vendor_id}
          centreId={grn.centre_id} userRole={role}
          lineItems={items.map((i: any) => ({ item_id: i.item_id, received_qty: i.received_qty || i.accepted_qty || 0, rate: i.rate }))}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Items Received</div>
          <div className="text-xl font-bold text-navy-600 mt-1">{totalReceived}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Accepted</div>
          <div className="text-xl font-bold text-green-600 mt-1">{totalAccepted}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Rejected</div>
          <div className={cn('text-xl font-bold mt-1', totalRejected > 0 ? 'text-red-600' : 'text-gray-500')}>
            {totalRejected}
          </div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Damaged</div>
          <div className={cn('text-xl font-bold mt-1', totalDamaged > 0 ? 'text-red-600' : 'text-gray-500')}>
            {totalDamaged}
          </div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Short</div>
          <div className={cn('text-xl font-bold mt-1', totalShort > 0 ? 'text-orange-600' : 'text-gray-500')}>
            {totalShort}
          </div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Invoice Amount</div>
          <div className="text-xl font-bold text-navy-600 mt-1">
            {grn.vendor_invoice_amount ? formatLakhs(grn.vendor_invoice_amount) : '—'}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left: GRN Details */}
        <div className="card p-5">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-4 flex items-center gap-2">
            <ClipboardCheck size={14} className="text-teal-500" />
            GRN Details
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Vendor:</span>
              <Link href={`/vendors/${grn.vendor?.id}`} className="text-teal-500 hover:underline font-medium">
                {grn.vendor?.vendor_code} — {grn.vendor?.legal_name}
              </Link>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">GRN Date:</span>
              <span className="font-medium">{formatDate(grn.grn_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status:</span>
              <span className={cn('badge text-xs', GRN_STATUS_COLORS[grn.status] || 'bg-gray-100 text-gray-700')}>
                {grn.status?.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Quality Status:</span>
              <span className={cn('badge text-xs', QC_STATUS_COLORS[grn.quality_status] || 'bg-gray-100 text-gray-700')}>
                {grn.quality_status?.replace(/_/g, ' ') || 'pending'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Created:</span>
              <span className="font-medium">{formatDateTime(grn.created_at)}</span>
            </div>
            {grn.verified_by && (
              <div className="flex justify-between">
                <span className="text-gray-500">Verified By:</span>
                <span className="font-medium">{grn.verified_by}</span>
              </div>
            )}
            {grn.verified_at && (
              <div className="flex justify-between">
                <span className="text-gray-500">Verified At:</span>
                <span className="font-medium">{formatDateTime(grn.verified_at)}</span>
              </div>
            )}
            {qcUserName && (
              <div className="flex justify-between">
                <span className="text-gray-500">QC Checked By:</span>
                <span className="font-medium">{qcUserName}</span>
              </div>
            )}
            {grn.qc_date && (
              <div className="flex justify-between">
                <span className="text-gray-500">QC Date:</span>
                <span className="font-medium">{formatDate(grn.qc_date)}</span>
              </div>
            )}
            {grn.qc_notes && (
              <div className="flex justify-between">
                <span className="text-gray-500">QC Notes:</span>
                <span className="font-medium text-right max-w-[60%]">{grn.qc_notes}</span>
              </div>
            )}
            {grn.quarantine_till && (
              <div className="flex justify-between">
                <span className="text-gray-500">Quarantine Till:</span>
                <span className="font-medium text-orange-600">{formatDate(grn.quarantine_till)}</span>
              </div>
            )}
            {grn.return_debit_note_no && (
              <div className="flex justify-between">
                <span className="text-gray-500">Return DN No.:</span>
                <span className="font-mono font-medium text-red-600">{grn.return_debit_note_no}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Vendor Invoice + Transport */}
        <div className="space-y-6">
          {/* Vendor Invoice card */}
          <div className="card p-5">
            <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-4">Vendor Invoice</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice No.:</span>
                <span className="font-mono font-medium">{grn.vendor_invoice_no || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice Date:</span>
                <span className="font-medium">
                  {grn.vendor_invoice_date ? formatDate(grn.vendor_invoice_date) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice Amount:</span>
                <span className="font-bold text-navy-600">
                  {grn.vendor_invoice_amount ? formatCurrency(grn.vendor_invoice_amount) : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* System Invoice (if created) */}
          {linkedInvoice && (
            <div className="card p-5 border-l-4 border-teal-500">
              <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">System Invoice</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice Ref:</span>
                  <Link href={`/finance/invoices/${linkedInvoice.id}`} className="font-mono text-teal-600 hover:underline font-semibold">{linkedInvoice.invoice_ref}</Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-bold text-navy-600">{formatCurrency(linkedInvoice.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment:</span>
                  <span className={cn('badge', linkedInvoice.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>
                    {(linkedInvoice.payment_status || 'unpaid').replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Create Invoice prompt when GRN is verified/submitted but no invoice yet */}
          {!linkedInvoice && grn.status === 'verified' && (
            <div className="card p-5 border-l-4 border-amber-400 bg-amber-50/30">
              <h3 className="text-xs uppercase tracking-wide text-amber-700 font-semibold mb-2">Invoice Pending</h3>
              <p className="text-sm text-gray-600 mb-3">This GRN has been verified but no invoice has been created yet.</p>
              <Link
                href={`/finance/invoices/new?grn=${grn.id}`}
                className="btn-primary inline-flex items-center gap-1.5 text-sm"
              >
                Create Invoice →
              </Link>
            </div>
          )}

          {/* Transport card */}
          <div className="card p-5">
            <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-4">Transport Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">DC Number:</span>
                <span className="font-mono font-medium">{grn.dc_number || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">DC Date:</span>
                <span className="font-medium">{grn.dc_date ? formatDate(grn.dc_date) : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">LR Number:</span>
                <span className="font-mono font-medium">{grn.lr_number || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Transport:</span>
                <span className="font-medium">{grn.transport_name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vehicle No.:</span>
                <span className="font-mono font-medium">{grn.vehicle_number || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">E-Way Bill:</span>
                <span className="font-mono font-medium">{grn.eway_bill_no || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package size={16} className="text-teal-500" />
          <h2 className="font-semibold text-gray-900">Received Items ({items.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="text-left">Item</th>
                <th>HSN</th>
                <th>Batch</th>
                <th>Expiry</th>
                <th className="text-right">MRP</th>
                <th className="text-right">Ordered</th>
                <th className="text-right">Received</th>
                <th className="text-right">Accepted</th>
                <th className="text-right">Rejected</th>
                <th className="text-right">Damaged</th>
                <th className="text-right">Free</th>
                <th className="text-right">Rate</th>
                <th className="text-right">CGST</th>
                <th className="text-right">SGST</th>
                <th className="text-right">Total</th>
                <th>QC Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((gi: any) => (
                <tr key={gi.id}>
                  <td className="min-w-[180px]">
                    <div className="font-medium text-gray-900 text-sm">{gi.item?.generic_name}</div>
                    <div className="font-mono text-xs text-gray-500">{gi.item?.item_code}</div>
                    {gi.item?.manufacturer && (
                      <div className="text-xs text-gray-500">{gi.item.manufacturer}</div>
                    )}
                  </td>
                  <td className="font-mono text-xs text-gray-500">{gi.hsn_code || '—'}</td>
                  <td className="font-mono text-xs text-gray-600">{gi.batch_no || '—'}</td>
                  <td className="text-xs text-gray-600 whitespace-nowrap">
                    {gi.expiry_date ? formatDate(gi.expiry_date) : '—'}
                  </td>
                  <td className="text-right text-sm text-gray-600">
                    {gi.mrp != null ? formatCurrency(gi.mrp) : '—'}
                  </td>
                  <td className="text-right text-sm text-gray-600">{gi.ordered_qty}</td>
                  <td className="text-right text-sm font-medium">{gi.received_qty}</td>
                  <td className="text-right text-sm font-medium text-green-600">{gi.accepted_qty}</td>
                  <td className={cn(
                    'text-right text-sm font-medium',
                    gi.rejected_qty > 0 ? 'text-red-600' : 'text-gray-500'
                  )}>
                    {gi.rejected_qty}
                  </td>
                  <td className={cn(
                    'text-right text-sm font-medium',
                    gi.damaged_qty > 0 ? 'text-red-600' : 'text-gray-500'
                  )}>
                    {gi.damaged_qty}
                  </td>
                  <td className="text-right text-sm text-gray-600">{gi.free_qty || 0}</td>
                  <td className="text-right text-sm font-medium whitespace-nowrap">
                    {formatCurrency(gi.rate)}
                  </td>
                  <td className="text-right text-xs text-gray-500 whitespace-nowrap">
                    {gi.cgst_amount != null ? formatCurrency(gi.cgst_amount) : '—'}
                    {gi.cgst_percent != null && (
                      <div className="text-[10px] text-gray-500">{gi.cgst_percent}%</div>
                    )}
                  </td>
                  <td className="text-right text-xs text-gray-500 whitespace-nowrap">
                    {gi.sgst_amount != null ? formatCurrency(gi.sgst_amount) : '—'}
                    {gi.sgst_percent != null && (
                      <div className="text-[10px] text-gray-500">{gi.sgst_percent}%</div>
                    )}
                  </td>
                  <td className="text-right text-sm font-bold whitespace-nowrap">
                    {formatCurrency(gi.total_amount)}
                  </td>
                  <td>
                    <span className={cn(
                      'badge text-xs whitespace-nowrap',
                      QC_STATUS_COLORS[gi.qc_status] || 'bg-gray-100 text-gray-700'
                    )}>
                      {(gi.qc_status || 'pending')?.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={16} className="text-center py-8 text-gray-500">
                    No items found for this GRN.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tax summary footer */}
        <div className="border-t border-gray-200 bg-navy-50 px-5 py-4">
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {cgstTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">CGST Total:</span>
                  <span className="font-medium">{formatCurrency(cgstTotal)}</span>
                </div>
              )}
              {sgstTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">SGST Total:</span>
                  <span className="font-medium">{formatCurrency(sgstTotal)}</span>
                </div>
              )}
              {igstTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">IGST Total:</span>
                  <span className="font-medium">{formatCurrency(igstTotal)}</span>
                </div>
              )}
              {(grn.discount_amount || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-medium text-green-600">-{formatCurrency(grn.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-300 pt-2">
                <span className="font-semibold text-navy-600">Grand Total:</span>
                <span className="font-bold text-navy-600 text-base">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection/Damage reasons section */}
      {hasRejections && (
        <div className="card border-2 border-red-200 overflow-hidden mb-6">
          <div className="px-5 py-4 bg-red-50 border-b border-red-200 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600" />
            <h2 className="font-semibold text-red-800">Rejection / Damage Details</h2>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              {rejectedItems.map((gi: any) => (
                <div key={gi.id} className="flex flex-col sm:flex-row sm:items-start gap-2 pb-3 border-b border-red-100 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">
                      {gi.item?.generic_name}
                      <span className="font-mono text-xs text-gray-500 ml-2">{gi.item?.item_code}</span>
                    </div>
                    {gi.batch_no && (
                      <div className="text-xs text-gray-500 mt-0.5">Batch: {gi.batch_no}</div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    {gi.rejected_qty > 0 && (
                      <div>
                        <span className="text-red-600 font-semibold">{gi.rejected_qty} rejected</span>
                        {gi.rejection_reason && (
                          <span className="text-gray-500 ml-1">— {gi.rejection_reason}</span>
                        )}
                      </div>
                    )}
                    {gi.damaged_qty > 0 && (
                      <div>
                        <span className="text-red-600 font-semibold">{gi.damaged_qty} damaged</span>
                        {gi.damage_reason && (
                          <span className="text-gray-500 ml-1">— {gi.damage_reason}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {grn.notes && (
        <div className="card p-5">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">Notes</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{grn.notes}</p>
        </div>
      )}
    </div>
  )
}
