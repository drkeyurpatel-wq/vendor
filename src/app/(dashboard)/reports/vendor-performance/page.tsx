import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ArrowLeft, BarChart3, TrendingUp } from 'lucide-react'

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-700 bg-green-100'
  if (score >= 60) return 'text-yellow-700 bg-yellow-100'
  return 'text-red-700 bg-red-100'
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default async function VendorPerformancePage() {
  const supabase = await createClient()

  const { data: performanceData, error } = await supabase
    .from('vendor_performance')
    .select(`
      id,
      vendor_id,
      month,
      score,
      on_time_delivery_pct,
      quality_rating,
      rejection_pct,
      vendor:vendors(vendor_code, legal_name, status)
    `)
    .order('month', { ascending: false })
    .order('score', { ascending: false })

  const records = performanceData ?? []

  // Compute summary stats
  const vendorMap = new Map<string, { name: string; code: string; avgScore: number; count: number }>()
  records.forEach((r: any) => {
    const key = r.vendor_id
    const existing = vendorMap.get(key)
    if (existing) {
      existing.avgScore = (existing.avgScore * existing.count + (r.score ?? 0)) / (existing.count + 1)
      existing.count += 1
    } else {
      vendorMap.set(key, {
        name: r.vendor?.legal_name ?? 'Unknown',
        code: r.vendor?.vendor_code ?? '',
        avgScore: r.score ?? 0,
        count: 1,
      })
    }
  })

  const totalVendors = vendorMap.size
  const avgScore = records.length > 0
    ? Math.round(records.reduce((s: number, r: any) => s + (r.score ?? 0), 0) / records.length)
    : 0
  const topPerformers = Array.from(vendorMap.values()).filter(v => v.avgScore >= 80).length

  return (
    <div>
      <Link
        href="/reports"
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft size={14} /> Back to Reports
      </Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Performance</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monthly performance scorecards for all vendors
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card border-l-4 border-[#1B3A6B]">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={18} className="text-[#1B3A6B]" />
            <span className="text-sm text-gray-500">Vendors Tracked</span>
          </div>
          <div className="text-2xl font-bold text-[#1B3A6B]">{totalVendors}</div>
        </div>
        <div className="stat-card border-l-4 border-[#0D7E8A]">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={18} className="text-[#0D7E8A]" />
            <span className="text-sm text-gray-500">Avg Score</span>
          </div>
          <div className={cn('text-2xl font-bold', avgScore >= 80 ? 'text-green-600' : avgScore >= 60 ? 'text-yellow-600' : 'text-red-600')}>
            {avgScore}/100
          </div>
        </div>
        <div className="stat-card border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-gray-500">Top Performers (80+)</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{topPerformers}</div>
          <div className="text-xs text-gray-400 mt-1">out of {totalVendors} vendors</div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <BarChart3 size={16} className="text-[#0D7E8A]" />
          <h2 className="font-semibold text-gray-900">Performance Scorecards</h2>
          <span className="text-xs text-gray-400 ml-auto">{records.length} records</span>
        </div>

        {records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Month</th>
                  <th>Score</th>
                  <th>On-Time Delivery %</th>
                  <th>Quality Rating</th>
                  <th>Rejection %</th>
                </tr>
              </thead>
              <tbody>
                {records.map((row: any) => (
                  <tr key={row.id}>
                    <td>
                      <div>
                        <Link
                          href={`/vendors/${row.vendor_id}`}
                          className="text-sm font-semibold text-[#1B3A6B] hover:underline"
                        >
                          {row.vendor?.legal_name ?? 'Unknown'}
                        </Link>
                        <div className="text-xs text-gray-400 font-mono">
                          {row.vendor?.vendor_code}
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-gray-700 font-medium">
                      {row.month}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 rounded-full h-2">
                          <div
                            className={cn('h-2 rounded-full transition-all', scoreBg(row.score ?? 0))}
                            style={{ width: `${Math.min(row.score ?? 0, 100)}%` }}
                          />
                        </div>
                        <span className={cn('badge text-xs font-bold', scoreColor(row.score ?? 0))}>
                          {row.score ?? 0}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={cn(
                        'text-sm font-semibold',
                        (row.on_time_delivery_pct ?? 0) >= 90
                          ? 'text-green-600'
                          : (row.on_time_delivery_pct ?? 0) >= 75
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      )}>
                        {row.on_time_delivery_pct != null
                          ? `${row.on_time_delivery_pct.toFixed(1)}%`
                          : '—'}
                      </span>
                    </td>
                    <td>
                      <span className={cn(
                        'text-sm font-semibold',
                        (row.quality_rating ?? 0) >= 4
                          ? 'text-green-600'
                          : (row.quality_rating ?? 0) >= 3
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      )}>
                        {row.quality_rating != null
                          ? `${row.quality_rating.toFixed(1)}/5`
                          : '—'}
                      </span>
                    </td>
                    <td>
                      <span className={cn(
                        'text-sm font-semibold',
                        (row.rejection_pct ?? 0) <= 2
                          ? 'text-green-600'
                          : (row.rejection_pct ?? 0) <= 5
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      )}>
                        {row.rejection_pct != null
                          ? `${row.rejection_pct.toFixed(1)}%`
                          : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <BarChart3 size={40} className="mx-auto mb-3 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-500 mb-1">
              No performance data recorded yet
            </h3>
            <p className="text-sm text-gray-400">
              Performance scores will appear here once vendor evaluations are submitted.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
