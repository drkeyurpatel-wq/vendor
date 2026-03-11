import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn, formatDate, formatLakhs } from '@/lib/utils'
import { Plus, ClipboardList } from 'lucide-react'

const GRN_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-800',
  verified: 'bg-green-100 text-green-800',
  discrepancy: 'bg-red-100 text-red-800',
}

export default async function GRNListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; centre?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, centre_id')
    .eq('id', (await supabase.auth.getUser()).data.user!.id)
    .single()

  let query = supabase
    .from('grns')
    .select('*, vendor:vendors(legal_name), centre:centres(code, name), po:purchase_orders(po_number)', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (params.status) query = query.eq('status', params.status)
  if (params.centre) query = query.eq('centre_id', params.centre)

  const { data: grns, count } = await query.limit(50)
  const { data: centres } = await supabase.from('centres').select('id,code,name').eq('is_active', true)

  const STATUSES = ['draft', 'submitted', 'verified', 'discrepancy']

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Goods Receipt Notes</h1>
          <p className="page-subtitle">{count ?? 0} total GRNs</p>
        </div>
        <Link href="/grn/new" className="btn-primary">
          <Plus size={16} /> New GRN
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 flex-wrap">
        <Link href="/grn"
          className={cn('px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-colors',
            !params.status ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
          All
        </Link>
        {STATUSES.map(s => (
          <Link key={s} href={`/grn?status=${s}`}
            className={cn('px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap border capitalize transition-colors',
              params.status === s ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
            {s}
          </Link>
        ))}
      </div>

      {/* Centre filter */}
      {profile?.role && ['group_admin', 'group_cao'].includes(profile.role) && (
        <div className="mb-5 flex gap-2 flex-wrap">
          <Link href={`/grn${params.status ? `?status=${params.status}` : ''}`}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              !params.centre ? 'bg-[#0D7E8A] text-white border-[#0D7E8A]' : 'bg-white text-gray-500 border-gray-200')}>
            All Centres
          </Link>
          {centres?.map(c => (
            <Link key={c.id} href={`/grn?centre=${c.id}${params.status ? `&status=${params.status}` : ''}`}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                params.centre === c.id ? 'bg-[#0D7E8A] text-white border-[#0D7E8A]' : 'bg-white text-gray-500 border-gray-200')}>
              {c.code}
            </Link>
          ))}
        </div>
      )}

      <div className="card overflow-hidden">
        {grns && grns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>GRN Number</th>
                  <th>PO Number</th>
                  <th>Centre</th>
                  <th>Vendor</th>
                  <th>GRN Date</th>
                  <th>Invoice No.</th>
                  <th>Invoice Amt</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {grns.map((grn: any) => (
                  <tr key={grn.id}>
                    <td><span className="font-mono text-xs font-semibold">{grn.grn_number}</span></td>
                    <td>
                      <Link href={`/purchase-orders/${grn.po_id}`} className="font-mono text-xs text-[#0D7E8A] hover:underline">
                        {grn.po?.po_number}
                      </Link>
                    </td>
                    <td><span className="badge bg-blue-50 text-blue-700">{grn.centre?.code}</span></td>
                    <td className="text-sm font-medium text-gray-900">{grn.vendor?.legal_name}</td>
                    <td className="text-sm text-gray-600">{formatDate(grn.grn_date)}</td>
                    <td className="font-mono text-xs text-gray-600">{grn.vendor_invoice_no || '—'}</td>
                    <td className="text-sm font-semibold">{grn.vendor_invoice_amount ? formatLakhs(grn.vendor_invoice_amount) : '—'}</td>
                    <td><span className={cn('badge', GRN_STATUS_COLORS[grn.status] || 'bg-gray-100 text-gray-700')}>{grn.status}</span></td>
                    <td><Link href={`/grn/${grn.id}`} className="text-xs text-[#0D7E8A] hover:underline font-medium">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <ClipboardList size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No GRNs found</p>
            <Link href="/grn/new" className="btn-primary mt-4">
              <Plus size={15} /> Create First GRN
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
