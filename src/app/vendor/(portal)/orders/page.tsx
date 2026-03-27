import { requireVendorAuth } from '@/lib/vendor-auth'
import Link from 'next/link'
import { cn, formatDate, formatCurrency, PO_STATUS_COLORS } from '@/lib/utils'
import { ShoppingCart, Search } from 'lucide-react'

const PO_STATUSES = [
  { value: '', label: 'All' },
  { value: 'sent_to_vendor', label: 'Needs Acknowledgement' },
  { value: 'approved', label: 'Approved' },
  { value: 'partially_received', label: 'Partially Received' },
  { value: 'fully_received', label: 'Fully Received' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'closed', label: 'Closed' },
]

const PAGE_SIZE = 50

export const dynamic = 'force-dynamic'

export default async function VendorOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>
}) {
  const params = await searchParams
  const { supabase, vendorId } = await requireVendorAuth()

  const currentPage = parseInt(params.page || '1', 10)
  const statusFilter = params.status || ''
  const searchQuery = params.search || ''

  // Count
  let countQuery = supabase
    .from('purchase_orders')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)

  if (statusFilter) countQuery = countQuery.eq('status', statusFilter)
  if (searchQuery) countQuery = countQuery.ilike('po_number', `%${searchQuery}%`)

  const { count: totalCount } = await countQuery

  // Data
  let dataQuery = supabase
    .from('purchase_orders')
    .select('id, po_number, po_date, status, total_amount, expected_delivery_date, vendor_acknowledged, centre:centres(code), items:purchase_order_items(id)')
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)

  if (statusFilter) dataQuery = dataQuery.eq('status', statusFilter)
  if (searchQuery) dataQuery = dataQuery.ilike('po_number', `%${searchQuery}%`)

  const { data: pos } = await dataQuery
    .order('created_at', { ascending: false })
    .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1)

  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE)

  function buildUrl(overrides: Record<string, string>) {
    const sp = new URLSearchParams()
    const merged = { status: statusFilter, search: searchQuery, ...overrides }
    Object.entries(merged).forEach(([k, v]) => { if (v) sp.set(k, v) })
    return `/vendor/orders?${sp.toString()}`
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        <p className="text-sm text-gray-500 mt-0.5">View and manage your purchase orders</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <form method="GET" action="/vendor/orders" className="flex items-center gap-2 flex-1">
            {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Search by PO number..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7E8A] focus:border-transparent"
              />
            </div>
            <button type="submit" className="px-4 py-2.5 bg-[#0D7E8A] text-white text-sm font-medium rounded-xl hover:bg-[#0a6972] transition-colors cursor-pointer">Search</button>
          </form>

          <div className="flex flex-wrap gap-1.5">
            {PO_STATUSES.map((s) => (
              <Link
                key={s.value}
                href={buildUrl({ status: s.value, page: '' })}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                  statusFilter === s.value
                    ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#0D7E8A] hover:text-[#0D7E8A]'
                )}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {pos && pos.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">PO Number</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Centre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Delivery</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pos.map((po: any) => (
                    <tr key={po.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/vendor/orders/${po.id}`} className="font-mono text-xs font-semibold text-[#0D7E8A] hover:underline">
                          {po.po_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">{po.centre?.code}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-600">{formatDate(po.po_date)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{po.items?.length ?? 0}</td>
                      <td className="px-4 py-3 text-xs font-semibold">{formatCurrency(po.total_amount)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{po.expected_delivery_date ? formatDate(po.expected_delivery_date) : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', PO_STATUS_COLORS[po.status as keyof typeof PO_STATUS_COLORS])}>
                          {po.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {po.status === 'sent_to_vendor' && !po.vendor_acknowledged ? (
                          <Link href={`/vendor/orders/${po.id}`} className="text-xs font-medium text-white bg-[#0D7E8A] hover:bg-[#0a6972] px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                            Acknowledge
                          </Link>
                        ) : (
                          <Link href={`/vendor/orders/${po.id}`} className="text-xs text-gray-500 hover:text-[#0D7E8A] hover:underline">View</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount ?? 0)} of {totalCount}
                </span>
                <div className="flex gap-2">
                  {currentPage > 1 && (
                    <Link href={buildUrl({ page: String(currentPage - 1) })} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50">Previous</Link>
                  )}
                  {currentPage < totalPages && (
                    <Link href={buildUrl({ page: String(currentPage + 1) })} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50">Next</Link>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <ShoppingCart size={40} className="mx-auto mb-3 text-gray-400" />
            <p className="font-medium text-gray-500">No purchase orders found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchQuery || statusFilter ? 'Try adjusting your filters' : 'Purchase orders will appear here once created'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
