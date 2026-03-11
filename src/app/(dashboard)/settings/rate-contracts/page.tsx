import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn, formatDate } from '@/lib/utils'
import { FileText } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default async function RateContractsPage() {
  const supabase = await createClient()

  const { data: contracts } = await supabase
    .from('rate_contracts')
    .select('id, contract_number, vendor_id, valid_from, valid_to, status, vendor:vendors(id, legal_name)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Rate Contracts</h1>
          <p className="page-subtitle">{contracts?.length ?? 0} contracts</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        {contracts && contracts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Contract Number</th>
                  <th>Vendor</th>
                  <th>Valid From</th>
                  <th>Valid To</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((rc: any) => (
                  <tr key={rc.id}>
                    <td>
                      <span className="font-mono text-xs font-semibold">
                        {rc.contract_number}
                      </span>
                    </td>
                    <td>
                      {rc.vendor ? (
                        <Link
                          href={`/vendors/${rc.vendor.id}`}
                          className="text-sm font-medium text-[#0D7E8A] hover:underline"
                        >
                          {rc.vendor.legal_name}
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">--</span>
                      )}
                    </td>
                    <td className="text-sm text-gray-600">
                      {rc.valid_from ? formatDate(rc.valid_from) : '--'}
                    </td>
                    <td className="text-sm text-gray-600">
                      {rc.valid_to ? formatDate(rc.valid_to) : '--'}
                    </td>
                    <td>
                      <span
                        className={cn(
                          'badge',
                          STATUS_COLORS[rc.status] || 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {rc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <FileText size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No rate contracts found</p>
            <p className="text-sm text-gray-400 mt-1">
              Rate contracts will appear here once created
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
