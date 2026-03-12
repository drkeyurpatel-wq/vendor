import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { VENDOR_STATUS_COLORS } from '@/lib/utils'
import { Plus, Search, Filter, Users } from 'lucide-react'

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; category?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('vendors')
    .select('*, category:vendor_categories(name)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (params.status) query = query.eq('status', params.status)
  if (params.q) query = query.ilike('legal_name', `%${params.q}%`)
  if (params.category) query = query.eq('category_id', params.category)

  const { data: vendors, count } = await query.limit(50)

  const { data: categories } = await supabase
    .from('vendor_categories')
    .select('id, name, code')
    .eq('is_active', true)
    .order('name')

  const statusCounts = await Promise.all(
    ['pending', 'active', 'inactive', 'blacklisted'].map(async s => {
      const { count } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true })
        .eq('status', s)
        .is('deleted_at', null)
      return { status: s, count: count ?? 0 }
    })
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Master</h1>
          <p className="page-subtitle">{count ?? 0} vendors total</p>
        </div>
        <Link href="/vendors/new" className="btn-primary">
          <Plus size={16} /> Add Vendor
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <Link
          href="/vendors"
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
            !params.status
              ? 'bg-[#1B3A6B] text-white'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          )}
        >
          All
        </Link>
        {statusCounts.map(s => (
          <Link
            key={s.status}
            href={`/vendors?status=${s.status}`}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2',
              params.status === s.status
                ? 'bg-[#1B3A6B] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            )}
          >
            <span className="capitalize">{s.status}</span>
            <span className={cn(
              'px-1.5 py-0.5 rounded text-xs font-bold',
              params.status === s.status ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            )}>
              {s.count}
            </span>
          </Link>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex gap-4 flex-wrap">
        <form className="flex-1 min-w-48 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Search vendor name..."
            className="form-input pl-10"
            aria-label="Search vendors by name"
          />
        </form>
        <select
          className="form-select w-48"
          defaultValue={params.category}
          aria-label="Filter vendors by category"
        >
          <option value="">All Categories</option>
          {categories?.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {vendors && vendors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <caption className="sr-only">List of vendors with code, name, category, GSTIN, credit period, contact, and status</caption>
              <thead>
                <tr>
                  <th scope="col">Vendor Code</th>
                  <th scope="col">Legal Name</th>
                  <th scope="col">Category</th>
                  <th scope="col">GSTIN</th>
                  <th scope="col">Credit Period</th>
                  <th scope="col">Contact</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor: any) => (
                  <tr key={vendor.id}>
                    <td>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                        {vendor.vendor_code}
                      </span>
                    </td>
                    <td>
                      <div className="font-medium text-gray-900">{vendor.legal_name}</div>
                      {vendor.trade_name && (
                        <div className="text-xs text-gray-400">{vendor.trade_name}</div>
                      )}
                    </td>
                    <td className="text-sm text-gray-600">{vendor.category?.name ?? '—'}</td>
                    <td>
                      {vendor.gstin ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs">{vendor.gstin}</span>
                          {vendor.gstin_verified && (
                            <span className="w-3 h-3 bg-green-500 rounded-full inline-block" title="Verified" />
                          )}
                        </div>
                      ) : <span className="text-gray-400 text-xs">Not provided</span>}
                    </td>
                    <td className="text-sm text-gray-600">{vendor.credit_period_days} days</td>
                    <td>
                      <div className="text-sm text-gray-700">{vendor.primary_contact_name ?? '—'}</div>
                      <div className="text-xs text-gray-400">{vendor.primary_contact_phone ?? ''}</div>
                    </td>
                    <td>
                      <span className={cn('badge', VENDOR_STATUS_COLORS[vendor.status as keyof typeof VENDOR_STATUS_COLORS])}>
                        {vendor.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/vendors/${vendor.id}`}
                        className="text-xs text-[#0D7E8A] hover:underline font-medium"
                        aria-label={`View vendor ${vendor.legal_name}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <Users size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No vendors found</p>
            <p className="text-sm text-gray-400 mt-1">
              {params.status || params.q ? 'Try adjusting your filters' : 'Start by adding your first vendor'}
            </p>
            {!params.status && !params.q && (
              <Link href="/vendors/new" className="btn-primary mt-4">
                <Plus size={15} /> Add First Vendor
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
