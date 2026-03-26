import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cn, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Award, AlertTriangle, Search, Calendar } from 'lucide-react'
import { format, subMonths, startOfMonth } from 'date-fns'
import ComputeScoresButton from '@/components/ui/ComputeScoresButton'

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-700 bg-green-100'
  if (score >= 60) return 'text-yellow-700 bg-yellow-100'
  return 'text-red-700 bg-red-100'
}

function scoreBgClass(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  return 'bg-red-500'
}

function ScoreBar({ score, label }: { score: number | null; label: string }) {
  const value = score ?? 0
  return (
    <div className="flex items-center gap-2" title={`${label}: ${value.toFixed(1)}`}>
      <div className="w-16 bg-gray-100 rounded-full h-2">
        <div
          className={cn('h-2 rounded-full transition-all', scoreBgClass(value))}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-600 w-8 text-right">
        {value.toFixed(0)}
      </span>
    </div>
  )
}

export const dynamic = 'force-dynamic'

export default async function VendorPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; q?: string }>
}) {
  const params = await searchParams
  const { supabase, user, profile, role, centreId, isGroupLevel } = await requireAuth()
  // Determine the selected month filter (default: current month)
  const selectedMonth = params.month || format(startOfMonth(new Date()), 'yyyy-MM-dd')
  const previousMonth = format(subMonths(new Date(selectedMonth), 1), 'yyyy-MM-01')

  // Build query for current month performance data
  let query = supabase
    .from('vendor_performance')
    .select(`
      id,
      vendor_id,
      month,
      delivery_score,
      quality_score,
      price_score,
      service_score,
      overall_score,
      notes,
      created_at,
      vendor:vendors(id, vendor_code, legal_name, status)
    `)
    .eq('month', selectedMonth)
    .order('overall_score', { ascending: false })

  const { data: currentData } = await query

  // Query previous month data for trend comparison
  const { data: prevData } = await supabase
    .from('vendor_performance')
    .select('vendor_id, overall_score')
    .eq('month', previousMonth)

  // Build previous month score map
  const prevScoreMap = new Map<string, number>()
  prevData?.forEach((row: any) => {
    prevScoreMap.set(row.vendor_id, row.overall_score ?? 0)
  })

  // Apply vendor search filter client-side
  let records = currentData ?? []
  if (params.q) {
    const searchLower = params.q.toLowerCase()
    records = records.filter((r: any) =>
      r.vendor?.legal_name?.toLowerCase().includes(searchLower) ||
      r.vendor?.vendor_code?.toLowerCase().includes(searchLower)
    )
  }

  // Get all distinct months for the month picker
  const { data: allMonths } = await supabase
    .from('vendor_performance')
    .select('month')
    .order('month', { ascending: false })

  const uniqueMonths = Array.from(new Set((allMonths ?? []).map((m: any) => m.month)))

  // Compute summary stats
  const totalVendors = records.length
  const avgOverall = totalVendors > 0
    ? Math.round(records.reduce((s: number, r: any) => s + (r.overall_score ?? 0), 0) / totalVendors)
    : 0

  // Top performer
  const topPerformer = records.length > 0 ? records[0] : null

  // Vendors below threshold (<60)
  const belowThreshold = records.filter((r: any) => (r.overall_score ?? 0) < 60).length

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
          <h1 className="page-title">Vendor Performance Scorecards</h1>
          <p className="page-subtitle">
            Monthly performance tracking across delivery, quality, price, and service
          </p>
        </div>
        <ComputeScoresButton />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card border-l-4 border-navy-600">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={18} className="text-navy-600" />
            <span className="text-sm text-gray-500">Avg Overall Score</span>
          </div>
          <div className={cn(
            'text-2xl font-bold',
            avgOverall >= 80 ? 'text-green-600' : avgOverall >= 60 ? 'text-yellow-600' : 'text-red-600'
          )}>
            {avgOverall}/100
          </div>
          <div className="text-xs text-gray-500 mt-1">{totalVendors} vendors evaluated</div>
        </div>

        <div className="stat-card border-l-4 border-teal-500">
          <div className="flex items-center gap-2 mb-1">
            <Award size={18} className="text-teal-500" />
            <span className="text-sm text-gray-500">Top Performer</span>
          </div>
          {topPerformer ? (
            <>
              <div className="text-lg font-bold text-teal-500 truncate">
                {(topPerformer as any).vendor?.legal_name ?? 'Unknown'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Score: {((topPerformer as any).overall_score ?? 0).toFixed(1)}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500">No data</div>
          )}
        </div>

        <div className="stat-card border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={18} className="text-green-500" />
            <span className="text-sm text-gray-500">Above 80 (Excellent)</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {records.filter((r: any) => (r.overall_score ?? 0) >= 80).length}
          </div>
          <div className="text-xs text-gray-500 mt-1">out of {totalVendors} vendors</div>
        </div>

        <div className="stat-card border-l-4 border-red-500">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={18} className="text-red-500" />
            <span className="text-sm text-gray-500">Below 60 (At Risk)</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{belowThreshold}</div>
          <div className="text-xs text-gray-500 mt-1">need attention</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <form className="flex flex-col sm:flex-row gap-3" method="GET">
          <div className="flex items-center gap-2 flex-1">
            <Search size={16} className="text-gray-500" />
            <input
              type="text"
              name="q"
              placeholder="Search vendor name or code..."
              defaultValue={params.q || ''}
              className="form-input flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-500" />
            <select
              name="month"
              defaultValue={selectedMonth}
              className="form-select"
            >
              {uniqueMonths.length > 0 ? (
                uniqueMonths.map((m: string) => (
                  <option key={m} value={m}>
                    {format(new Date(m), 'MMMM yyyy')}
                  </option>
                ))
              ) : (
                <option value={selectedMonth}>
                  {format(new Date(selectedMonth), 'MMMM yyyy')}
                </option>
              )}
            </select>
          </div>
          <button type="submit" className="btn-primary">
            Apply Filters
          </button>
        </form>
      </div>

      {/* Performance Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <BarChart3 size={16} className="text-teal-500" />
          <h2 className="font-semibold text-gray-900">Performance Scorecards</h2>
          <span className="text-xs text-gray-500 ml-2">
            {format(new Date(selectedMonth), 'MMMM yyyy')}
          </span>
          <span className="text-xs text-gray-500 ml-auto">{records.length} vendors</span>
        </div>

        {records.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Delivery (30%)</th>
                  <th>Quality (30%)</th>
                  <th>Price (20%)</th>
                  <th>Service (20%)</th>
                  <th>Overall</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                {records.map((row: any) => {
                  const prevScore = prevScoreMap.get(row.vendor_id)
                  const overall = row.overall_score ?? 0
                  const trendDiff = prevScore !== undefined ? overall - prevScore : null

                  return (
                    <tr key={row.id}>
                      <td>
                        <div>
                          <Link
                            href={`/vendors/${row.vendor_id}`}
                            className="text-sm font-semibold text-navy-600 hover:underline"
                          >
                            {row.vendor?.legal_name ?? 'Unknown'}
                          </Link>
                          <div className="text-xs text-gray-500 font-mono">
                            {row.vendor?.vendor_code}
                          </div>
                        </div>
                      </td>
                      <td>
                        <ScoreBar score={row.delivery_score} label="Delivery" />
                      </td>
                      <td>
                        <ScoreBar score={row.quality_score} label="Quality" />
                      </td>
                      <td>
                        <ScoreBar score={row.price_score} label="Price" />
                      </td>
                      <td>
                        <ScoreBar score={row.service_score} label="Service" />
                      </td>
                      <td>
                        <span className={cn('badge text-xs font-bold px-2.5 py-1', scoreColor(overall))}>
                          {overall.toFixed(1)}
                        </span>
                      </td>
                      <td>
                        {trendDiff !== null ? (
                          <div className="flex items-center gap-1">
                            {trendDiff > 0 ? (
                              <TrendingUp size={14} className="text-green-500" />
                            ) : trendDiff < 0 ? (
                              <TrendingDown size={14} className="text-red-500" />
                            ) : (
                              <span className="text-gray-500 text-xs">--</span>
                            )}
                            {trendDiff !== 0 && (
                              <span className={cn(
                                'text-xs font-semibold',
                                trendDiff > 0 ? 'text-green-600' : 'text-red-600'
                              )}>
                                {trendDiff > 0 ? '+' : ''}{trendDiff.toFixed(1)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">New</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <BarChart3 size={40} className="mx-auto mb-3 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-500 mb-1">
              No performance data for this period
            </h3>
            <p className="text-sm text-gray-500">
              Performance scores will appear here once vendor evaluations are calculated.
              {uniqueMonths.length > 0 && ' Try selecting a different month.'}
            </p>
          </div>
        )}
      </div>

      {/* Score Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <span className="font-medium">Score Legend:</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500" /> 80+ Excellent
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-yellow-500" /> 60-79 Satisfactory
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500" /> Below 60 At Risk
        </span>
      </div>
    </div>
  )
}
