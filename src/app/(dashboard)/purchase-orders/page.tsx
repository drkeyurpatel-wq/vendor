import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'
import POListClient from './POListClient'

const STATUSES = ['pending_approval', 'approved', 'sent_to_vendor', 'partially_received', 'fully_received', 'cancelled']

export const dynamic = 'force-dynamic'

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; centre?: string; q?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('user_profiles').select('role, centre_id')
    .eq('id', (await supabase.auth.getUser()).data.user!.id).single()

  let query = supabase
    .from('purchase_orders')
    .select('*, vendor:vendors(legal_name), centre:centres(code, name)', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (params.status) query = query.eq('status', params.status)
  if (params.centre) query = query.eq('centre_id', params.centre)

  const { data: pos, count } = await query.limit(200)
  const { data: centres } = await supabase.from('centres').select('id,code,name').eq('is_active', true)

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy-600 tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-gray-500 mt-1">{count ?? 0} total POs</p>
        </div>
        <Link href="/purchase-orders/new" className="btn-primary"><Plus size={16} /> New PO</Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 flex-wrap" role="tablist">
        <Link href="/purchase-orders" role="tab" aria-selected={!params.status}
          className={cn('px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-all',
            !params.status ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
          All
        </Link>
        {STATUSES.map(s => (
          <Link key={s} href={`/purchase-orders?status=${s}${params.centre ? `&centre=${params.centre}` : ''}`}
            role="tab" aria-selected={params.status === s}
            className={cn('px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap border capitalize transition-all',
              params.status === s ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
            {s.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      {/* Centre filter */}
      {profile?.role && ['group_admin', 'group_cao'].includes(profile.role) && (
        <div className="mb-5 flex gap-2 flex-wrap">
          <Link href={`/purchase-orders${params.status ? `?status=${params.status}` : ''}`}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              !params.centre ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-500 border-gray-200')}>
            All Centres
          </Link>
          {centres?.map(c => (
            <Link key={c.id} href={`/purchase-orders?centre=${c.id}${params.status ? `&status=${params.status}` : ''}`}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                params.centre === c.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-500 border-gray-200')}>
              {c.code}
            </Link>
          ))}
        </div>
      )}

      <POListClient pos={pos ?? []} userRole={profile?.role || 'store_staff'} />
    </div>
  )
}
