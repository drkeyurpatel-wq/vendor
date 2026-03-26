import { requireApiAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { RATE_TOLERANCE } from '@/lib/business-rules'

// ============================================================
// H1 VPMS — Rate Contract Validation API
// Called during PO creation to enforce contract pricing
// Business rule: PO rate must match within ±0.5% of contract rate
// ============================================================

interface ValidationItem {
  item_id: string
  proposed_rate: number
  vendor_id: string
}

interface ValidationResult {
  item_id: string
  valid: boolean
  contract_rate: number | null
  proposed_rate: number
  deviation_percent: number | null
  l_rank: number | null
  contract_number: string | null
  message: string
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, 30, 60000)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { supabase, user, userId } = await requireApiAuth()
  let body: { items: ValidationItem[]; centre_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'items array required' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]
  const results: ValidationResult[] = []

  for (const item of body.items) {
    // Find active contract for this vendor + item
    let query = supabase
      .from('rate_contract_items')
      .select(`
        rate, l_rank, unit, gst_percent,
        contract:rate_contracts!inner(
          id, contract_number, vendor_id, centre_id, status, valid_from, valid_to
        )
      `)
      .eq('item_id', item.item_id)
      .eq('contract.vendor_id', item.vendor_id)
      .eq('contract.status', 'active')
      .lte('contract.valid_from', today)
      .gte('contract.valid_to', today)

    if (body.centre_id) {
      query = query.or(`contract.centre_id.eq.${body.centre_id},contract.centre_id.is.null`)
    }

    const { data: contractItems } = await query.order('l_rank').limit(1)

    if (!contractItems || contractItems.length === 0) {
      // No active contract — rate is unchecked (allowed)
      results.push({
        item_id: item.item_id,
        valid: true,
        contract_rate: null,
        proposed_rate: item.proposed_rate,
        deviation_percent: null,
        l_rank: null,
        contract_number: null,
        message: 'No active rate contract — rate accepted',
      })
      continue
    }

    const ci = contractItems[0] as any
    const contractRate = ci.rate
    const deviation = contractRate > 0
      ? (item.proposed_rate - contractRate) / contractRate
      : 0

    const withinTolerance = Math.abs(deviation) <= RATE_TOLERANCE

    results.push({
      item_id: item.item_id,
      valid: withinTolerance,
      contract_rate: contractRate,
      proposed_rate: item.proposed_rate,
      deviation_percent: Math.round(deviation * 10000) / 100, // e.g. 0.5 = 0.5%
      l_rank: ci.l_rank,
      contract_number: ci.contract?.contract_number || null,
      message: withinTolerance
        ? `Rate matches contract ${ci.contract?.contract_number} (L${ci.l_rank})`
        : `Rate deviates ${(Math.abs(deviation) * 100).toFixed(2)}% from contract rate ₹${contractRate} (tolerance ±0.5%)`,
    })
  }

  const allValid = results.every(r => r.valid)
  const violations = results.filter(r => !r.valid)

  return NextResponse.json({
    valid: allValid,
    results,
    summary: {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      violations: violations.length,
      unchecked: results.filter(r => r.contract_rate === null).length,
    },
  })
}
