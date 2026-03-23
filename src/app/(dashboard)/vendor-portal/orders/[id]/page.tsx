import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatDate, formatCurrency, PO_STATUS_COLORS } from '@/lib/utils'
import { Package, AlertTriangle, ArrowLeft, Download, FileText } from 'lucide-react'
import AcknowledgePOButton from './AcknowledgeButton'

export default async function VendorPODetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, centre_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'vendor') {
    return (
      <div className="card p-12 text-center">
        <Package size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="font-medium text-gray-500">Vendor Portal</p>
        <p className="text-sm text-gray-400 mt-1">This page is only accessible to vendor users</p>
      </div>
    )
  }

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, vendor_code, legal_name')
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

  // Fetch PO with items
  const { data: po } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      centre:centres(code, name),
      items:purchase_order_items(
        id, ordered_qty, unit, rate, gst_percent, cgst_amount, sgst_amount, igst_amount, total_amount, hsn_code, notes, manufacturer,
        item:items(item_code, generic_name, brand_name)
      )
    `)
    .eq('id', params.id)
    .eq('vendor_id', vendor.id)
    .is('deleted_at', null)
    .single()

  if (!po) {
    return (
      <div className="card p-12 text-center">
        <AlertTriangle size={40} className="mx-auto mb-3 text-yellow-400" />
        <p className="font-medium text-gray-500">Purchase Order Not Found</p>
        <p className="text-sm text-gray-400 mt-1">This PO does not exist or does not belong to your account.</p>
        <Link href="/vendor-portal/orders" className="btn-primary mt-4 inline-block text-sm">Back to Orders</Link>
      </div>
    )
  }

  const canAcknowledge = ['approved', 'sent_to_vendor'].includes(po.status)

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/vendor-portal/orders" className="text-gray-400 hover:text-[#1B3A6B] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="page-title">{po.po_number}</h1>
            <p className="page-subtitle">{po.centre?.name} ({po.centre?.code})</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/api/pdf/po?id=${po.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <Download size={16} />
            Download PDF
          </a>
          <a
            href={`/api/docx/po?id=${po.id}`}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <FileText size={16} />
            Download Word
          </a>
          {canAcknowledge && (
            <AcknowledgePOButton poId={po.id} poNumber={po.po_number} poStatus={po.status} vendorId={vendor?.id || ''} />
          )}
        </div>
      </div>

      {/* PO Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-1">Status</div>
          <span className={cn('badge text-sm', PO_STATUS_COLORS[po.status as keyof typeof PO_STATUS_COLORS])}>
            {po.status.replace(/_/g, ' ')}
          </span>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-1">PO Date</div>
          <div className="font-semibold text-gray-900">{formatDate(po.po_date)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-1">Expected Delivery</div>
          <div className="font-semibold text-gray-900">
            {po.expected_delivery_date ? formatDate(po.expected_delivery_date) : 'Not specified'}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-1">Priority</div>
          <div className="font-semibold text-gray-900 capitalize">{po.priority || 'Normal'}</div>
        </div>
      </div>

      {/* Line Items */}
      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText size={18} className="text-[#1B3A6B]" />
            Line Items ({po.items?.length ?? 0})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>HSN</th>
                <th className="text-right">Qty</th>
                <th>Unit</th>
                <th className="text-right">Rate</th>
                <th className="text-right">GST %</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {po.items?.map((item: any, idx: number) => (
                <tr key={item.id}>
                  <td className="text-sm text-gray-500">{idx + 1}</td>
                  <td>
                    <div className="font-medium text-sm">{item.item?.generic_name}</div>
                    {item.item?.brand_name && (
                      <div className="text-xs text-gray-400">{item.item.brand_name}</div>
                    )}
                    <div className="text-xs text-gray-400 font-mono">{item.item?.item_code}</div>
                  </td>
                  <td className="text-xs text-gray-500 font-mono">{item.hsn_code || '-'}</td>
                  <td className="text-sm text-right font-semibold">{item.ordered_qty}</td>
                  <td className="text-sm text-gray-600">{item.unit}</td>
                  <td className="text-sm text-right">{formatCurrency(item.rate)}</td>
                  <td className="text-sm text-right">{item.gst_percent}%</td>
                  <td className="text-sm text-right font-semibold">{formatCurrency(item.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tax Summary & Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Tax Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(po.subtotal)}</span>
            </div>
            {po.discount_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Discount</span>
                <span className="font-medium text-green-600">-{formatCurrency(po.discount_amount)}</span>
              </div>
            )}
            {po.cgst_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">CGST</span>
                <span className="font-medium">{formatCurrency(po.cgst_amount)}</span>
              </div>
            )}
            {po.sgst_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">SGST</span>
                <span className="font-medium">{formatCurrency(po.sgst_amount)}</span>
              </div>
            )}
            {po.igst_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">IGST</span>
                <span className="font-medium">{formatCurrency(po.igst_amount)}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2 flex justify-between text-sm">
              <span className="text-gray-500">GST Total</span>
              <span className="font-semibold">{formatCurrency(po.gst_amount)}</span>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Order Total</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">{formatCurrency(po.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax</span>
              <span className="font-medium">{formatCurrency(po.gst_amount)}</span>
            </div>
            {po.freight_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Freight</span>
                <span className="font-medium">{formatCurrency(po.freight_amount)}</span>
              </div>
            )}
            {po.loading_charges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Loading Charges</span>
                <span className="font-medium">{formatCurrency(po.loading_charges)}</span>
              </div>
            )}
            {po.insurance_charges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Insurance</span>
                <span className="font-medium">{formatCurrency(po.insurance_charges)}</span>
              </div>
            )}
            {po.other_charges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Other Charges</span>
                <span className="font-medium">{formatCurrency(po.other_charges)}</span>
              </div>
            )}
            {po.round_off !== 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Round Off</span>
                <span className="font-medium">{formatCurrency(po.round_off)}</span>
              </div>
            )}
            <div className="border-t pt-3 mt-2 flex justify-between">
              <span className="font-semibold text-[#1B3A6B]">Net Amount</span>
              <span className="text-xl font-bold text-[#1B3A6B]">{formatCurrency(po.net_amount || po.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Instructions */}
      {(po.terms_and_conditions || po.delivery_instructions || po.payment_terms || po.notes) && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Terms & Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {po.payment_terms && (
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase mb-1">Payment Terms</div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{po.payment_terms}</p>
              </div>
            )}
            {po.delivery_instructions && (
              <div>
                <div className="text-xs font-medium text-gray-500 uppercase mb-1">Delivery Instructions</div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{po.delivery_instructions}</p>
              </div>
            )}
            {po.terms_and_conditions && (
              <div className="md:col-span-2">
                <div className="text-xs font-medium text-gray-500 uppercase mb-1">Terms & Conditions</div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{po.terms_and_conditions}</p>
              </div>
            )}
            {po.notes && (
              <div className="md:col-span-2">
                <div className="text-xs font-medium text-gray-500 uppercase mb-1">Notes</div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{po.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
