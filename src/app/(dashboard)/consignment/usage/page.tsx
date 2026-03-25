import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { Package, Plus, CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', po_created: 'bg-blue-100 text-blue-700',
  grn_created: 'bg-indigo-100 text-indigo-700', invoice_created: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700',
}

export default async function UsageListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usage } = await supabase.from('consignment_usage')
    .select('*, stock:consignment_stock(item_description, category, serial_number, vendor_rate, brand), centre:centres(code)')
    .order('procedure_date', { ascending: false }).limit(200)

  return (
    <div>
      <Link href="/consignment" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"><Package size={14} /> Back</Link>
      <div className="page-header">
        <div>
          <h1 className="page-title">Consignment Usage Log</h1>
          <p className="page-subtitle">{usage?.length ?? 0} items used from consignment stock</p>
        </div>
        <Link href="/consignment/usage/new" className="btn-primary text-sm"><Plus size={14} /> Log Usage</Link>
      </div>

      <div className="card overflow-hidden">
        {(usage?.length ?? 0) > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr>
                <th>#</th><th>Date</th><th>Item</th><th>Patient</th><th>Surgeon</th>
                <th>Location</th><th>Centre</th><th className="text-right">Rate</th><th>PO/GRN Status</th>
              </tr></thead>
              <tbody>
                {usage!.map((u: any, idx: number) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="text-xs text-gray-400">{idx + 1}</td>
                    <td className="text-sm text-gray-600">{formatDate(u.procedure_date)}</td>
                    <td>
                      <div className="text-sm font-medium text-gray-900">{u.stock?.item_description || '—'}</div>
                      <div className="text-xs text-gray-400">{u.stock?.brand} • {u.stock?.serial_number || '—'}</div>
                    </td>
                    <td>
                      <div className="text-sm font-medium">{u.patient_name}</div>
                      {u.patient_uhid && <div className="text-xs text-gray-400">{u.patient_uhid}</div>}
                    </td>
                    <td className="text-sm text-gray-700">Dr. {u.surgeon_name}</td>
                    <td><span className="badge bg-gray-100 text-gray-700 text-xs">{u.procedure_location}</span></td>
                    <td><span className="badge bg-blue-50 text-blue-700 text-[10px]">{u.centre?.code}</span></td>
                    <td className="text-sm text-right font-mono">{formatCurrency(u.stock?.vendor_rate)}</td>
                    <td>
                      <span className={cn('badge', STATUS_COLORS[u.conversion_status] || 'bg-gray-100 text-gray-600')}>
                        {u.conversion_status?.replace(/_/g, ' ')}
                      </span>
                      {u.auto_po_id && <Link href={`/purchase-orders/${u.auto_po_id}`} className="text-[10px] text-teal-600 hover:underline block mt-0.5">View PO →</Link>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state py-12">
            <Package size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No usage logged yet</p>
            <p className="text-sm text-gray-400 mt-1"><Link href="/consignment/usage/new" className="text-teal-600 hover:underline">Log first usage</Link></p>
          </div>
        )}
      </div>
    </div>
  )
}
