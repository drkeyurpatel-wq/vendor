import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 20, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const vendorId = request.nextUrl.searchParams.get('vendor_id')
  const months = Math.min(parseInt(request.nextUrl.searchParams.get('months') || '6'), 24)

  if (!vendorId) {
    return NextResponse.json({ error: 'vendor_id required' }, { status: 400 })
  }

  const startDate = format(startOfMonth(subMonths(new Date(), months)), 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('vendor_performance')
    .select('*')
    .eq('vendor_id', vendorId)
    .gte('month', startDate)
    .order('month', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 20, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { vendor_id, month } = body

  if (!vendor_id || !month) {
    return NextResponse.json({ error: 'vendor_id and month required' }, { status: 400 })
  }

  const monthStart = format(startOfMonth(new Date(month)), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(new Date(month)), 'yyyy-MM-dd')

  // Calculate delivery score: on-time GRNs / total GRNs
  const { data: grns } = await supabase
    .from('grns')
    .select('id, grn_date, po:purchase_orders(expected_delivery_date)')
    .eq('vendor_id', vendor_id)
    .gte('grn_date', monthStart)
    .lte('grn_date', monthEnd)
    .in('status', ['submitted', 'verified'])

  let deliveryScore = 100
  if (grns && grns.length > 0) {
    const onTime = grns.filter((g: any) => {
      const expected = g.po?.expected_delivery_date
      if (!expected) return true
      return new Date(g.grn_date) <= new Date(expected)
    }).length
    deliveryScore = Math.round((onTime / grns.length) * 100)
  }

  // Calculate quality score: accepted qty / received qty
  const { data: grnItems } = await supabase
    .from('grn_items')
    .select('received_qty, accepted_qty, grn:grns!inner(vendor_id, grn_date)')
    .eq('grn.vendor_id', vendor_id)
    .gte('grn.grn_date', monthStart)
    .lte('grn.grn_date', monthEnd)

  let qualityScore = 100
  if (grnItems && grnItems.length > 0) {
    const totalReceived = grnItems.reduce((s: number, i: any) => s + (i.received_qty || 0), 0)
    const totalAccepted = grnItems.reduce((s: number, i: any) => s + (i.accepted_qty || i.received_qty || 0), 0)
    qualityScore = totalReceived > 0 ? Math.round((totalAccepted / totalReceived) * 100) : 100
  }

  // Calculate price score: compare PO rates against rate contracts
  const { data: poItems } = await supabase
    .from('purchase_order_items')
    .select('item_id, unit_price, po:purchase_orders!inner(vendor_id, order_date)')
    .eq('po.vendor_id', vendor_id)
    .gte('po.order_date', monthStart)
    .lte('po.order_date', monthEnd)

  let priceScore = 100
  if (poItems && poItems.length > 0) {
    const { data: contracts } = await supabase
      .from('rate_contract_items')
      .select('item_id, rate, contract:rate_contracts!inner(vendor_id, status)')
      .eq('contract.vendor_id', vendor_id)
      .eq('contract.status', 'active')

    if (contracts && contracts.length > 0) {
      const rateMap = new Map<string, number>()
      contracts.forEach((c: any) => rateMap.set(c.item_id, c.rate))

      let totalDeviation = 0
      let compared = 0
      poItems.forEach((p: any) => {
        const contractRate = rateMap.get(p.item_id)
        if (contractRate && contractRate > 0) {
          totalDeviation += Math.abs((p.unit_price - contractRate) / contractRate) * 100
          compared++
        }
      })
      if (compared > 0) {
        priceScore = Math.max(0, Math.round(100 - (totalDeviation / compared)))
      }
    }
  }

  // Calculate service score: base 70 + bonuses
  let serviceScore = 70
  const { count: rejectedGrns } = await supabase
    .from('grns')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendor_id)
    .eq('status', 'rejected')
    .gte('grn_date', monthStart)
    .lte('grn_date', monthEnd)

  if (!rejectedGrns || rejectedGrns === 0) serviceScore += 10

  const { count: disputedInvoices } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendor_id)
    .eq('payment_status', 'disputed')
    .gte('vendor_invoice_date', monthStart)
    .lte('vendor_invoice_date', monthEnd)

  if (!disputedInvoices || disputedInvoices === 0) serviceScore += 10

  const { count: mismatchedInvoices } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendor_id)
    .eq('match_status', 'mismatch')
    .gte('vendor_invoice_date', monthStart)
    .lte('vendor_invoice_date', monthEnd)

  if (!mismatchedInvoices || mismatchedInvoices === 0) serviceScore += 10

  // Weighted overall: delivery 30%, quality 30%, price 20%, service 20%
  const overallScore = Math.round(
    deliveryScore * 0.3 + qualityScore * 0.3 + priceScore * 0.2 + serviceScore * 0.2
  )

  // Upsert into vendor_performance
  const { data: existing } = await supabase
    .from('vendor_performance')
    .select('id')
    .eq('vendor_id', vendor_id)
    .eq('month', monthStart)
    .single()

  const record = {
    vendor_id,
    month: monthStart,
    delivery_score: deliveryScore,
    quality_score: qualityScore,
    price_score: priceScore,
    service_score: serviceScore,
    overall_score: overallScore,
  }

  let result
  if (existing) {
    const { data, error } = await supabase
      .from('vendor_performance')
      .update(record)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  } else {
    const { data, error } = await supabase
      .from('vendor_performance')
      .insert(record)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    result = data
  }

  // Log activity
  await supabase.from('activity_log').insert({
    user_id: user.id,
    action: 'vendor_performance_calculated',
    entity_type: 'vendor_performance',
    entity_id: result.id,
    details: {
      vendor_id,
      month: monthStart,
      delivery_score: deliveryScore,
      quality_score: qualityScore,
      price_score: priceScore,
      service_score: serviceScore,
      overall_score: overallScore,
    },
  })

  return NextResponse.json({
    data: result,
    breakdown: {
      delivery: { score: deliveryScore, weight: '30%', grns_count: grns?.length ?? 0 },
      quality: { score: qualityScore, weight: '30%', items_checked: grnItems?.length ?? 0 },
      price: { score: priceScore, weight: '20%', items_compared: poItems?.length ?? 0 },
      service: { score: serviceScore, weight: '20%' },
      overall: overallScore,
    },
  })
}
