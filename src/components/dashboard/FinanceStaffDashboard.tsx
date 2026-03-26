import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatLakhs, formatDate, cn } from '@/lib/utils'
import { PAYMENT_STATUS_COLORS, MATCH_STATUS_COLORS } from '@/lib/utils'
import {
  AlertTriangle, CheckCircle, CreditCard, FileText,
  FileCheck, Calendar, Timer
} from 'lucide-react'
import { StatCard, QuickAction, SectionHeader, EmptyRow } from './DashboardHelpers'

export default async function FinanceStaffDashboard({ profile }: { profile: any }) {
  const supabase = await createClient()
  const centreId = profile.centre_id
  const today = new Date().toISOString().split('T')[0]

  // Next Saturday
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysUntilSat = (6 - dayOfWeek + 7) % 7 || 7
  const nextSaturday = new Date(now)
  nextSaturday.setDate(now.getDate() + daysUntilSat)
  const saturdayDate = nextSaturday.toISOString().split('T')[0]

  const centreFilter = centreId ? { centre_id: centreId } : {}

  const [
    { data: unmatchedInvoices },
    { data: saturdayPayments },
    { data: overdueInvoices },
    { count: unmatchedCount },
    { data: agingData },
    { count: debitNotesPending },
  ] = await Promise.all([
    supabase.from('invoices')
      .select('*, vendor:vendors(legal_name, vendor_code), centre:centres(code)')
      .eq('match_status', 'pending')
      .match(centreFilter)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('invoices')
      .select('*, vendor:vendors(legal_name), centre:centres(code)')
      .eq('payment_status', 'unpaid')
      .eq('match_status', 'matched')
      .lte('due_date', saturdayDate)
      .match(centreFilter)
      .order('due_date', { ascending: true })
      .limit(8),
    supabase.from('invoices')
      .select('total_amount, due_date')
      .eq('payment_status', 'unpaid')
      .lt('due_date', today)
      .match(centreFilter),
    supabase.from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('match_status', 'pending')
      .match(centreFilter),
    // For aging summary, pull all unpaid invoices
    supabase.from('invoices')
      .select('total_amount, paid_amount, due_date')
      .eq('payment_status', 'unpaid')
      .match(centreFilter),
    supabase.from('debit_notes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .match(centreFilter),
  ])

  const overdueAmount = (overdueInvoices || []).reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0)
  const saturdayTotal = (saturdayPayments || []).reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0)

  // Aging summary
  const aging = { current: 0, days_0_30: 0, days_31_60: 0, days_61_90: 0, days_90_plus: 0 }
  ;(agingData || []).forEach((inv: any) => {
    const outstanding = (inv.total_amount || 0) - (inv.paid_amount || 0)
    const dueDate = new Date(inv.due_date)
    const nowDate = new Date()
    const daysPast = Math.floor((nowDate.getTime() - dueDate.getTime()) / 86400000)
    if (daysPast <= 0) aging.current += outstanding
    else if (daysPast <= 30) aging.days_0_30 += outstanding
    else if (daysPast <= 60) aging.days_31_60 += outstanding
    else if (daysPast <= 90) aging.days_61_90 += outstanding
    else aging.days_90_plus += outstanding
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{profile.centre?.name ? `${profile.centre.name} ` : ''}Finance Dashboard</h1>
          <p className="page-subtitle">
            {formatDate(new Date())} · Welcome back, {profile.full_name.split(' ')[0]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <QuickAction href="/finance/invoices" icon={<FileCheck size={16} />} label="Match Invoices" variant="primary" />
          <QuickAction href="/finance/payments" icon={<CreditCard size={16} />} label="Payment Batch" variant="navy" />
          <QuickAction href="/finance/credit" icon={<Timer size={16} />} label="Credit Aging" variant="secondary" />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Unmatched Invoices"
          value={unmatchedCount ?? 0}
          sub="Awaiting 3-way match"
          icon={<FileText size={22} className="text-orange-600" />}
          bg="bg-orange-50"
          href="/finance/invoices"
          alert={(unmatchedCount ?? 0) > 0}
        />
        <StatCard
          label="Payment Due Saturday"
          value={formatLakhs(saturdayTotal)}
          sub={`Due by ${formatDate(nextSaturday)}`}
          icon={<Calendar size={22} className="text-[#0D7E8A]" />}
          bg="bg-[#E6F5F6]"
          href="/finance/payments"
          alert={saturdayTotal > 0}
        />
        <StatCard
          label="Overdue Amount"
          value={formatLakhs(overdueAmount)}
          sub="Past due date"
          icon={<AlertTriangle size={22} className="text-red-600" />}
          bg="bg-red-50"
          href="/finance/credit"
          alert={overdueAmount > 0}
        />
        <StatCard
          label="Debit Notes Pending"
          value={debitNotesPending ?? 0}
          sub="Awaiting processing"
          icon={<FileText size={22} className="text-[#1B3A6B]" />}
          bg="bg-[#EEF2F9]"
          href="/finance/invoices"
          alert={(debitNotesPending ?? 0) > 0}
        />
      </div>

      {/* Aging Summary */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Timer size={18} className="text-[#1B3A6B]" />
          Aging Summary
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: 'Current', value: aging.current, color: 'bg-green-50 border-green-200', text: 'text-green-700' },
            { label: '0-30 Days', value: aging.days_0_30, color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' },
            { label: '31-60 Days', value: aging.days_31_60, color: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
            { label: '61-90 Days', value: aging.days_61_90, color: 'bg-red-50 border-red-200', text: 'text-red-700' },
            { label: '90+ Days', value: aging.days_90_plus, color: 'bg-red-100 border-red-300', text: 'text-red-800' },
          ].map(bucket => (
            <div key={bucket.label} className={cn('stat-card border', bucket.color)}>
              <div className={cn('text-lg font-bold', bucket.text)}>{formatLakhs(bucket.value)}</div>
              <div className="text-xs text-gray-600 mt-1">{bucket.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoices Pending 3-Way Match */}
        <div className="card">
          <SectionHeader title="Invoices Pending 3-Way Match" href="/finance/invoices" icon={<FileCheck size={16} className="text-orange-500" />} />
          <div className="divide-y divide-gray-100">
            {unmatchedInvoices && unmatchedInvoices.length > 0 ? (
              unmatchedInvoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{inv.vendor?.legal_name}</span>
                      {inv.centre && <span className="text-xs text-gray-400">{inv.centre.code}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {inv.vendor_invoice_no} · {formatDate(inv.vendor_invoice_date)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 ml-4">
                    {formatLakhs(inv.total_amount)}
                  </div>
                </div>
              ))
            ) : (
              <EmptyRow icon={<CheckCircle size={32} className="text-green-400" />} message="All invoices matched" />
            )}
          </div>
        </div>

        {/* Saturday Payment Batch */}
        <div className="card">
          <SectionHeader title={`Saturday Payment (${formatDate(nextSaturday)})`} href="/finance/payments" icon={<CreditCard size={16} className="text-[#0D7E8A]" />} />
          <div className="divide-y divide-gray-100">
            {saturdayPayments && saturdayPayments.length > 0 ? (
              saturdayPayments.map((inv: any) => (
                <div key={inv.id} className="flex items-center px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{inv.vendor?.legal_name}</span>
                      {inv.centre && <span className="text-xs text-gray-400">{inv.centre.code}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Due {formatDate(inv.due_date)} · {inv.vendor_invoice_no}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 ml-4">
                    {formatLakhs(inv.total_amount)}
                  </div>
                </div>
              ))
            ) : (
              <EmptyRow icon={<CheckCircle size={32} className="text-green-400" />} message="No payments due this Saturday" />
            )}
            {saturdayPayments && saturdayPayments.length > 0 && (
              <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Total</span>
                <span className="text-sm font-bold text-[#1B3A6B]">{formatLakhs(saturdayTotal)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
