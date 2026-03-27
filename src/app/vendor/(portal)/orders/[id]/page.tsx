import { requireVendorAuth } from '@/lib/vendor-auth'
import Link from 'next/link'
import { cn, formatDate, formatCurrency, PO_STATUS_COLORS } from '@/lib/utils'
import { ArrowLeft, Download, Package, AlertTriangle, CheckCircle } from 'lucide-react'
import VendorPOActions from '@/components/vendor/VendorPOActions'

export const dynamic = 'force-dynamic'

export default async function VendorOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase, vendorId } = await requireVendorAuth()

  const { data: po } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      centre:centres(code, name),
      items:purchase_order_items(
        id, ordered_qty, received_qty, pending_qty, unit, rate, gst_percent,
        cgst_amount, sgst_amount, igst_amount, total_amount, hsn_code, notes, manufacturer,
        net_rate, mrp, trade_discount_percent, free_qty,
        item:items(item_code, generic_name, brand_name)
      )
    `)
    .eq('id', id)
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)
    .single()

  if (!po) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <AlertTriangle size={40} className="mx-auto mb-3 text-yellow-400" />
        <p className="font-medium text-gray-500">Purchase Order Not Found</p>
        <p className="text-sm text-gray-400 mt-1">This PO does not exist or does not belong to your account.</p>
        <Link href="/vendor/orders" className="inline-block mt-4 px-4 py-2 bg-[#0D7E8A] text-white text-sm font-medium rounded-xl hover:bg-[#0a6972] transition-colors">Back to Orders</Link>
      </div>
    )
  }

  const canAcknowledge = ['approved', 'sent_to_vendor'].includes(po.status) && !po.vendor_acknowledged
  const items = po.items || []
  const subtotal = items.reduce((s: number, i: any) => s + (Number(i.rate) * Number(i.ordered_qty) || 0), 0)
  const totalGST = items.reduce((s: number, i: any) => s + (Number(i.cgst_amount || 0) + Number(i.sgst_amount || 0) + Number(i.igst_amount || 0)), 0)

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/vendor/orders" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{po.po_number}</h1>
            <p className="text-sm text-gray-500">{(po.centre as any)?.name} ({(po.centre as any)?.code})</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <a
            href={`/api/pdf/po?id=${po.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Download size={14} /> Download PDF
          </a>
          {canAcknowledge && (
            <VendorPOActions poId={po.id} poNumber={po.po_number} vendorId={vendorId} />
          )}
        </div>
      </div>

      {/* Status Banner */}
      {po.vendor_acknowledged && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl mb-6 text-sm text-green-700">
          <CheckCircle size={16} />
          <span>Acknowledged on {po.vendor_acknowledged_at ? formatDate(po.vendor_acknowledged_at) : '—'}</span>
          {po.vendor_confirmed_delivery_date && (
            <span className="ml-2 font-medium">| Confirmed delivery: {formatDate(po.vendor_confirmed_delivery_date)}</span>
          )}
        </div>
      )}

      {po.vendor_dispute && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-6 text-sm text-red-700">
          <AlertTriangle size={16} />
          <span>Dispute raised: {po.vendor_dispute_reason}</span>
        </div>
      )}

      {/* PO Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">Status</div>
          <span className={cn('px-2 py-0.5 rounded text-xs font-medium', PO_STATUS_COLORS[po.status as keyof typeof PO_STATUS_COLORS])}>
            {po.status.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">PO Date</div>
          <div className="text-sm font-semibold text-gray-900">{formatDate(po.po_date)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">Expected Delivery</div>
          <div className="text-sm font-semibold text-gray-900">{po.expected_delivery_date ? formatDate(po.expected_delivery_date) : '—'}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">Priority</div>
          <div className="text-sm font-semibold text-gray-900 capitalize">{po.priority || 'Normal'}</div>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Line Items ({items.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">HSN</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Received</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Unit</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Rate</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">GST %</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, idx: number) => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-xs text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">{item.item?.generic_name || '—'}</div>
                    {item.item?.brand_name && <div className="text-[11px] text-gray-500">{item.item.brand_name}</div>}
                    {item.manufacturer && <div className="text-[11px] text-gray-400">Mfr: {item.manufacturer}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 font-mono">{item.hsn_code || '—'}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">{Number(item.ordered_qty)}</td>
                  <td className="px-4 py-3 text-sm text-right">
                    <span className={cn(
                      'font-semibold',
                      Number(item.received_qty || 0) >= Number(item.ordered_qty) ? 'text-green-600' :
                      Number(item.received_qty || 0) > 0 ? 'text-orange-600' : 'text-gray-400'
                    )}>
                      {Number(item.received_qty || 0)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{item.unit}</td>
                  <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.rate)}</td>
                  <td className="px-4 py-3 text-sm text-right">{Number(item.gst_percent || 0)}%</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(item.total_amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr className="border-t border-gray-200">
                <td colSpan={8} className="px-4 py-3 text-right text-sm font-medium text-gray-600">Subtotal</td>
                <td className="px-4 py-3 text-right text-sm font-semibold">{formatCurrency(subtotal)}</td>
              </tr>
              <tr>
                <td colSpan={8} className="px-4 py-2 text-right text-sm font-medium text-gray-600">GST</td>
                <td className="px-4 py-2 text-right text-sm font-semibold">{formatCurrency(totalGST)}</td>
              </tr>
              <tr className="border-t border-gray-300">
                <td colSpan={8} className="px-4 py-3 text-right text-sm font-bold text-gray-900">Total</td>
                <td className="px-4 py-3 text-right text-base font-bold text-[#1B3A6B]">{formatCurrency(po.total_amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Notes & Delivery */}
      {(po.notes || po.delivery_address || po.vendor_notes) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {po.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">PO Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{po.notes}</p>
            </div>
          )}
          {po.delivery_address && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Delivery Address</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{po.delivery_address}</p>
            </div>
          )}
          {po.vendor_notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Your Notes</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{po.vendor_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
