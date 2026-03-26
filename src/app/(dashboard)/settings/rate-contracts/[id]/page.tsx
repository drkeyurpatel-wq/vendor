import { requireAuth } from '@/lib/auth'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, FileText, AlertTriangle, CheckCircle } from 'lucide-react'
import RateContractActions from '@/components/ui/RateContractActions'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  terminated: 'bg-red-100 text-red-600',
}

const RANK_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-800',
  2: 'bg-blue-100 text-blue-800',
  3: 'bg-yellow-100 text-yellow-800',
}

export default async function RateContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { supabase, role } = await requireAuth()

  const { data: contract, error } = await supabase
    .from('rate_contracts')
    .select(`
      *,
      vendor:vendors(id, legal_name, vendor_code, gstin, city, state),
      centre:centres(code, name),
      approved_by_user:user_profiles(full_name),
      items:rate_contract_items(
        *,
        item:items(item_code, generic_name, brand_name, unit, hsn_code)
      )
    `)
    .eq('id', id)
    .single()

  if (!contract || error) {
    return (
      <div>
        <Link href="/settings/rate-contracts" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="card p-8 text-center">
          <AlertTriangle size={40} className="mx-auto mb-3 text-yellow-400" />
          <h2 className="text-xl font-semibold text-gray-700">Contract Not Found</h2>
        </div>
      </div>
    )
  }

  const daysLeft = contract.valid_to
    ? Math.ceil((new Date(contract.valid_to).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  const isExpired = daysLeft !== null && daysLeft <= 0
  const isExpiring = daysLeft !== null && daysLeft > 0 && daysLeft <= 30
  const items = (contract.items || []) as any[]

  // Group items by L-rank for summary
  const l1Count = items.filter(i => i.l_rank === 1).length
  const l2Count = items.filter(i => i.l_rank === 2).length
  const l3Count = items.filter(i => i.l_rank === 3).length

  return (
    <div>
      <Link href="/settings/rate-contracts" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Rate Contracts
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-navy-600 font-mono">{contract.contract_number}</h1>
              <span className={cn('badge', STATUS_COLORS[contract.status])}>{contract.status}</span>
              {isExpired && <span className="badge bg-red-100 text-red-700">Expired</span>}
              {isExpiring && <span className="badge bg-yellow-100 text-yellow-700">{daysLeft}d left</span>}
            </div>
            <p className="text-sm text-gray-500">
              <Link href={`/vendors/${contract.vendor?.id}`} className="text-teal-500 hover:underline">
                {contract.vendor?.legal_name}
              </Link>
              {' '}
              <span className="font-mono text-xs text-gray-500">({contract.vendor?.vendor_code})</span>
              {contract.centre && (
                <span className="ml-2">| {contract.centre.code} — {contract.centre.name}</span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            {contract.status === 'active' && (
              <span className="badge bg-green-50 text-green-700 border border-green-200 px-3 py-1">
                <CheckCircle size={14} className="inline mr-1" /> Active Contract
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card p-5 mb-6">
        <h3 className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-3">Actions</h3>
        <RateContractActions
          contractId={contract.id} contractNumber={contract.contract_number}
          status={contract.status} endDate={contract.valid_to}
          vendorName={contract.vendor?.legal_name}
          userRole={role}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-1">Contract Type</div>
          <div className="text-sm font-semibold capitalize">{contract.contract_type}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-1">Validity</div>
          <div className="text-sm font-semibold">{formatDate(contract.valid_from)} — {formatDate(contract.valid_to)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-1">Total Items</div>
          <div className="text-sm font-semibold">{items.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-1">L-Rank Distribution</div>
          <div className="flex gap-2">
            {l1Count > 0 && <span className="badge bg-green-100 text-green-800 text-xs">L1: {l1Count}</span>}
            {l2Count > 0 && <span className="badge bg-blue-100 text-blue-800 text-xs">L2: {l2Count}</span>}
            {l3Count > 0 && <span className="badge bg-yellow-100 text-yellow-800 text-xs">L3: {l3Count}</span>}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-gray-500 mb-1">Approved By</div>
          <div className="text-sm font-semibold">{contract.approved_by_user?.full_name || '—'}</div>
        </div>
      </div>

      {/* Vendor Details */}
      <div className="card p-6 mb-6">
        <h2 className="text-sm font-semibold text-navy-600 mb-3 uppercase tracking-wide">Vendor Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500 block">Name</span>
            <span className="font-medium">{contract.vendor?.legal_name}</span>
          </div>
          <div>
            <span className="text-gray-500 block">GSTIN</span>
            <span className="font-mono text-xs">{contract.vendor?.gstin || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Location</span>
            <span>{[contract.vendor?.city, contract.vendor?.state].filter(Boolean).join(', ') || '—'}</span>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-navy-600 flex items-center gap-2">
            <FileText size={16} /> Contract Items ({items.length})
          </h2>
        </div>
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <caption className="sr-only">Rate contract items</caption>
              <thead>
                <tr>
                  <th scope="col">S.No</th>
                  <th scope="col">Item Code</th>
                  <th scope="col">Item Name</th>
                  <th scope="col">HSN</th>
                  <th scope="col">Unit</th>
                  <th scope="col" className="text-right">Contract Rate</th>
                  <th scope="col" className="text-right">GST %</th>
                  <th scope="col" className="text-right">Rate incl. GST</th>
                  <th scope="col" className="text-center">L-Rank</th>
                </tr>
              </thead>
              <tbody>
                {items.map((ci: any, idx: number) => {
                  const rateInclGST = ci.rate * (1 + (ci.gst_percent || 0) / 100)
                  return (
                    <tr key={ci.id}>
                      <td className="text-center text-sm text-gray-500">{idx + 1}</td>
                      <td className="font-mono text-xs text-gray-500">{ci.item?.item_code || '—'}</td>
                      <td>
                        <div className="text-sm font-medium">{ci.item?.generic_name}</div>
                        {ci.item?.brand_name && (
                          <div className="text-xs text-gray-500">{ci.item.brand_name}</div>
                        )}
                      </td>
                      <td className="font-mono text-xs text-gray-500">{ci.item?.hsn_code || '—'}</td>
                      <td className="text-sm text-gray-600">{ci.unit}</td>
                      <td className="text-right font-mono text-sm font-semibold">{formatCurrency(ci.rate)}</td>
                      <td className="text-right text-sm text-gray-600">{ci.gst_percent}%</td>
                      <td className="text-right font-mono text-sm">{formatCurrency(rateInclGST)}</td>
                      <td className="text-center">
                        <span className={cn('badge text-xs', RANK_COLORS[ci.l_rank] || 'bg-gray-100 text-gray-700')}>
                          L{ci.l_rank}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state py-8">
            <p className="text-gray-500">No items in this contract</p>
          </div>
        )}
      </div>
    </div>
  )
}
