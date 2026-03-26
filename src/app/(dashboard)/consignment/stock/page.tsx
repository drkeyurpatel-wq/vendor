import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Package, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ConsignmentStockPage() {
  const { supabase, user, role, centreId, isGroupLevel } = await requireAuth()
  const { data: stock } = await supabase
    .from('consignment_stock')
    .select('*, item:items(item_code, generic_name, unit, manufacturer), deposit:consignment_deposits(deposit_number, challan_number, challan_date, vendor:vendors(legal_name, vendor_code), centre:centres(code, name))')
    .order('created_at', { ascending: false })

  const items = stock || []
  const available = items.filter(s => (s.qty_deposited - s.qty_used - s.qty_returned) > 0)
  const used = items.filter(s => s.status === 'used')
  const totalValue = available.reduce((s, i) => s + ((i.qty_deposited - i.qty_used - i.qty_returned) * (i.vendor_rate || 0)), 0)

  return (
    <div>
      <Link href="/consignment" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={14} /> Back</Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">Consignment Stock Register</h1>
          <p className="page-subtitle">{available.length} items available (vendor-owned) — {formatCurrency(totalValue)} total value</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr>
                <th>#</th><th>Item</th><th>Vendor</th><th>Centre</th><th>Batch</th><th>Serial No.</th><th>Expiry</th><th>Deposited</th><th>Used</th><th>Available</th><th className="text-right">Rate</th><th className="text-right">Value</th><th>Status</th>
              </tr></thead>
              <tbody>
                {items.map((s: any, idx: number) => {
                  const avail = s.qty_deposited - s.qty_used - s.qty_returned
                  const isExpiring = s.expiry_date && new Date(s.expiry_date) < new Date(Date.now() + 90 * 86400000)
                  return (
                    <tr key={s.id} className={cn('hover:bg-gray-50', avail <= 0 && 'opacity-50')}>
                      <td className="text-xs text-gray-500">{idx + 1}</td>
                      <td>
                        <Link href={`/items/${s.item_id}`} className="text-sm font-medium text-gray-900 hover:text-teal-600">{s.item?.generic_name}</Link>
                        <div className="text-xs text-gray-500 font-mono">{s.item?.item_code} | {s.item?.manufacturer || ''}</div>
                      </td>
                      <td className="text-sm text-gray-600">{s.deposit?.vendor?.legal_name}</td>
                      <td><span className="badge bg-blue-50 text-blue-700 text-xs">{s.deposit?.centre?.code}</span></td>
                      <td className="text-xs font-mono text-gray-600">{s.batch_number || '—'}</td>
                      <td className="text-xs font-mono text-gray-600">{s.serial_number || '—'}</td>
                      <td className={cn('text-xs', isExpiring ? 'text-red-600 font-semibold' : 'text-gray-500')}>
                        {s.expiry_date ? formatDate(s.expiry_date) : '—'}
                        {isExpiring && <AlertTriangle size={10} className="inline ml-1" />}
                      </td>
                      <td className="text-sm text-center">{s.qty_deposited}</td>
                      <td className="text-sm text-center text-orange-600">{s.qty_used}</td>
                      <td className="text-sm text-center font-bold text-navy-600">{avail}</td>
                      <td className="text-sm text-right font-mono">{formatCurrency(s.vendor_rate)}</td>
                      <td className="text-sm text-right font-semibold">{formatCurrency(avail * (s.vendor_rate || 0))}</td>
                      <td><span className={cn('badge text-xs',
                        avail > 0 ? 'bg-green-100 text-green-700' : s.status === 'returned' ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-700'
                      )}>{avail > 0 ? 'Available' : s.status === 'returned' ? 'Returned' : 'Used'}</span></td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-navy-50">
                  <td colSpan={9} className="font-semibold text-navy-600">Total Available</td>
                  <td className="text-center font-bold text-navy-600">{available.reduce((s, i) => s + (i.qty_deposited - i.qty_used - i.qty_returned), 0)}</td>
                  <td></td>
                  <td className="text-right font-bold text-navy-600">{formatCurrency(totalValue)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="empty-state py-12">
            <Package size={40} className="mb-3 text-gray-500" />
            <p className="font-medium text-gray-500">No consignment stock</p>
            <p className="text-sm text-gray-500 mt-1">Create a deposit to receive vendor consignment items</p>
          </div>
        )}
      </div>
    </div>
  )
}
