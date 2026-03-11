import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatCurrency, formatDate, formatDateTime, formatLakhs, PO_STATUS_COLORS } from '@/lib/utils'
import { ArrowLeft, CheckCircle, XCircle, Send, ClipboardList, Clock } from 'lucide-react'
import POApprovalActions from './POApprovalActions'

export default async function PODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*, centre:centres(*)')
    .eq('id', user.id)
    .single()

  const { data: po, error } = await supabase
    .from('purchase_orders')
    .select('*, vendor:vendors(id, vendor_code, legal_name, category:vendor_categories(name)), centre:centres(code, name)')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!po || error) redirect('/purchase-orders')

  const [{ data: lineItems }, { data: approvals }] = await Promise.all([
    supabase
      .from('purchase_order_items')
      .select('*, item:items(item_code, generic_name, brand_name)')
      .eq('po_id', id)
      .order('created_at'),
    supabase
      .from('po_approvals')
      .select('*')
      .eq('po_id', id)
      .order('created_at'),
  ])

  const canApprove = profile && po.status === 'pending_approval'
  const canSend = profile && po.status === 'approved'
  const canCreateGRN = profile && ['sent_to_vendor', 'partially_received'].includes(po.status)

  return (
    <div>
      <Link href="/purchase-orders" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Purchase Orders
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[#1B3A6B] font-mono">{po.po_number}</h1>
              <span className={cn('badge', PO_STATUS_COLORS[po.status as keyof typeof PO_STATUS_COLORS])}>
                {po.status.replace(/_/g, ' ')}
              </span>
              {po.priority && po.priority !== 'normal' && (
                <span className={cn('badge', po.priority === 'emergency' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800')}>
                  {po.priority}
                </span>
              )}
            </div>
            <p className="text-gray-500 mt-1">
              Centre: <span className="font-medium text-gray-700">{po.centre?.code} — {po.centre?.name}</span>
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {canCreateGRN && (
              <Link href={`/grn/new?po=${po.id}`} className="btn-primary">
                <ClipboardList size={15} /> Create GRN
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Vendor Info */}
        <div className="card p-5">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-3">Vendor</h3>
          <Link href={`/vendors/${po.vendor?.id}`} className="font-semibold text-[#0D7E8A] hover:underline">
            {po.vendor?.legal_name}
          </Link>
          <p className="text-xs text-gray-400 mt-1 font-mono">{po.vendor?.vendor_code}</p>
          {po.vendor?.category && <span className="badge bg-gray-100 text-gray-600 mt-2">{po.vendor.category.name}</span>}
        </div>

        {/* Dates */}
        <div className="card p-5">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-3">Dates</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">PO Date:</span><span className="font-medium">{formatDate(po.po_date)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Expected Delivery:</span><span className="font-medium">{po.expected_delivery_date ? formatDate(po.expected_delivery_date) : '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Created:</span><span className="font-medium">{formatDateTime(po.created_at)}</span></div>
          </div>
        </div>

        {/* Totals */}
        <div className="card p-5">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-3">Amount</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span>{formatCurrency(po.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">GST:</span><span>{formatCurrency(po.gst_amount)}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="font-semibold">Total:</span><span className="font-bold text-[#1B3A6B] text-lg">{formatCurrency(po.total_amount)}</span></div>
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Line Items ({lineItems?.length ?? 0})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Unit</th>
                <th>Ordered</th>
                <th>Received</th>
                <th>Rate</th>
                <th>GST %</th>
                <th>GST Amt</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {lineItems?.map((li: any) => (
                <tr key={li.id}>
                  <td>
                    <div className="font-medium text-gray-900 text-sm">{li.item?.generic_name}</div>
                    <div className="font-mono text-xs text-gray-400">{li.item?.item_code}</div>
                  </td>
                  <td className="text-sm text-gray-600">{li.unit}</td>
                  <td className="text-sm font-medium">{li.ordered_qty}</td>
                  <td className="text-sm">
                    <span className={cn(li.received_qty >= li.ordered_qty ? 'text-green-600' : li.received_qty > 0 ? 'text-orange-600' : 'text-gray-400')}>
                      {li.received_qty}
                    </span>
                  </td>
                  <td className="text-sm text-right">{formatCurrency(li.rate)}</td>
                  <td className="text-sm text-center">{li.gst_percent}%</td>
                  <td className="text-sm text-right">{formatCurrency(li.gst_amount)}</td>
                  <td className="text-sm font-semibold text-right">{formatCurrency(li.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Actions + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approval Actions */}
        <POApprovalActions
          poId={po.id}
          poStatus={po.status}
          totalAmount={po.total_amount}
          userRole={profile?.role}
          userId={profile?.id}
        />

        {/* Approval Timeline */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">Approval History</h2>
          {approvals && approvals.length > 0 ? (
            <div className="space-y-4">
              {approvals.map((a: any) => (
                <div key={a.id} className="flex items-start gap-3">
                  {a.status === 'approved' ? (
                    <CheckCircle size={18} className="text-green-500 mt-0.5 shrink-0" />
                  ) : a.status === 'rejected' ? (
                    <XCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
                  ) : (
                    <Clock size={18} className="text-yellow-500 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Level {a.approval_level} — {a.approver_role?.replace(/_/g, ' ')}
                    </div>
                    <div className={cn('text-xs capitalize', a.status === 'approved' ? 'text-green-600' : a.status === 'rejected' ? 'text-red-600' : 'text-yellow-600')}>
                      {a.status}
                    </div>
                    {a.comments && <p className="text-xs text-gray-500 mt-1">{a.comments}</p>}
                    {a.approved_at && <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(a.approved_at)}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              {po.status === 'approved' && po.total_amount <= 10000
                ? 'Auto-approved (amount under Rs 10,000)'
                : 'No approval records'}
            </p>
          )}
        </div>
      </div>

      {po.notes && (
        <div className="card p-5 mt-6">
          <h3 className="text-xs uppercase tracking-wide text-gray-500 mb-2">Notes</h3>
          <p className="text-sm text-gray-700">{po.notes}</p>
        </div>
      )}
    </div>
  )
}
