import { requireApiAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { analyzeDemand, type MonthlyConsumption } from '@/lib/forecasting'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, userId } = await requireApiAuth()
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('item_id')
    const centreId = searchParams.get('centre_id')

    if (!itemId) {
      return NextResponse.json({ error: 'item_id is required' }, { status: 400 })
    }

    // Fetch item details
    const { data: item } = await supabase
      .from('items')
      .select('id, item_code, generic_name, brand_name, lead_time_days, safety_stock, reorder_point, default_rate')
      .eq('id', itemId)
      .single()

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Fetch centre stock data
    let stockQuery = supabase
      .from('item_centre_stock')
      .select('*')
      .eq('item_id', itemId)

    if (centreId) {
      stockQuery = stockQuery.eq('centre_id', centreId)
    }

    const { data: stockData } = await stockQuery

    const currentStock = stockData?.reduce((sum, s) => sum + (s.current_stock || 0), 0) ?? 0
    const avgDailyConsumption = stockData?.[0]?.avg_daily_consumption ?? 0
    const leadTimeDays = stockData?.[0]?.lead_time_days ?? item.lead_time_days ?? 14

    // Fetch last 12 months of GRN data as a proxy for consumption
    // We look at GRN received quantities to estimate demand
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    let grnQuery = supabase
      .from('grn_items')
      .select(`
        received_qty,
        grn:grns(grn_date, centre_id, status)
      `)
      .eq('item_id', itemId)
      .gte('grn.grn_date', twelveMonthsAgo.toISOString().split('T')[0])

    const { data: grnItems } = await grnQuery

    // Aggregate by month
    const monthlyMap = new Map<string, number>()

    // Initialize last 12 months with 0
    for (let i = 11; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyMap.set(key, 0)
    }

    // Sum up GRN quantities by month
    for (const gi of grnItems || []) {
      const grn = gi.grn as any
      if (!grn?.grn_date) continue
      if (centreId && grn.centre_id !== centreId) continue
      if (grn.status === 'draft') continue

      const d = new Date(grn.grn_date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

      if (monthlyMap.has(key)) {
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + (gi.received_qty || 0))
      }
    }

    const historical: MonthlyConsumption[] = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, qty]) => ({ month, qty }))

    // Run forecasting analysis
    const safetyStockDays = item.safety_stock ? Math.ceil(item.safety_stock / Math.max(avgDailyConsumption, 0.1)) : 7
    const orderCost = 500 // Default order cost INR
    const holdingCost = (item.default_rate || 10) * 0.1 // 10% of item cost as holding cost

    const analysis = analyzeDemand(
      historical,
      currentStock,
      leadTimeDays,
      safetyStockDays,
      orderCost,
      holdingCost
    )

    return NextResponse.json({
      item: {
        id: item.id,
        item_code: item.item_code,
        generic_name: item.generic_name,
        brand_name: item.brand_name,
        lead_time_days: leadTimeDays,
        default_rate: item.default_rate,
      },
      current_stock: currentStock,
      stock_by_centre: stockData?.map(s => ({
        centre_id: s.centre_id,
        current_stock: s.current_stock,
        reorder_level: s.reorder_level,
        safety_stock: s.safety_stock,
        avg_daily_consumption: s.avg_daily_consumption,
        last_grn_date: s.last_grn_date,
        last_grn_rate: s.last_grn_rate,
      })),
      ...analysis,
    })
  } catch (err) {
    console.error('Forecasting failed:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
