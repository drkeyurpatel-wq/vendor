import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { AlertTriangle, ShieldAlert } from 'lucide-react'

const ALERT_LEVEL_COLORS: Record<string, string> = {
  expired: 'bg-red-100 text-red-800',
  expiring_30_days: 'bg-orange-100 text-orange-800',
  expiring_90_days: 'bg-yellow-100 text-yellow-800',
  expiring_180_days: 'bg-blue-100 text-blue-800',
}

const ALERT_LEVELS = ['expired', 'expiring_30_days', 'expiring_90_days', 'expiring_180_days']

export const dynamic = 'force-dynamic'

export default async function ExpiryAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ centre?: string; alert_level?: string }>
}) {
  const params = await searchParams
  const { supabase, role, isGroupLevel } = await requireAuth()

  // Fetch centres for filter
  const { data: centres } = await supabase
    .from('centres')
    .select('id, code, name')
    .eq('is_active', true)

  // Fetch expiry alerts from view (falls back gracefully if view doesn't exist)
  let alerts: any[] | null = null
  let allAlerts: any[] | null = null

  // Try the database view first
  let query = supabase.from('v_expiry_alerts').select('*')
  if (params.centre) query = query.eq('centre_id', params.centre)
  if (params.alert_level) query = query.eq('alert_level', params.alert_level)

  const { data: viewData, error: viewError } = await query.order('days_to_expiry', { ascending: true })

  if (!viewError) {
    alerts = viewData

    let statsQuery = supabase.from('v_expiry_alerts').select('alert_level')
    if (params.centre) statsQuery = statsQuery.eq('centre_id', params.centre)
    const { data: statsData } = await statsQuery
    allAlerts = statsData
  } else {
    // Fallback: query grn_items with batch expiry data directly
    const today = new Date()
    const d180 = new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]

    let fallbackQuery = supabase
      .from('grn_items')
      .select('id, batch_no, expiry_date, received_qty, item:items(item_code, generic_name), grn:grns(centre_id, centre:centres(code))')
      .lte('expiry_date', d180)
      .gt('received_qty', 0)
      .order('expiry_date', { ascending: true })
      .limit(200)

    const { data: grnItems } = await fallbackQuery

    alerts = (grnItems || [])
      .filter((gi: any) => {
        if (params.centre && gi.grn?.centre_id !== params.centre) return false
        return true
      })
      .map((gi: any) => {
        const daysToExpiry = Math.ceil((new Date(gi.expiry_date).getTime() - today.getTime()) / 86400000)
        const alertLevel = daysToExpiry <= 0 ? 'expired'
          : daysToExpiry <= 30 ? 'expiring_30_days'
          : daysToExpiry <= 90 ? 'expiring_90_days'
          : 'expiring_180_days'

        if (params.alert_level && alertLevel !== params.alert_level) return null

        return {
          id: gi.id,
          item_name: gi.item?.generic_name,
          item_code: gi.item?.item_code,
          centre_code: gi.grn?.centre?.code,
          batch_number: gi.batch_no,
          expiry_date: gi.expiry_date,
          days_to_expiry: daysToExpiry,
          qty_available: gi.received_qty,
          mrp: null,
          purchase_rate: null,
          alert_level: alertLevel,
        }
      })
      .filter(Boolean)

    allAlerts = (alerts || []).map((a: any) => ({ alert_level: a.alert_level }))
  }

  const expiredCount = allAlerts?.filter((a: any) => a.alert_level === 'expired').length ?? 0
  const exp30Count = allAlerts?.filter((a: any) => a.alert_level === 'expiring_30_days').length ?? 0
  const exp90Count = allAlerts?.filter((a: any) => a.alert_level === 'expiring_90_days').length ?? 0
  const exp180Count = allAlerts?.filter((a: any) => a.alert_level === 'expiring_180_days').length ?? 0

  function buildFilterHref(level?: string) {
    const p = new URLSearchParams()
    if (params.centre) p.set('centre', params.centre)
    if (level) p.set('alert_level', level)
    const qs = p.toString()
    return `/inventory/expiry-alerts${qs ? `?${qs}` : ''}`
  }

  function buildCentreHref(centreId?: string) {
    const p = new URLSearchParams()
    if (centreId) p.set('centre', centreId)
    if (params.alert_level) p.set('alert_level', params.alert_level)
    const qs = p.toString()
    return `/inventory/expiry-alerts${qs ? `?${qs}` : ''}`
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Expiry Alerts</h1>
          <p className="page-subtitle">
            Monitor items approaching or past expiry across centres
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Link href={buildFilterHref('expired')} className="stat-card border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expired</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{expiredCount}</p>
        </Link>
        <Link href={buildFilterHref('expiring_30_days')} className="stat-card border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expiring in 30 Days</p>
          <p className="text-2xl font-bold text-orange-700 mt-1">{exp30Count}</p>
        </Link>
        <Link href={buildFilterHref('expiring_90_days')} className="stat-card border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expiring in 90 Days</p>
          <p className="text-2xl font-bold text-yellow-700 mt-1">{exp90Count}</p>
        </Link>
        <Link href={buildFilterHref('expiring_180_days')} className="stat-card border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expiring in 180 Days</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{exp180Count}</p>
        </Link>
      </div>

      {/* Centre filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Link
          href={buildCentreHref()}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
            !params.centre
              ? 'bg-teal-500 text-white border-teal-500'
              : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
          )}
        >
          All Centres
        </Link>
        {centres?.map((c) => (
          <Link
            key={c.id}
            href={buildCentreHref(c.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
              params.centre === c.id
                ? 'bg-teal-500 text-white border-teal-500'
                : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
            )}
          >
            {c.code}
          </Link>
        ))}
      </div>

      {/* Alert level filter pills */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 flex-wrap">
        <Link
          href={buildFilterHref()}
          className={cn(
            'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-colors',
            !params.alert_level
              ? 'bg-navy-600 text-white border-navy-600'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          )}
        >
          All Levels
        </Link>
        {ALERT_LEVELS.map((level) => (
          <Link
            key={level}
            href={buildFilterHref(level)}
            className={cn(
              'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap border transition-colors',
              params.alert_level === level
                ? 'bg-navy-600 text-white border-navy-600'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            )}
          >
            {level === 'expired' ? 'Expired' : level.replace('expiring_', '').replace('_', ' ').replace('days', 'Days')}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {alerts && alerts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Centre</th>
                  <th>Batch</th>
                  <th>Expiry Date</th>
                  <th>Days to Expiry</th>
                  <th>Qty Available</th>
                  <th>MRP</th>
                  <th>Purchase Rate</th>
                  <th>Alert Level</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert: any, idx: number) => (
                  <tr key={alert.id ?? idx}>
                    <td>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{alert.item_name}</p>
                        {alert.item_code && (
                          <p className="font-mono text-xs text-gray-500">{alert.item_code}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-navy-50 text-navy-600">
                        {alert.centre_code ?? '—'}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-gray-600">{alert.batch_number ?? '—'}</td>
                    <td className="text-sm text-gray-600">
                      {alert.expiry_date ? formatDate(alert.expiry_date) : '—'}
                    </td>
                    <td>
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          alert.days_to_expiry <= 0
                            ? 'text-red-700'
                            : alert.days_to_expiry <= 30
                              ? 'text-orange-700'
                              : alert.days_to_expiry <= 90
                                ? 'text-yellow-700'
                                : 'text-blue-700'
                        )}
                      >
                        {alert.days_to_expiry <= 0
                          ? `${Math.abs(alert.days_to_expiry)}d overdue`
                          : `${alert.days_to_expiry}d`}
                      </span>
                    </td>
                    <td className="text-sm font-medium text-gray-700">
                      {alert.qty_available ?? '—'}
                    </td>
                    <td className="text-sm text-gray-600">
                      {alert.mrp != null ? formatCurrency(alert.mrp) : '—'}
                    </td>
                    <td className="text-sm text-gray-600">
                      {alert.purchase_rate != null ? formatCurrency(alert.purchase_rate) : '—'}
                    </td>
                    <td>
                      <span
                        className={cn(
                          'badge',
                          ALERT_LEVEL_COLORS[alert.alert_level] || 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {alert.alert_level === 'expired'
                          ? 'Expired'
                          : alert.alert_level?.replace('expiring_', '').replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <ShieldAlert size={40} className="mb-3 text-gray-500" />
            <p className="font-medium text-gray-500">No expiry alerts found</p>
            <p className="text-sm text-gray-500 mt-1">
              All stock is within safe expiry ranges
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
