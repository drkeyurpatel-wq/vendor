import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatCurrency, formatLakhs, formatDate, getCurrentFY, getFYOptions } from '@/lib/utils'
import { ArrowLeft, Building2, TrendingUp } from 'lucide-react'
import CentreSpendCharts from './CentreSpendCharts'

export const dynamic = 'force-dynamic'

export default async function CentreWiseSpendReport({
  searchParams,
}: {
  searchParams: Promise<{ months?: string; fy?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const fyOptions = getFYOptions(3)
  const monthsBack = parseInt(params.months || '3') || 3
  const now = new Date()

  let startDate: string
  let endDate: string | undefined
  let periodLabel: string

  if (params.fy) {
    const fy = fyOptions.find(f => f.label === params.fy) || getCurrentFY()
    startDate = fy.start
    endDate = fy.end
    periodLabel = fy.label
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1).toISOString().split('T')[0]
    periodLabel = `Last ${monthsBack} months`
  }

  let query = supabase
    .from('purchase_orders')
    .select('po_date, total_amount, status, centre:centres(code, name)')
    .gte('po_date', startDate)
    .is('deleted_at', null)
    .not('status', 'eq', 'cancelled')
    .order('po_date')

  if (endDate) query = query.lte('po_date', endDate)

  const { data: pos } = await query

  const { data: centres } = await supabase.from('centres').select('id, code, name').eq('is_active', true).order('code')

  const allPOs = pos || []

  // Monthly × centre matrix
  const monthlyData: Record<string, Record<string, number>> = {}
  const centreTotals: Record<string, { spend: number; count: number }> = {}

  allPOs.forEach((po: any) => {
    const monthKey = po.po_date.substring(0, 7)
    const centreCode = po.centre?.code || 'UNK'
    if (!monthlyData[monthKey]) monthlyData[monthKey] = {}
    monthlyData[monthKey][centreCode] = (monthlyData[monthKey][centreCode] || 0) + (po.total_amount || 0)
    if (!centreTotals[centreCode]) centreTotals[centreCode] = { spend: 0, count: 0 }
    centreTotals[centreCode].spend += po.total_amount || 0
    centreTotals[centreCode].count++
  })

  const months = Object.keys(monthlyData).sort()
  const centreCodesInData = Object.keys(centreTotals).sort()
  const grandTotal = Object.values(centreTotals).reduce((s, c) => s + c.spend, 0)

  // Chart data
  const chartData = months.map(m => {
    const row: Record<string, any> = { month: new Date(m + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }) }
    centreCodesInData.forEach(c => { row[c] = Math.round((monthlyData[m]?.[c] || 0) / 100) / 100 })
    return row
  })

  return (
    <div>
      <Link href="/reports" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Reports
      </Link>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-600 tracking-tight">Centre-wise Spend Report</h1>
          <p className="text-sm text-gray-500 mt-1">{allPOs.length} POs — {periodLabel} — {formatLakhs(grandTotal)} total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {fyOptions.map(fy => (
            <Link key={fy.label} href={`/reports/centre-wise-spend?fy=${fy.label}`}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                params.fy === fy.label ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-600 border-gray-200')}>
              {fy.label}
            </Link>
          ))}
          <span className="text-gray-300 self-center">|</span>
          {[3, 6, 12].map(m => (
            <Link key={m} href={`/reports/centre-wise-spend?months=${m}`}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                !params.fy && monthsBack === m ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-600 border-gray-200')}>
              {m}mo
            </Link>
          ))}
        </div>
      </div>

      {/* Centre summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {centreCodesInData.map(code => {
          const ct = centreTotals[code]
          const pct = grandTotal > 0 ? (ct.spend / grandTotal * 100) : 0
          return (
            <div key={code} className="bg-white rounded-xl border border-gray-200/80 shadow-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="badge bg-blue-50 text-blue-700 font-semibold">{code}</span>
                <span className="text-xs text-gray-400">{pct.toFixed(1)}%</span>
              </div>
              <div className="text-lg font-bold text-navy-600">{formatLakhs(ct.spend)}</div>
              <div className="text-xs text-gray-500">{ct.count} POs</div>
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-navy-600 rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Recharts */}
      <CentreSpendCharts chartData={chartData} centres={centreCodesInData} />

      {/* Monthly × centre table */}
      <div className="card overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-navy-600">Monthly Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                {centreCodesInData.map(c => <th key={c} className="text-right">{c}</th>)}
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {months.map(m => {
                const monthTotal = centreCodesInData.reduce((s, c) => s + (monthlyData[m]?.[c] || 0), 0)
                return (
                  <tr key={m}>
                    <td className="text-sm font-medium">{new Date(m + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</td>
                    {centreCodesInData.map(c => (
                      <td key={c} className="text-sm text-right font-mono">{monthlyData[m]?.[c] ? formatLakhs(monthlyData[m][c]) : '—'}</td>
                    ))}
                    <td className="text-sm text-right font-bold font-mono text-navy-600">{formatLakhs(monthTotal)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#EEF2F9]">
                <td className="font-semibold text-navy-600">Grand Total</td>
                {centreCodesInData.map(c => (
                  <td key={c} className="text-right font-bold font-mono">{formatLakhs(centreTotals[c].spend)}</td>
                ))}
                <td className="text-right font-bold font-mono text-navy-600">{formatLakhs(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
