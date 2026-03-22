import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { VENDOR_STATUS_COLORS } from '@/lib/utils'
import { Plus, Users } from 'lucide-react'
import VendorListClient from './VendorListClient'

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; category?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('vendors')
    .select('*, category:vendor_categories(name)', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (params.status) query = query.eq('status', params.status)
  if (params.q) query = query.ilike('legal_name', `%${params.q}%`)
  if (params.category) query = query.eq('category_id', params.category)

  const { data: vendors, count } = await query.limit(200)

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
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy-600 tracking-tight">Vendor Master</h1>
          <p className="text-sm text-gray-500 mt-1">{count ?? 0} vendors across all centres</p>
        </div>
        <Link href="/vendors/new" className="btn-primary">
          <Plus size={16} /> Add Vendor
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1" role="tablist">
        <Link
          href="/vendors"
          role="tab"
          aria-selected={!params.status}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200',
            !params.status
              ? 'bg-navy-600 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
          )}
        >
          All ({statusCounts.reduce((a, b) => a + b.count, 0)})
        </Link>
        {statusCounts.map(s => (
          <Link
            key={s.status}
            href={`/vendors?status=${s.status}`}
            role="tab"
            aria-selected={params.status === s.status}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2',
              params.status === s.status
                ? 'bg-navy-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            )}
          >
            <span className="capitalize">{s.status}</span>
            <span className={cn(
              'px-1.5 py-0.5 rounded text-xs font-bold min-w-[20px] text-center',
              params.status === s.status ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            )}>
              {s.count}
            </span>
          </Link>
        ))}
      </div>

      {/* Client-side DataTable */}
      <VendorListClient
        vendors={vendors ?? []}
        categories={categories ?? []}
        activeStatus={params.status}
      />
    </div>
  )
}
