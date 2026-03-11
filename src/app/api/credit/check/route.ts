import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Credit period enforcement API
 * Checks if a vendor has exceeded their credit limit or has overdue invoices
 * Called before creating new POs for a vendor
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { vendor_id } = await req.json()

  if (!vendor_id) {
    return NextResponse.json({ error: 'vendor_id required' }, { status: 400 })
  }

  // Get vendor credit details
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, legal_name, credit_period_days, credit_limit, status')
    .eq('id', vendor_id)
    .single()

  if (!vendor) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
  }

  if (vendor.status === 'blacklisted') {
    return NextResponse.json({
      allowed: false,
      reason: 'Vendor is blacklisted and cannot receive new purchase orders',
      vendor_name: vendor.legal_name,
    })
  }

  if (vendor.status !== 'active') {
    return NextResponse.json({
      allowed: false,
      reason: `Vendor status is "${vendor.status}" — only active vendors can receive POs`,
      vendor_name: vendor.legal_name,
    })
  }

  // Check for overdue invoices (due_date passed and not fully paid)
  const today = new Date().toISOString().split('T')[0]
  const { data: overdueInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_ref, total_amount, paid_amount, due_date')
    .eq('vendor_id', vendor_id)
    .in('payment_status', ['unpaid', 'partial'])
    .lt('due_date', today)

  const overdueCount = overdueInvoices?.length ?? 0
  const overdueAmount = overdueInvoices?.reduce(
    (s, i: any) => s + ((i.total_amount || 0) - (i.paid_amount || 0)), 0
  ) ?? 0

  // Check total outstanding against credit limit
  const { data: allUnpaid } = await supabase
    .from('invoices')
    .select('total_amount, paid_amount')
    .eq('vendor_id', vendor_id)
    .in('payment_status', ['unpaid', 'partial'])

  const totalOutstanding = allUnpaid?.reduce(
    (s, i: any) => s + ((i.total_amount || 0) - (i.paid_amount || 0)), 0
  ) ?? 0

  const warnings: string[] = []
  let allowed = true

  if (overdueCount > 0) {
    warnings.push(`${overdueCount} overdue invoice(s) totalling ₹${overdueAmount.toLocaleString('en-IN')}`)
    // Block if more than 3 overdue or overdue amount > 50% of credit limit
    if (overdueCount > 3 || (vendor.credit_limit && overdueAmount > vendor.credit_limit * 0.5)) {
      allowed = false
    }
  }

  if (vendor.credit_limit && totalOutstanding >= vendor.credit_limit) {
    warnings.push(`Outstanding amount ₹${totalOutstanding.toLocaleString('en-IN')} exceeds credit limit ₹${vendor.credit_limit.toLocaleString('en-IN')}`)
    allowed = false
  }

  return NextResponse.json({
    allowed,
    warnings,
    reason: allowed ? null : 'Credit check failed — resolve outstanding issues before creating new POs',
    vendor_name: vendor.legal_name,
    credit_period_days: vendor.credit_period_days,
    credit_limit: vendor.credit_limit,
    total_outstanding: totalOutstanding,
    overdue_count: overdueCount,
    overdue_amount: overdueAmount,
  })
}
