import { requireApiAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { withApiErrorHandler } from '@/lib/api-error-handler'

/**
 * AI Analytics API
 * Provides: consumption projections, ideal inventory levels, historic price analysis, price anomaly detection
 *
 * Algorithms used:
 * - Exponential Moving Average (EMA) for consumption forecasting
 * - Safety stock calculation: Z × σ × √(lead_time)
 * - Reorder Point: (avg_daily_consumption × lead_time) + safety_stock
 * - Price anomaly: |rate - mean| > 2σ flagged as anomaly
 */

interface AnalyticsResponse {
  consumption_projections: ConsumptionProjection[]
  ideal_inventory: IdealInventory[]
  price_history: PriceHistory[]
  price_anomalies: PriceAnomaly[]
  summary: AnalyticsSummary
}

interface ConsumptionProjection {
  item_id: string
  item_code: string
  generic_name: string
  centre_code: string
  centre_id: string
  avg_daily_consumption: number
  trend: 'rising' | 'falling' | 'stable'
  trend_percent: number
  projected_30d: number
  projected_60d: number
  projected_90d: number
  days_of_stock_remaining: number | null
  stockout_risk: 'critical' | 'warning' | 'safe'
}

interface IdealInventory {
  item_id: string
  item_code: string
  generic_name: string
  centre_code: string
  centre_id: string
  current_stock: number
  reorder_level: number
  calculated_reorder_point: number
  safety_stock: number
  economic_order_qty: number
  max_level: number
  adjustment_needed: 'increase' | 'decrease' | 'optimal'
  recommended_reorder_level: number
}

interface PriceHistory {
  item_id: string
  item_code: string
  generic_name: string
  rates: { date: string; rate: number; vendor_name: string; po_number: string }[]
  avg_rate: number
  min_rate: number
  max_rate: number
  latest_rate: number
  rate_trend: 'rising' | 'falling' | 'stable'
  rate_change_pct: number
}

interface PriceAnomaly {
  item_id: string
  item_code: string
  generic_name: string
  po_number: string
  po_date: string
  vendor_name: string
  rate: number
  avg_rate: number
  deviation_pct: number
  severity: 'high' | 'medium'
}

interface AnalyticsSummary {
  total_items_analyzed: number
  items_at_stockout_risk: number
  items_with_price_anomalies: number
  items_needing_reorder_adjustment: number
  avg_days_of_stock: number
  total_projected_spend_30d: number
}

// Exponential Moving Average
function ema(values: number[], alpha: number = 0.3): number {
  if (values.length === 0) return 0
  let result = values[0]
  for (let i = 1; i < values.length; i++) {
    result = alpha * values[i] + (1 - alpha) * result
  }
  return result
}

// Standard deviation
function stdDev(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1)
  return Math.sqrt(variance)
}

