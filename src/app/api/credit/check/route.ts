import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Credit period enforcement API
 * Checks if a vendor has exceeded their credit limit or has overdue invoices.
 * Supports GET /api/credit/check?vendor_id=xxx and POST with { vendor_id }.
 * Returns { blocked, warning, reason, ... }
 */

async function checkCredit(vendorId: string) {
  const supabase = await createClient()

  // Get vendor credit details
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, legal_name, credit_period_days, credit_limit, status')
    .eq('id', vendorId)
    .single()

  if (!vendor) {
    return { error: 'Vendor not found', status: 404 }
  }

  if (vendor.status === 'blacklisted') {
    return {
      blocked: true,
      warning: null,
      reason: 'Vendor is blacklisted',
      vendor_name: vendor.legal_name,
    }
  }

  if (vendor.status !== 'active') {
    return {
      blocked: true,
      warning: null,
      reason: `Vendor status is "${vendor.status}" — only active vendors allowed`,
      vendor_name: vendor.legal_name,
    }
  }

  // Check for overdue invoices
  const today = new Date().toISOString().split('T')[0]
  const { data: overdueInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_ref, total_amount, paid_amount, due_date')
    .eq('vendor_id', vendorId)
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
    .eq('vendor_id', vendorId)
    .in('payment_status', ['unpaid', 'partial'])

  const totalOutstanding = allUnpaid?.reduce(
    (s, i: any) => s + ((i.total_amount || 0) - (i.paid_amount || 0)), 0
  ) ?? 0

  let blocked = false
  let warning: string | null = null
  let reason: string | null = null

  if (overdueCount > 0) {
    warning = `${overdueCount} overdue invoice(s) totalling ₹${overdueAmount.toLocaleString('en-IN')}`
    if (overdueCount > 3 || (vendor.credit_limit && overdueAmount > vendor.credit_limit * 0.5)) {
      blocked = true
      reason = `Too many overdue invoices (${overdueCount}) — resolve before proceeding`
    }
  }

  if (vendor.credit_limit && totalOutstanding >= vendor.credit_limit) {
    blocked = true
    reason = `Outstanding ₹${totalOutstanding.toLocaleString('en-IN')} exceeds credit limit ₹${vendor.credit_limit.toLocaleString('en-IN')}`
  }

  return {
    blocked,
    warning,
    reason,
    vendor_name: vendor.legal_name,
    credit_period_days: vendor.credit_period_days,
    credit_limit: vendor.credit_limit,
    total_outstanding: totalOutstanding,
    overdue_count: overdueCount,
    overdue_amount: overdueAmount,
  }
}

export async function GET(req: NextRequest) {
  const vendorId = req.nextUrl.searchParams.get('vendor_id')
  if (!vendorId) {
    return NextResponse.json({ error: 'vendor_id required' }, { status: 400 })
  }
  const result = await checkCredit(vendorId)
  if ('status' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const { vendor_id } = await req.json()
  if (!vendor_id) {
    return NextResponse.json({ error: 'vendor_id required' }, { status: 400 })
  }
  const result = await checkCredit(vendor_id)
  if ('status' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  return NextResponse.json(result)
}
