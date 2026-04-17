import { requireAuth } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Package, AlertTriangle, CheckCircle2, Truck, User } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DepositDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase } = await requireAuth()

  const { data: deposit } = await supabase
    .from('consignment_deposits')
    .select('*, vendor:vendors(legal_name, vendor_code, primary_contact_name, primary_contact_phone), centre:centres(code, name), received_by_user:user_profiles!consignment_deposits_received_by_fkey(full_name)')
    .eq('id', id)
    .single()

  if (!deposit) notFound()

  const [{ data: stock }, { data: usage }] = await Promise.all([
    supabase.from('consignment_stock')
      .select('*, item:items(item_code, generic_name, unit)')
      .eq('deposit_id', id)
      .order('created_at'),
    supabase.from('consignment_usage')
      .select('*, stock:consignment_stock(item_description, size_spec, item:items(generic_name, item_code)), centre:centres(code)')
      .eq('deposit_id', id)
      .order('created_at', { ascending: false }),
  ])

  const items = stock || []
  const totalDeposited = items.reduce((s, i) => s + (i.qty_deposited || 0), 0)
  const totalUsed = items.reduce((s, i) => s + (i.qty_used || 0), 0)
  const totalReturned = items.reduce((s, i) => s + (i.qty_returned || 0), 0)
  const totalAvailable = items.reduce((s, i) => s + ((i.qty_deposited || 0) - (i.qty_used || 0) - (i.qty_returned || 0)), 0)
  const totalValue = items.reduce((s, i) => s + ((i.qty_deposited - i.qty_used - i.qty_returned) * (i.vendor_rate || 0)), 0)

  const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-700', partially_used: 'bg-blue-100 text-blue-700',
    fully_used: 'bg-gray-100 text-gray-600', returned: 'bg-orange-100 text-orange-700',
  }

  return (
    <div>
      <Link href="/consignment/deposits" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={14} /> Back to Deposits</Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-navy-600">{deposit.deposit_number}</h1>
              <span className={cn('badge', STATUS_COLORS[deposit.status] || 'bg-gray-100 text-gray-600')}>{deposit.status?.replace(/_/g, ' ')}</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-sm">
              <div><span className="text-gray-500">Vendor:</span> <span className="font-medium text-gray-900">{deposit.vendor?.legal_name}</span></div>
              <div><span className="text-gray-500">Code:</span> <span className="font-mono text-xs">{deposit.vendor?.vendor_code}</span></div>
              <div><span className="text-gray-500">Centre:</span> <span className="font-medium">{deposit.centre?.code} — {deposit.centre?.name}</span></div>
              <div><span className="text-gray-500">Challan:</span> <span className="font-mono">{deposit.challan_number || '—'}</span></div>
              <div><span className="text-gray-500">Challan Date:</span> <span>{formatDate(deposit.challan_date)}</span></div>
              <div><span className="text-gray-500">Received:</span> <span>{formatDate(deposit.received_at || deposit.created_at)}</span></div>
              {deposit.vendor?.primary_contact_name && (
                <div><span className="text-gray-500">Contact:</span> <span>{deposit.vendor.primary_contact_name} {deposit.vendor.primary_contact_phone || ''}</span></div>
              )}
              {deposit.notes && (
                <div className="col-span-2"><span className="text-gray-500">Notes:</span> <span>{deposit.notes}</span></div>
              )}
            </div>
          </div>
          <Link href="/consignment/usage/new" className="btn-primary text-sm"><Package size={14} /> Record Usage</Link>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5 pt-5 border-t border-gray-100">
          <div className="text-center">
            <div className="text-xs text-gray-500">Deposited</div>
            <div className="text-xl font-bold text-navy-600">{totalDeposited}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Used</div>
            <div className="text-xl font-bold text-orange-600">{totalUsed}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Returned</div>
            <div className="text-xl font-bold text-gray-600">{totalReturned}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Available</div>
            <div className="text-xl font-bold text-green-600">{totalAvailable}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Value (Available)</div>
            <div className="text-xl font-bold text-purple-600">{formatCurrency(totalValue)}</div>
          </div>
        </div>
      </div>

      {/* Stock Items */}
      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-navy-600">Items in Deposit ({items.length})</h2>
        </div>
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr>
                <th>#</th><th>Item</th><th>Lot / Batch</th><th>Serial No.</th>
                <th>Expiry</th><th className="text-center">Qty</th><th className="text-center">Used</th>
                <th className="text-center">Available</th><th className="text-right">Rate</th><th>Status</th>
              </tr></thead>
              <tbody>
                {items.map((s: any, idx: number) => {
                  const avail = s.qty_deposited - s.qty_used - s.qty_returned
                  const isExpiring = s.expiry_date && new Date(s.expiry_date) < new Date(Date.now() + 90 * 86400000)
                  return (
                    <tr key={s.id} className={cn('hover:bg-gray-50', avail <= 0 && 'opacity-50')}>
                      <td className="text-xs text-gray-500">{idx + 1}</td>
                      <td>
                        <div className="text-sm font-medium text-gray-900">{s.item?.generic_name || s.item_description || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{s.item?.item_code || ''} {s.brand ? `| ${s.brand}` : ''}{s.size_spec ? ` | ${s.size_spec}` : ''}</div>
                      </td>
                      <td className="text-xs font-mono text-gray-600">{s.lot_number || s.batch_number || '—'}</td>
                      <td className="text-xs font-mono text-gray-600">{s.serial_number || '—'}</td>
                      <td className={cn('text-xs', isExpiring ? 'text-red-600 font-semibold' : 'text-gray-500')}>
                        {s.expiry_date ? formatDate(s.expiry_date) : '—'}
                        {isExpiring && <AlertTriangle size={10} className="inline ml-1" />}
                      </td>
                      <td className="text-sm text-center">{s.qty_deposited}</td>
                      <td className="text-sm text-center text-orange-600">{s.qty_used}</td>
                      <td className="text-sm text-center font-bold text-navy-600">{avail}</td>
                      <td className="text-sm text-right font-mono">{formatCurrency(s.vendor_rate)}</td>
                      <td><span className={cn('badge text-xs',
                        avail > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      )}>{avail > 0 ? 'Available' : 'Used'}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-gray-500">No items in this deposit</div>
        )}
      </div>

      {/* Usage History */}
      {usage && usage.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-navy-600">Usage History ({usage.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr>
                <th>Usage #</th><th>Patient</th><th>Item</th><th>Surgeon</th>
                <th>Centre</th><th>Date</th><th>Qty</th><th>Status</th><th>Documents</th>
              </tr></thead>
              <tbody>
                {usage.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="font-mono text-xs font-semibold text-navy-600">{u.usage_number || u.id.substring(0, 8)}</td>
                    <td>
                      <div className="text-sm font-medium">{u.patient_name}</div>
                      {u.patient_uhid && <div className="text-xs text-gray-500">{u.patient_uhid}</div>}
                    </td>
                    <td className="text-sm">{u.stock?.item?.generic_name || u.stock?.item_description || '—'}{u.stock?.size_spec ? ` (${u.stock.size_spec})` : ''}</td>
                    <td className="text-sm text-gray-600">{u.surgeon_name || '—'}</td>
                    <td><span className="badge bg-blue-50 text-blue-700 text-xs">{u.centre?.code}</span></td>
                    <td className="text-sm">{formatDate(u.usage_date || u.created_at)}</td>
                    <td className="text-sm text-center">{u.qty_used}</td>
                    <td><span className={cn('badge text-xs',
                      u.conversion_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'
                    )}>{u.conversion_status === 'completed' ? 'Converted' : 'Pending'}</span></td>
                    <td className="text-xs space-x-2">
                      {u.po_id && <Link href={`/purchase-orders/${u.po_id}`} className="text-teal-600 hover:underline">PO</Link>}
                      {u.grn_id && <Link href={`/grn/${u.grn_id}`} className="text-teal-600 hover:underline">GRN</Link>}
                      {u.invoice_id && <Link href={`/finance/invoices/${u.invoice_id}`} className="text-teal-600 hover:underline">Invoice</Link>}
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
