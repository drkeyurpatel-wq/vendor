import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { ArrowLeft, ClipboardList, AlertTriangle, CheckCircle, XCircle, ShoppingCart, Printer, Download } from 'lucide-react'
import IndentActions from './IndentActions'

export const dynamic = 'force-dynamic'

const INDENT_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800', rejected: 'bg-red-100 text-red-800',
  converted_to_po: 'bg-purple-100 text-purple-800', cancelled: 'bg-red-100 text-red-700',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600', normal: 'bg-gray-100 text-gray-700',
  urgent: 'bg-orange-100 text-orange-800', emergency: 'bg-red-100 text-red-800',
}

export default async function IndentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles').select('id, role, full_name')
    .eq('id', user.id).single()

  const { data: indent, error } = await supabase
    .from('purchase_indents')
    .select(`
      *,
      centre:centres(code, name),
      requested_by_user:user_profiles!purchase_indents_requested_by_fkey(full_name, role),
      approved_by_user:user_profiles!purchase_indents_approved_by_fkey(full_name),
      items:purchase_indent_items(
        *,
        item:items(item_code, generic_name, brand_name, unit, manufacturer)
      )
    `)
    .eq('id', id)
    .single()

  if (!indent || error) {
    return (
      <div>
        <Link href="/purchase-orders/indents" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={14} /> Back to Indents
        </Link>
        <div className="card p-12 text-center">
          <AlertTriangle size={40} className="mx-auto mb-3 text-yellow-400" />
          <h2 className="text-xl font-semibold text-gray-700">Indent Not Found</h2>
        </div>
      </div>
    )
  }

  const items = (indent.items || []) as any[]
  const estimatedTotal = items.reduce((s: number, i: any) => s + (i.estimated_value || 0), 0)

  return (
    <div>
      <Link href="/purchase-orders/indents" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Indents
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[#1B3A6B] font-mono">{indent.indent_number}</h1>
              <span className={cn('badge', INDENT_STATUS_COLORS[indent.status])}>{indent.status?.replace(/_/g, ' ')}</span>
              <span className={cn('badge', PRIORITY_COLORS[indent.priority])}>{indent.priority}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
              <span>Centre: <strong>{indent.centre?.code} — {indent.centre?.name}</strong></span>
              <span className="text-gray-300">|</span>
              <span>Requested by: <strong>{indent.requested_by_user?.full_name}</strong></span>
              <span className="text-gray-300">|</span>
              <span>Date: <strong>{formatDate(indent.created_at)}</strong></span>
            </div>
            {indent.approved_by_user && (
              <div className="text-sm text-gray-500 mt-1">
                Approved by: <strong>{indent.approved_by_user.full_name}</strong>
                {indent.approved_at && <span className="text-gray-400"> on {formatDate(indent.approved_at)}</span>}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 items-end">
            <div className="flex gap-2">
              <a href={`/api/pdf/indent?id=${id}`} target="_blank" className="btn-secondary text-sm"><Printer size={14} /> PDF</a>
            </div>
            {profile && (
              <IndentActions
                indentId={indent.id}
                indentNumber={indent.indent_number}
                currentStatus={indent.status}
                centreId={indent.centre_id}
                userRole={profile.role}
              />
            )}
          </div>
        </div>

        {indent.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Notes</div>
            <p className="text-sm text-gray-700">{indent.notes}</p>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Items</div>
          <div className="text-xl font-bold text-[#1B3A6B]">{items.length}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Estimated Value</div>
          <div className="text-xl font-bold text-[#0D7E8A]">{formatCurrency(estimatedTotal)}</div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Priority</div>
          <div className={cn('text-xl font-bold capitalize', indent.priority === 'emergency' ? 'text-red-600' : indent.priority === 'urgent' ? 'text-orange-600' : 'text-gray-900')}>
            {indent.priority}
          </div>
        </div>
        <div className="stat-card">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Status</div>
          <div className="text-xl font-bold text-gray-900 capitalize">{indent.status?.replace(/_/g, ' ')}</div>
        </div>
      </div>

      {/* Items table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#1B3A6B]">Requested Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item Code</th>
                <th>Description</th>
                <th>Unit</th>
                <th className="text-right">Current Stock</th>
                <th className="text-right">Requested Qty</th>
                <th className="text-right">Last Rate</th>
                <th className="text-right">Est. Value</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, idx: number) => (
                <tr key={item.id}>
                  <td className="text-xs text-gray-400">{idx + 1}</td>
                  <td>
                    <Link href={`/items/${item.item_id}`} className="font-mono text-xs font-semibold text-[#0D7E8A] hover:underline">
                      {item.item?.item_code}
                    </Link>
                  </td>
                  <td>
                    <div className="text-sm font-medium text-gray-900">{item.item?.generic_name}</div>
                    {item.item?.brand_name && <div className="text-xs text-gray-400">{item.item.brand_name}</div>}
                    {item.item?.manufacturer && <div className="text-xs text-gray-400">Mfg: {item.item.manufacturer}</div>}
                  </td>
                  <td className="text-xs text-gray-500">{item.unit || item.item?.unit}</td>
                  <td className={cn('text-sm text-right', item.current_stock <= 0 ? 'text-red-600 font-bold' : 'text-gray-700')}>
                    {item.current_stock ?? '—'}
                  </td>
                  <td className="text-sm text-right font-semibold text-[#1B3A6B]">{item.requested_qty}</td>
                  <td className="text-sm text-right font-mono text-gray-600">{item.last_purchase_rate ? formatCurrency(item.last_purchase_rate) : '—'}</td>
                  <td className="text-sm text-right font-semibold">{item.estimated_value ? formatCurrency(item.estimated_value) : '—'}</td>
                  <td className="text-xs text-gray-500 max-w-[150px] truncate">{item.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[#EEF2F9]">
                <td colSpan={5} className="font-semibold text-[#1B3A6B]">Total</td>
                <td className="text-right font-bold text-[#1B3A6B]">{items.reduce((s: number, i: any) => s + (i.requested_qty || 0), 0)}</td>
                <td></td>
                <td className="text-right font-bold text-[#1B3A6B]">{formatCurrency(estimatedTotal)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
