import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { cn, formatDate } from '@/lib/utils'
import { FileText, Plus, Search, Filter } from 'lucide-react'
import RateContractActions from '@/components/ui/RateContractActions'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  terminated: 'bg-red-100 text-red-600',
}

const TYPE_LABELS: Record<string, string> = {
  annual: 'Annual',
  quarterly: 'Quarterly',
  spot: 'Spot',
}

export const dynamic = 'force-dynamic'

export default async function RateContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; vendor?: string; search?: string }>
}) {
  const params = await searchParams
  const { supabase, role, isGroupLevel } = await requireAuth()

  let query = supabase
    .from('rate_contracts')
    .select(`
      id, contract_number, contract_type, valid_from, valid_to, status, created_at,
      vendor:vendors(id, legal_name, vendor_code),
      centre:centres(code, name),
      approved_by_user:user_profiles(full_name),
      items:rate_contract_items(id)
    `)
    .order('created_at', { ascending: false })

  if (params.status) query = query.eq('status', params.status)
  if (params.vendor) query = query.ilike('vendor.legal_name', `%${params.vendor}%`)

  const { data: contracts } = await query.limit(100)

  // Filter by search on contract_number after fetch (Supabase doesn't support ilike on joined + main)
  let filtered = contracts || []
  if (params.search) {
    const s = params.search.toLowerCase()
    filtered = filtered.filter(
      (rc: any) =>
        rc.contract_number?.toLowerCase().includes(s) ||
        rc.vendor?.legal_name?.toLowerCase().includes(s)
    )
  }

  // Stats
  const activeCount = (contracts || []).filter((c: any) => c.status === 'active').length
  const expiringCount = (contracts || []).filter((c: any) => {
    if (c.status !== 'active' || !c.valid_to) return false
    const daysLeft = Math.ceil((new Date(c.valid_to).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysLeft <= 30 && daysLeft > 0
  }).length
  const expiredCount = (contracts || []).filter((c: any) => c.status === 'expired').length

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Rate Contracts</h1>
          <p className="page-subtitle">{filtered.length} contracts</p>
        </div>
        <Link href="/settings/rate-contracts/new" className="btn-primary flex items-center gap-1.5">
          <Plus size={16} /> New Contract
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          <div className="text-sm text-gray-500">Active Contracts</div>
        </div>
        <div className="stat-card border-l-4 border-yellow-500">
          <div className="text-2xl font-bold text-yellow-600">{expiringCount}</div>
          <div className="text-sm text-gray-500">Expiring in 30 Days</div>
        </div>
        <div className="stat-card border-l-4 border-red-500">
          <div className="text-2xl font-bold text-red-600">{expiredCount}</div>
          <div className="text-sm text-gray-500">Expired</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <form method="GET" action="/settings/rate-contracts">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                name="search"
                type="text"
                placeholder="Search contract or vendor..."
                defaultValue={params.search || ''}
                className="form-input pl-10 w-full"
              />
            </div>
            <select name="status" defaultValue={params.status || ''} className="form-select">
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
            </select>
            <input
              name="vendor"
              type="text"
              placeholder="Vendor name..."
              defaultValue={params.vendor || ''}
              className="form-input"
            />
            <button type="submit" className="btn-primary">
              <Search size={14} className="mr-1 inline" /> Search
            </button>
          </div>
          {(params.status || params.vendor || params.search) && (
            <div className="mt-2">
              <Link href="/settings/rate-contracts" className="text-xs text-teal-500 hover:underline">
                Clear all filters
              </Link>
            </div>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <caption className="sr-only">Rate contracts list</caption>
              <thead>
                <tr>
                  <th scope="col">Contract #</th>
                  <th scope="col">Vendor</th>
                  <th scope="col">Type</th>
                  <th scope="col">Items</th>
                  <th scope="col">Valid From</th>
                  <th scope="col">Valid To</th>
                  <th scope="col">Days Left</th>
                  <th scope="col">Status</th>
                  <th scope="col">Centre</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rc: any) => {
                  const daysLeft = rc.valid_to
                    ? Math.ceil((new Date(rc.valid_to).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : null

                  return (
                    <tr key={rc.id} className="hover:bg-gray-50">
                      <td>
                        <Link
                          href={`/settings/rate-contracts/${rc.id}`}
                          className="font-mono text-xs font-semibold text-teal-500 hover:underline"
                        >
                          {rc.contract_number}
                        </Link>
                      </td>
                      <td>
                        {rc.vendor ? (
                          <div>
                            <Link
                              href={`/vendors/${rc.vendor.id}`}
                              className="text-sm font-medium text-teal-500 hover:underline"
                            >
                              {rc.vendor.legal_name}
                            </Link>
                            <div className="font-mono text-xs text-gray-500">{rc.vendor.vendor_code}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">--</span>
                        )}
                      </td>
                      <td className="text-sm text-gray-600 capitalize">
                        {TYPE_LABELS[rc.contract_type] || rc.contract_type || '--'}
                      </td>
                      <td className="text-sm font-medium text-center">
                        {rc.items?.length ?? 0}
                      </td>
                      <td className="text-sm text-gray-600">{formatDate(rc.valid_from)}</td>
                      <td className="text-sm text-gray-600">{formatDate(rc.valid_to)}</td>
                      <td className="text-sm">
                        {daysLeft !== null && rc.status === 'active' ? (
                          <span
                            className={cn(
                              'font-semibold',
                              daysLeft <= 0 ? 'text-red-600' : daysLeft <= 30 ? 'text-yellow-600' : 'text-green-600'
                            )}
                          >
                            {daysLeft <= 0 ? 'Expired' : `${daysLeft}d`}
                          </span>
                        ) : (
                          <span className="text-gray-500">--</span>
                        )}
                      </td>
                      <td>
                        <span className={cn('badge', STATUS_COLORS[rc.status] || 'bg-gray-100 text-gray-700')}>
                          {rc.status}
                        </span>
                      </td>
                      <td className="text-sm text-gray-600">
                        {rc.centre?.code || 'All'}
                      </td>
                      <td>
                        <RateContractActions
                          contractId={rc.id}
                          contractNumber={rc.contract_number}
                          status={rc.status}
                          endDate={rc.valid_to}
                          vendorName={rc.vendor?.legal_name}
                          userRole={role}
                          compact
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <FileText size={40} className="mb-3 text-gray-500" />
            <p className="font-medium text-gray-500">No rate contracts found</p>
            <p className="text-sm text-gray-500 mt-1">
              Create your first rate contract to lock in vendor pricing
            </p>
            <Link href="/settings/rate-contracts/new" className="btn-primary mt-4 inline-flex items-center gap-1.5">
              <Plus size={16} /> New Contract
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
