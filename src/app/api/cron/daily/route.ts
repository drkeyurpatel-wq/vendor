import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================
// H1 VPMS — Combined Daily Cron
// Runs both document expiry check and auto-reorder in one call
// Vercel Hobby plan only allows 1 cron job
// ============================================================

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'

  // Allow Vercel cron or Bearer token auth
  if (!isVercelCron && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, any> = {}
  const baseUrl = request.nextUrl.origin

  // 1. Document expiry check
  try {
    const res = await fetch(`${baseUrl}/api/documents/expiry-check`, {
      headers: { 'Authorization': `Bearer ${cronSecret}` },
    })
    results.expiry_check = { status: res.status, ok: res.ok }
    if (res.ok) {
      results.expiry_check.data = await res.json()
    }
  } catch (err: any) {
    results.expiry_check = { error: err.message }
  }

  // 2. Auto-reorder (only Mon-Sat)
  const day = new Date().getDay() // 0=Sun, 6=Sat
  if (day >= 1 && day <= 6) {
    try {
      const res = await fetch(`${baseUrl}/api/reorder`, {
        headers: { 'Authorization': `Bearer ${cronSecret}` },
      })
      results.reorder = { status: res.status, ok: res.ok }
      if (res.ok) {
        results.reorder.data = await res.json()
      }
    } catch (err: any) {
      results.reorder = { error: err.message }
    }
  } else {
    results.reorder = { skipped: 'Sunday — no reorder' }
  }

  // 3. Batch 3-way match on pending invoices
  try {
    const res = await fetch(`${baseUrl}/api/invoices/batch-match`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${cronSecret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    results.batch_match = { status: res.status, ok: res.ok }
    if (res.ok) results.batch_match.data = await res.json()
  } catch (err: any) {
    results.batch_match = { error: err.message }
  }

  // 4. Vendor scorecard computation (1st of month)
  const dateOfMonth = new Date().getDate()

  // 5. Approval SLA escalation check (daily)
  try {
    const res = await fetch(`${baseUrl}/api/approvals/escalate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${cronSecret}` },
    })
    results.sla_escalation = { status: res.status, ok: res.ok }
    if (res.ok) results.sla_escalation.data = await res.json()
  } catch (err: any) {
    results.sla_escalation = { error: err.message }
  }

  // 6. Vendor scorecard (1st of month only)
  if (dateOfMonth === 1) {
    try {
      const res = await fetch(`${baseUrl}/api/vendors/compute-scores`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${cronSecret}` },
      })
      results.vendor_scores = { status: res.status, ok: res.ok }
      if (res.ok) results.vendor_scores.data = await res.json()
    } catch (err: any) {
      results.vendor_scores = { error: err.message }
    }
  } else {
    results.vendor_scores = { skipped: 'Runs on 1st of month' }
  }

  // 7. Payment due reminders — flag invoices due in next 3 days
  try {
    const supabase = await createClient()
    const threeDaysFromNow = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
    const today = new Date().toISOString().split('T')[0]

    const { data: dueSoon } = await supabase.from('invoices')
      .select('id, invoice_ref, total_amount, due_date, vendor:vendors(legal_name)')
      .eq('payment_status', 'unpaid')
      .gte('due_date', today)
      .lte('due_date', threeDaysFromNow)
      .limit(50)

    if (dueSoon && dueSoon.length > 0) {
      // Create notifications for upcoming payments
      const notifications = dueSoon.map((inv: any) => ({
        action: 'payment_due_reminder',
        entity_type: 'invoice',
        entity_id: inv.id,
        details: {
          invoice_ref: inv.invoice_ref,
          amount: inv.total_amount,
          due_date: inv.due_date,
          vendor: inv.vendor?.legal_name,
        },
        is_read: false,
      }))
      await supabase.from('notifications').insert(notifications)
      results.payment_reminders = { sent: dueSoon.length, total_amount: dueSoon.reduce((s: number, i: any) => s + (i.total_amount || 0), 0) }
    } else {
      results.payment_reminders = { sent: 0, message: 'No payments due in next 3 days' }
    }
  } catch (err: any) {
    results.payment_reminders = { error: err.message }
  }

  return NextResponse.json({
    message: 'Daily cron completed',
    timestamp: new Date().toISOString(),
    results,
  })
}
