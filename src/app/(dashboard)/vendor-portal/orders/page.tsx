import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatDate, formatCurrency, PO_STATUS_COLORS } from '@/lib/utils'
import { Package, AlertTriangle, Search, ShoppingCart } from 'lucide-react'
import Pagination from '@/components/ui/Pagination'

const PO_STATUSES = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent_to_vendor', label: 'Sent to Vendor' },
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

  const currentPage = parseInt(params.page || '1', 10)
  const statusFilter = params.status || ''
  const searchQuery = params.search || ''

  // Build query for count
  let countQuery = supabase
    .from('purchase_orders')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendor.id)
    .is('deleted_at', null)

  if (statusFilter) {
    countQuery = countQuery.eq('status', statusFilter)
  }
  if (searchQuery) {
    countQuery = countQuery.ilike('po_number', `%${searchQuery}%`)
  }

  const { count: totalCount } = await countQuery

  // Build query for data
  let dataQuery = supabase
    .from('purchase_orders')
    .select('id, po_number, po_date, status, total_amount, centre:centres(code), items:purchase_order_items(id)')
    .eq('vendor_id', vendor.id)
    .is('deleted_at', null)

  if (statusFilter) {
    dataQuery = dataQuery.eq('status', statusFilter)
  }
  if (searchQuery) {
    dataQuery = dataQuery.ilike('po_number', `%${searchQuery}%`)
  }

  const { data: pos } = await dataQuery
    .order('created_at', { ascending: false })
    .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1)

  function buildFilterUrl(params: Record<string, string>) {
    const sp = new URLSearchParams()
    const merged = { status: statusFilter, search: searchQuery, ...params }
    Object.entries(merged).forEach(([k, v]) => {
      if (v) sp.set(k, v)
    })
    return `/vendor-portal/orders?${sp.toString()}`
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">{vendor.legal_name} ({vendor.vendor_code})</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Search */}
          <form method="GET" action="/vendor-portal/orders" className="flex items-center gap-2 flex-1">
            {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
            <div className="relative flex-1 max-w-sm">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Search by PO number..."
                className="form-input pl-10 w-full"
              />
            </div>
            <button type="submit" className="btn-primary text-sm">Search</button>
          </form>

          {/* Status pills */}
          <div className="flex flex-wrap gap-1.5">
            {PO_STATUSES.map((s) => (
              <Link
                key={s.value}
                href={buildFilterUrl({ status: s.value, page: '' })}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors border',
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
      <div className="card overflow-hidden">
        {pos && pos.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PO Number</th>
                    <th>Centre</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pos.map((po: any) => (
                    <tr key={po.id} className="hover:bg-gray-50">
                      <td>
                        <Link href={`/vendor-portal/orders/${po.id}`} className="font-mono text-xs font-semibold text-[#0D7E8A] hover:underline">
                          {po.po_number}
                        </Link>
                      </td>
                      <td><span className="badge bg-blue-50 text-blue-700">{po.centre?.code}</span></td>
                      <td className="text-sm text-gray-600">{formatDate(po.po_date)}</td>
                      <td className="text-sm text-gray-600">{po.items?.length ?? 0}</td>
                      <td className="text-sm font-semibold">{formatCurrency(po.total_amount)}</td>
                      <td>
                        <span className={cn('badge', PO_STATUS_COLORS[po.status as keyof typeof PO_STATUS_COLORS])}>
                          {po.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        {po.status === 'sent_to_vendor' ? (
                          <Link href={`/vendor-portal/orders/${po.id}`} className="text-xs font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 px-2 py-1 rounded-lg transition-colors">
                            Acknowledge →
                          </Link>
                        ) : (
                          <Link href={`/vendor-portal/orders/${po.id}`} className="text-xs text-gray-500 hover:underline">View</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination totalCount={totalCount ?? 0} pageSize={PAGE_SIZE} currentPage={currentPage} />
          </>
        ) : (
          <div className="empty-state">
            <ShoppingCart size={40} className="mx-auto mb-3 text-gray-300" />
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