export const GET = withApiErrorHandler(async (req: NextRequest) => {
  const rateLimitResult = await rateLimit(req, 30, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { supabase, user, userId } = await requireApiAuth()
  const { searchParams } = new URL(req.url)
  const analysisType = searchParams.get('type')
  const centreId = searchParams.get('centre_id')
  const itemId = searchParams.get('item_id')

  // Advanced anomaly detection mode
  if (analysisType === 'anomalies') {
    return detectAnomalies(supabase, centreId)
  }

  // 1. Fetch stock ledger (last 180 days of consumption data)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180)

  let stockQuery = supabase
    .from('stock_ledger')
    .select('item_id, centre_id, quantity, created_at, transaction_type')
    .eq('transaction_type', 'consumption')
    .gte('created_at', sixMonthsAgo.toISOString())
    .order('created_at', { ascending: true })

  if (centreId) stockQuery = stockQuery.eq('centre_id', centreId)
  if (itemId) stockQuery = stockQuery.eq('item_id', itemId)

  // 2. Fetch PO item history (for price analysis)
  let priceQuery = supabase
    .from('purchase_order_items')
    .select('item_id, rate, po:purchase_orders!inner(po_number, po_date, vendor:vendors(legal_name), centre_id, status)')
    .in('po.status', ['approved', 'sent_to_vendor', 'partially_received', 'fully_received', 'closed'])
    .order('po.po_date', { ascending: true })

  if (centreId) priceQuery = priceQuery.eq('po.centre_id', centreId)
  if (itemId) priceQuery = priceQuery.eq('item_id', itemId)

  // 3. Fetch current stock levels
  let stockLevelQuery = supabase
    .from('item_centre_stock')
    .select('*, item:items(item_code, generic_name, unit), centre:centres(code, name)')
    .gt('reorder_level', 0)

  if (centreId) stockLevelQuery = stockLevelQuery.eq('centre_id', centreId)
  if (itemId) stockLevelQuery = stockLevelQuery.eq('item_id', itemId)

  // 4. Fetch items for reference
  let itemsQuery = supabase.from('items').select('id, item_code, generic_name, unit').is('deleted_at', null)
  if (itemId) itemsQuery = itemsQuery.eq('id', itemId)

  const [
    { data: stockLedger },
    { data: priceData },
    { data: stockLevels },
    { data: allItems },
  ] = await Promise.all([stockQuery, priceQuery, stockLevelQuery, itemsQuery])

  const itemMap = new Map(allItems?.map(i => [i.id, i]) || [])
  const centreCodeMap = new Map<string, string>()
  stockLevels?.forEach((s: any) => {
    if (s.centre?.code) centreCodeMap.set(s.centre_id, s.centre.code)
  })

  // ── CONSUMPTION PROJECTIONS ──
  // Group consumption by item+centre, calculate daily buckets
  const consumptionMap = new Map<string, { item_id: string; centre_id: string; dailyTotals: Map<string, number> }>()

  stockLedger?.forEach((entry: any) => {
    const key = `${entry.item_id}:${entry.centre_id}`
    if (!consumptionMap.has(key)) {
      consumptionMap.set(key, { item_id: entry.item_id, centre_id: entry.centre_id, dailyTotals: new Map() })
    }
    const dateKey = entry.created_at.split('T')[0]
    const group = consumptionMap.get(key)!
    group.dailyTotals.set(dateKey, (group.dailyTotals.get(dateKey) || 0) + Math.abs(entry.quantity))
  })

  const consumptionProjections: ConsumptionProjection[] = []

  consumptionMap.forEach((group) => {
    const item = itemMap.get(group.item_id)
    if (!item) return

    const sortedDates = Array.from(group.dailyTotals.keys()).sort()
    if (sortedDates.length < 7) return // Need at least a week of data

    const dailyValues = sortedDates.map(d => group.dailyTotals.get(d)!)

    // Calculate avg daily consumption using EMA (recent data weighted more)
    const avgDaily = ema(dailyValues)

    // Trend: compare first half EMA vs second half EMA
    const mid = Math.floor(dailyValues.length / 2)
    const firstHalfAvg = dailyValues.slice(0, mid).reduce((a, b) => a + b, 0) / mid
    const secondHalfAvg = dailyValues.slice(mid).reduce((a, b) => a + b, 0) / (dailyValues.length - mid)

    let trend: 'rising' | 'falling' | 'stable' = 'stable'
    let trendPercent = 0
    if (firstHalfAvg > 0) {
      trendPercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100
      if (trendPercent > 10) trend = 'rising'
      else if (trendPercent < -10) trend = 'falling'
    }

    // Apply trend adjustment for projections
    const trendMultiplier = 1 + (trendPercent / 200) // damped trend
    const projected30 = Math.round(avgDaily * 30 * trendMultiplier)
    const projected60 = Math.round(avgDaily * 60 * Math.pow(trendMultiplier, 1.5))
    const projected90 = Math.round(avgDaily * 90 * Math.pow(trendMultiplier, 2))

    // Days of stock remaining
    const stockLevel = stockLevels?.find((s: any) => s.item_id === group.item_id && s.centre_id === group.centre_id)
    const currentStock = stockLevel?.current_stock ?? 0
    const daysRemaining = avgDaily > 0 ? Math.round(currentStock / avgDaily) : null

    let stockoutRisk: 'critical' | 'warning' | 'safe' = 'safe'
    if (daysRemaining !== null) {
      if (daysRemaining <= 7) stockoutRisk = 'critical'
      else if (daysRemaining <= 21) stockoutRisk = 'warning'
    }

    consumptionProjections.push({
      item_id: group.item_id,
      item_code: item.item_code,
      generic_name: item.generic_name,
      centre_code: centreCodeMap.get(group.centre_id) || '',
      centre_id: group.centre_id,
      avg_daily_consumption: Math.round(avgDaily * 100) / 100,
      trend,
      trend_percent: Math.round(trendPercent * 10) / 10,
      projected_30d: projected30,
      projected_60d: projected60,
      projected_90d: projected90,
      days_of_stock_remaining: daysRemaining,
      stockout_risk: stockoutRisk,
    })
  })

  // Sort by stockout risk
  consumptionProjections.sort((a, b) => {
    const riskOrder = { critical: 0, warning: 1, safe: 2 }
    if (riskOrder[a.stockout_risk] !== riskOrder[b.stockout_risk]) return riskOrder[a.stockout_risk] - riskOrder[b.stockout_risk]
    return (a.days_of_stock_remaining ?? 999) - (b.days_of_stock_remaining ?? 999)
  })

  // ── IDEAL INVENTORY LEVELS ──
  const idealInventory: IdealInventory[] = []
  const DEFAULT_LEAD_TIME = 7 // days
  const SERVICE_LEVEL_Z = 1.65 // 95% service level

  stockLevels?.forEach((stock: any) => {
    const item = itemMap.get(stock.item_id)
    if (!item) return

    const consumptionGroup = consumptionMap.get(`${stock.item_id}:${stock.centre_id}`)
    if (!consumptionGroup) return

    const dailyValues = Array.from(consumptionGroup.dailyTotals.values())
    if (dailyValues.length < 7) return

    const avgDaily = ema(dailyValues)
    const sd = stdDev(dailyValues)

    // Safety stock = Z × σ_daily × √(lead_time)
    const safetyStock = Math.ceil(SERVICE_LEVEL_Z * sd * Math.sqrt(DEFAULT_LEAD_TIME))

    // Reorder point = (avg_daily × lead_time) + safety_stock
    const reorderPoint = Math.ceil(avgDaily * DEFAULT_LEAD_TIME + safetyStock)

    // Economic Order Quantity (simplified Wilson formula)
    // EOQ = √(2DS/H) where D=annual demand, S=order cost (assumed ₹500), H=holding cost (assumed 20% of avg rate)
    const annualDemand = avgDaily * 365
    const orderCost = 500
    const holdingCostRate = 0.20
    const avgRate = stock.last_grn_rate || 100
    const holdingCost = avgRate * holdingCostRate
    const eoq = holdingCost > 0 ? Math.ceil(Math.sqrt((2 * annualDemand * orderCost) / holdingCost)) : Math.ceil(avgDaily * 30)

    // Max level = reorder_point + EOQ
    const maxLevel = reorderPoint + eoq

    let adjustment: 'increase' | 'decrease' | 'optimal' = 'optimal'
    if (stock.reorder_level < reorderPoint * 0.8) adjustment = 'increase'
    else if (stock.reorder_level > reorderPoint * 1.3) adjustment = 'decrease'

    idealInventory.push({
      item_id: stock.item_id,
      item_code: item.item_code,
      generic_name: item.generic_name,
      centre_code: stock.centre?.code || '',
      centre_id: stock.centre_id,
      current_stock: stock.current_stock,
      reorder_level: stock.reorder_level,
      calculated_reorder_point: reorderPoint,
      safety_stock: safetyStock,
      economic_order_qty: eoq,
      max_level: maxLevel,
      adjustment_needed: adjustment,
      recommended_reorder_level: reorderPoint,
    })
  })

  idealInventory.sort((a, b) => {
    const order = { increase: 0, decrease: 1, optimal: 2 }
    return order[a.adjustment_needed] - order[b.adjustment_needed]
  })

  // ── HISTORIC PRICE ANALYSIS ──
  const priceByItem = new Map<string, { rates: { date: string; rate: number; vendor_name: string; po_number: string }[] }>()

  priceData?.forEach((poi: any) => {
    if (!poi.rate || poi.rate <= 0) return
    if (!priceByItem.has(poi.item_id)) {
      priceByItem.set(poi.item_id, { rates: [] })
    }
    priceByItem.get(poi.item_id)!.rates.push({
      date: poi.po?.po_date,
      rate: poi.rate,
      vendor_name: poi.po?.vendor?.legal_name || 'Unknown',
      po_number: poi.po?.po_number || '',
    })
  })

  const priceHistory: PriceHistory[] = []
  const priceAnomalies: PriceAnomaly[] = []

  priceByItem.forEach((data, itemId) => {
    const item = itemMap.get(itemId)
    if (!item || data.rates.length < 2) return

    const rates = data.rates.map(r => r.rate)
    const avgRate = rates.reduce((a, b) => a + b, 0) / rates.length
    const minRate = Math.min(...rates)
    const maxRate = Math.max(...rates)
    const latestRate = rates[rates.length - 1]
    const sd = stdDev(rates)

    // Trend: compare first half vs second half avg
    const mid = Math.floor(rates.length / 2)
    const firstAvg = rates.slice(0, mid).reduce((a, b) => a + b, 0) / mid
    const secondAvg = rates.slice(mid).reduce((a, b) => a + b, 0) / (rates.length - mid)
    let rateTrend: 'rising' | 'falling' | 'stable' = 'stable'
    let rateChangePct = 0
    if (firstAvg > 0) {
      rateChangePct = ((secondAvg - firstAvg) / firstAvg) * 100
      if (rateChangePct > 5) rateTrend = 'rising'
      else if (rateChangePct < -5) rateTrend = 'falling'
    }

    priceHistory.push({
      item_id: itemId,
      item_code: item.item_code,
      generic_name: item.generic_name,
      rates: data.rates,
      avg_rate: Math.round(avgRate * 100) / 100,
      min_rate: minRate,
      max_rate: maxRate,
      latest_rate: latestRate,
      rate_trend: rateTrend,
      rate_change_pct: Math.round(rateChangePct * 10) / 10,
    })

    // Anomaly detection: |rate - mean| > 2σ
    if (sd > 0) {
      data.rates.forEach((r) => {
        const deviation = Math.abs(r.rate - avgRate)
        if (deviation > 2 * sd) {
          const deviationPct = (deviation / avgRate) * 100
          priceAnomalies.push({
            item_id: itemId,
            item_code: item.item_code,
            generic_name: item.generic_name,
            po_number: r.po_number,
            po_date: r.date,
            vendor_name: r.vendor_name,
            rate: r.rate,
            avg_rate: Math.round(avgRate * 100) / 100,
            deviation_pct: Math.round(deviationPct * 10) / 10,
            severity: deviation > 3 * sd ? 'high' : 'medium',
          })
        }
      })
    }
  })

  priceHistory.sort((a, b) => Math.abs(b.rate_change_pct) - Math.abs(a.rate_change_pct))
  priceAnomalies.sort((a, b) => b.deviation_pct - a.deviation_pct)

  // ── SUMMARY ──
  const totalProjectedSpend = consumptionProjections.reduce((sum, cp) => {
    const priceItem = priceHistory.find(ph => ph.item_id === cp.item_id)
    return sum + cp.projected_30d * (priceItem?.latest_rate || 0)
  }, 0)

  const validDays = consumptionProjections.filter(cp => cp.days_of_stock_remaining !== null).map(cp => cp.days_of_stock_remaining!)
  const avgDaysOfStock = validDays.length > 0 ? Math.round(validDays.reduce((a, b) => a + b, 0) / validDays.length) : 0

  const summary: AnalyticsSummary = {
    total_items_analyzed: consumptionProjections.length,
    items_at_stockout_risk: consumptionProjections.filter(cp => cp.stockout_risk !== 'safe').length,
    items_with_price_anomalies: priceAnomalies.length,
    items_needing_reorder_adjustment: idealInventory.filter(i => i.adjustment_needed !== 'optimal').length,
    avg_days_of_stock: avgDaysOfStock,
    total_projected_spend_30d: Math.round(totalProjectedSpend),
  }

  const response: AnalyticsResponse = {
    consumption_projections: consumptionProjections.slice(0, 50),
    ideal_inventory: idealInventory.slice(0, 50),
    price_history: priceHistory.slice(0, 50),
    price_anomalies: priceAnomalies.slice(0, 30),
    summary,
  }

  return NextResponse.json(response)
})

// ── Advanced Anomaly Detection ──
async function detectAnomalies(supabase: any, centreId: string | null) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // 1. Price anomalies: recent PO rates vs historical average (>10% deviation)
  const { data: recentPOs } = await supabase
    .from('purchase_order_items')
    .select('item_id, rate, po:purchase_orders!inner(po_date, po_number, vendor:vendors(legal_name))')
    .gte('po.po_date', thirtyDaysAgo.toISOString().split('T')[0])
    .limit(500)

  const { data: historicalRates } = await supabase
    .from('purchase_order_items')
    .select('item_id, rate')
    .lt('po.po_date', thirtyDaysAgo.toISOString().split('T')[0])
    .limit(5000)

  // Group historical by item
  const itemAvgRates: Record<string, { sum: number; count: number }> = {}
  for (const hr of historicalRates || []) {
    if (!itemAvgRates[hr.item_id]) itemAvgRates[hr.item_id] = { sum: 0, count: 0 }
    itemAvgRates[hr.item_id].sum += hr.rate
    itemAvgRates[hr.item_id].count++
  }

  const priceAnomalies = (recentPOs || [])
    .filter((po: any) => {
      const avg = itemAvgRates[po.item_id]
      if (!avg || avg.count < 2) return false
      const mean = avg.sum / avg.count
      return Math.abs(po.rate - mean) / mean > 0.1 // >10% deviation
    })
    .map((po: any) => {
      const avg = itemAvgRates[po.item_id]
      const mean = avg.sum / avg.count
      const poData = Array.isArray(po.po) ? po.po[0] : po.po
      const vendor = poData?.vendor
      const vendorData = Array.isArray(vendor) ? vendor[0] : vendor
      return {
        type: 'price_spike',
        item_id: po.item_id,
        po_number: poData?.po_number,
        vendor: vendorData?.legal_name,
        current_rate: po.rate,
        avg_rate: Math.round(mean * 100) / 100,
        deviation_pct: Math.round(((po.rate - mean) / mean) * 100),
      }
    })
    .slice(0, 20)

  // 2. Volume anomalies: items ordered >2x monthly average
  const { data: monthlyOrders } = await supabase
    .from('purchase_order_items')
    .select('item_id, ordered_qty, po:purchase_orders!inner(po_date)')
    .gte('po.po_date', new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0])
    .limit(5000)

  const monthlyQty: Record<string, number[]> = {}
  for (const o of monthlyOrders || []) {
    if (!monthlyQty[o.item_id]) monthlyQty[o.item_id] = []
    monthlyQty[o.item_id].push(o.ordered_qty)
  }

  const volumeAnomalies: any[] = []
  for (const [itemId, qtys] of Object.entries(monthlyQty)) {
    if (qtys.length < 3) continue
    const avg = qtys.slice(0, -1).reduce((a, b) => a + b, 0) / (qtys.length - 1)
    const latest = qtys[qtys.length - 1]
    if (latest > avg * 2 && avg > 0) {
      volumeAnomalies.push({
        type: 'volume_spike',
        item_id: itemId,
        latest_qty: latest,
        avg_qty: Math.round(avg),
        multiplier: Math.round((latest / avg) * 10) / 10,
      })
    }
  }

  // 3. Vendor concentration: categories with >80% to single vendor
  const { data: categorySpend } = await supabase
    .from('purchase_orders')
    .select('vendor_id, total_amount, vendor:vendors(legal_name, category:vendor_categories(name))')
    .in('status', ['approved', 'sent_to_vendor', 'fully_received'])
    .gte('po_date', new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0])
    .limit(2000)

  const catVendorSpend: Record<string, Record<string, { amount: number; name: string }>> = {}
  for (const po of categorySpend || []) {
    const vendor = Array.isArray(po.vendor) ? po.vendor[0] : po.vendor
    const cat = vendor?.category
    const catData = Array.isArray(cat) ? cat[0] : cat
    const catName = catData?.name || 'Uncategorized'
    if (!catVendorSpend[catName]) catVendorSpend[catName] = {}
    if (!catVendorSpend[catName][po.vendor_id]) catVendorSpend[catName][po.vendor_id] = { amount: 0, name: vendor?.legal_name || '' }
    catVendorSpend[catName][po.vendor_id].amount += po.total_amount || 0
  }

  const concentrationRisks: any[] = []
  for (const [category, vendors] of Object.entries(catVendorSpend)) {
    const total = Object.values(vendors).reduce((s, v) => s + v.amount, 0)
    if (total === 0) continue
    for (const [vendorId, vendor] of Object.entries(vendors)) {
      const pct = (vendor.amount / total) * 100
      if (pct > 80) {
        concentrationRisks.push({
          type: 'vendor_concentration',
          category,
          vendor_id: vendorId,
          vendor_name: vendor.name,
          spend_pct: Math.round(pct),
          total_spend: total,
        })
      }
    }
  }

  // 4. Duplicate invoice detection: same vendor + similar amount within 7 days
  const { data: recentInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_ref, vendor_invoice_no, vendor_id, total_amount, vendor_invoice_date, vendor:vendors(legal_name)')
    .gte('vendor_invoice_date', sevenDaysAgo.toISOString().split('T')[0])
    .order('vendor_id')
    .limit(500)

  const potentialDuplicates: any[] = []
  const invoicesByVendor: Record<string, any[]> = {}
  for (const inv of recentInvoices || []) {
    if (!invoicesByVendor[inv.vendor_id]) invoicesByVendor[inv.vendor_id] = []
    invoicesByVendor[inv.vendor_id].push(inv)
  }

  for (const [, invs] of Object.entries(invoicesByVendor)) {
    for (let i = 0; i < invs.length; i++) {
      for (let j = i + 1; j < invs.length; j++) {
        const diff = Math.abs(invs[i].total_amount - invs[j].total_amount)
        if (diff < invs[i].total_amount * 0.02) { // within 2% amount
          const vendor = Array.isArray(invs[i].vendor) ? invs[i].vendor[0] : invs[i].vendor
          potentialDuplicates.push({
            type: 'potential_duplicate',
            vendor_name: vendor?.legal_name,
            invoice_1: invs[i].invoice_ref,
            invoice_2: invs[j].invoice_ref,
            amount_1: invs[i].total_amount,
            amount_2: invs[j].total_amount,
          })
        }
      }
    }
  }

  return NextResponse.json({
    anomalies: {
      price_spikes: priceAnomalies,
      volume_spikes: volumeAnomalies.slice(0, 15),
      vendor_concentration: concentrationRisks,
      potential_duplicates: potentialDuplicates.slice(0, 10),
    },
    summary: {
      price_anomalies: priceAnomalies.length,
      volume_anomalies: volumeAnomalies.length,
      concentration_risks: concentrationRisks.length,
      potential_duplicates: potentialDuplicates.length,
      total_alerts: priceAnomalies.length + volumeAnomalies.length + concentrationRisks.length + potentialDuplicates.length,
    },
  })
}
