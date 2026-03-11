import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn, formatLakhs, formatDate, PO_STATUS_COLORS } from '@/lib/utils'
import { Plus, ShoppingCart } from 'lucide-react'
import SearchInput from '@/components/ui/SearchInput'
import Pagination from '@/components/ui/Pagination'

const PAGE_SIZE = 50

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; centre?: string; q?: string; page?: string }>
}) {
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page || '1'))
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, centre_id')
    .eq('id', (await supabase.auth.getUser()).data.user!.id)
    .single()

  let query = supabase
    .from('purchase_orders')
    .select('*, vendor:vendors(legal_name), centre:centres(code, name)', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (params.status) query = query.eq('status', params.status)
  if (params.centre) query = query.eq('centre_id', params.centre)
  if (params.q) query = query.or(`po_number.ilike.%${params.q}%,vendor.legal_name.ilike.%${params.q}%`)

  const from = (currentPage - 1) * PAGE_SIZE
  const { data: pos, count } = await query.range(from, from + PAGE_SIZE - 1)

  const { data: centres } = await supabase.from('centres').select('id,code,name').eq('is_active', true)

  const STATUSES = ['pending_approval', 'approved', 'sent_to_vendor', 'partially_received', 'fully_received', 'cancelled']

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">{count ?? 0} total POs</p>
        </div>
        <Link href="/purchase-orders/new" className="btn-primary">
          <Plus size={16} /> New PO
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchInput placeholder="Search PO number or vendor..." />
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 flex-wrap">
        <Link href="/purchase-orders"
          className={cn('px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-colors',
            !params.status ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
          All
        </Link>
        {STATUSES.map(s => (
          <Link key={s} href={`/purchase-orders?status=${s}`}
            className={cn('px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap border capitalize transition-colors',
              params.status === s ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
            {s.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      {/* Centre filter */}
      {profile?.role && ['group_admin', 'group_cao'].includes(profile.role) && (
        <div className="mb-5">
          <div className="flex gap-2 flex-wrap">
            <Link href={`/purchase-orders${params.status ? `?status=${params.status}` : ''}`}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                !params.centre ? 'bg-[#0D7E8A] text-white border-[#0D7E8A]' : 'bg-white text-gray-500 border-gray-200')}>
              All Centres
            </Link>
            {centres?.map(c => (
              <Link key={c.id} href={`/purchase-orders?centre=${c.id}${params.status ? `&status=${params.status}` : ''}`}
                className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  params.centre === c.id ? 'bg-[#0D7E8A] text-white border-[#0D7E8A]' : 'bg-white text-gray-500 border-gray-200')}>
                {c.code}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {pos && pos.length > 0 ? (
          <>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Centre</th>
                  <th>Vendor</th>
                  <th>Date</th>
                  <th>Expected Delivery</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pos.map((po: any) => (
                  <tr key={po.id}>
                    <td>
                      <span className="font-mono text-xs font-semibold">{po.po_number}</span>
                    </td>
                    <td>
                      <span className="badge bg-blue-50 text-blue-700">{po.centre?.code}</span>
                    </td>
                    <td className="text-sm font-medium text-gray-900">{po.vendor?.legal_name}</td>
                    <td className="text-sm text-gray-600">{formatDate(po.po_date)}</td>
                    <td className="text-sm text-gray-600">
                      {po.expected_delivery_date ? formatDate(po.expected_delivery_date) : '—'}
                    </td>
                    <td className="text-sm font-semibold text-gray-900">{formatLakhs(po.total_amount)}</td>
                    <td>
                      <span className={cn('badge', PO_STATUS_COLORS[po.status as keyof typeof PO_STATUS_COLORS])}>
                        {po.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <Link href={`/purchase-orders/${po.id}`} className="text-xs text-[#0D7E8A] hover:underline font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination totalCount={count ?? 0} pageSize={PAGE_SIZE} currentPage={currentPage} />
          </>
        ) : (
          <div className="empty-state">
            <ShoppingCart size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No purchase orders found</p>
            <Link href="/purchase-orders/new" className="btn-primary mt-4">
              <Plus size={15} /> Create First PO
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
