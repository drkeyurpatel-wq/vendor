import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatLakhs, formatDate, cn } from '@/lib/utils'
import { PO_STATUS_COLORS, MATCH_STATUS_COLORS } from '@/lib/utils'
import {
  AlertTriangle, CheckCircle, Clock, IndianRupee,
  Shield, FileText, FileCheck, PackageCheck, BarChart3
} from 'lucide-react'
import { StatCard, QuickAction, SectionHeader, PORow, EmptyRow } from './DashboardHelpers'

export default async function UnitCAODashboard({ profile }: { profile: any }) {
  const supabase = await createClient()
  const centreId = profile.centre_id
  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [
    { data: mtdPOs },
    { data: pendingPOs },
    { data: pendingInvoices },
    { data: recentGRNs },
    { count: invoicesToVerify },
    { data: unpaidInvoices },
  ] = await Promise.all([
    supabase.from('purchase_orders')
      .select('total_amount')
      .eq('centre_id', centreId)
      .gte('po_date', monthStart)
      .is('deleted_at', null)
      .not('status', 'eq', 'cancelled'),
    supabase.from('purchase_orders')
      .select('*, vendor:vendors(legal_name), centre:centres(code,name)')
      .eq('centre_id', centreId)
      .eq('status', 'pending_approval')
      .gte('total_amount', 50000)
      .lte('total_amount', 200000)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('invoices')
      .select('*, vendor:vendors(legal_name), centre:centres(code)')
      .eq('centre_id', centreId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('grns')
      .select('*, vendor:vendors(legal_name), po:purchase_orders(po_number)')
      .eq('centre_id', centreId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('centre_id', centreId)
      .eq('match_status', 'pending'),
    supabase.from('invoices')
      .select('total_amount, due_date')
      .eq('centre_id', centreId)
      .eq('payment_status', 'unpaid')
      .lte('due_date', today),
  ])

  const unitSpendMTD = (mtdPOs || []).reduce((sum: number, po: any) => sum + (po.total_amount || 0), 0)
  const pendingApprovalCount = pendingPOs?.length ?? 0
  const paymentDue = (unpaidInvoices || []).reduce((sum: number, inv: any) => sum + (inv.total_amount || 0), 0)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{profile.centre?.name || 'Unit'} Finance Dashboard</h1>
          <p className="page-subtitle">
            {formatDate(new Date())} · Welcome back, {profile.full_name.split(' ')[0]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <QuickAction href="/purchase-orders?status=pending_approval" icon={<Shield size={16} />} label="Approve POs" variant="primary" />
          <QuickAction href="/finance/invoices" icon={<FileCheck size={16} />} label="Verify Invoices" variant="navy" />
          <QuickAction href="/reports" icon={<BarChart3 size={16} />} label="Unit Reports" variant="secondary" />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Unit Spend (MTD)"
          value={formatLakhs(unitSpendMTD)}
          sub={`${profile.centre?.code || ''} this month`}
          icon={<IndianRupee size={22} className="text-[#1B3A6B]" />}
          bg="bg-[#EEF2F9]"
          href="/reports"
        />
        <StatCard
          label="Pending Approvals"
          value={pendingApprovalCount}
          sub="₹50K–₹2L range"
          icon={<Clock size={22} className="text-orange-600" />}
          bg="bg-orange-50"
          href="/purchase-orders?status=pending_approval"
          alert={pendingApprovalCount > 0}
        />
        <StatCard
          label="Invoices to Verify"
          value={invoicesToVerify ?? 0}
          sub="Awaiting 3-way match"
          icon={<FileText size={22} className="text-[#0D7E8A]" />}
          bg="bg-[#E6F5F6]"
          href="/finance/invoices"
          alert={(invoicesToVerify ?? 0) > 0}
        />
        <StatCard
          label="Payment Due"
          value={formatLakhs(paymentDue)}
          sub="Overdue unpaid invoices"
          icon={<AlertTriangle size={22} className="text-red-600" />}
          bg="bg-red-50"
          href="/finance/credit"
          alert={paymentDue > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending POs */}
        <div className="card">
          <SectionHeader title="POs Awaiting Your Approval" href="/purchase-orders?status=pending_approval" icon={<Shield size={16} className="text-orange-500" />} />
          <div className="divide-y divide-gray-100">
            {pendingPOs && pendingPOs.length > 0 ? (
              pendingPOs.map((po: any) => <PORow key={po.id} po={po} />)
            ) : (
              <EmptyRow icon={<CheckCircle size={32} className="text-green-400" />} message="No POs pending approval" />
            )}
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="card">
          <SectionHeader title="Pending Invoices" href="/finance/invoices" icon={<FileText size={16} className="text-[#0D7E8A]" />} />
          <div className="divide-y divide-gray-100">
            {pendingInvoices && pendingInvoices.length > 0 ? (
              pendingInvoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center px-5 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{inv.vendor?.legal_name}</span>
                      <span className={cn('badge', MATCH_STATUS_COLORS[inv.match_status as keyof typeof MATCH_STATUS_COLORS])}>
                        {inv.match_status?.replace(/_/g, ' ')}
                      </span>
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
              <EmptyRow icon={<CheckCircle size={32} className="text-green-400" />} message="No pending invoices" />
            )}
          </div>
        </div>

        {/* Recent GRNs */}
        <div className="card lg:col-span-2">
          <SectionHeader title="Recent GRNs" href="/grn" icon={<PackageCheck size={16} className="text-green-600" />} />
          <div className="divide-y divide-gray-100">
            {recentGRNs && recentGRNs.length > 0 ? (
              recentGRNs.map((grn: any) => (
                <Link key={grn.id} href={`/grn/${grn.id}`}
                  className="flex items-center px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{grn.grn_number}</span>
                      <span className={cn('badge',
                        grn.status === 'submitted' ? 'bg-green-100 text-green-800' :
                        grn.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-700'
                      )}>
                        {grn.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {grn.vendor?.legal_name} · PO: {grn.po?.po_number}
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-gray-800 ml-4">
                    {formatLakhs(grn.total_amount)}
                  </div>
                </Link>
              ))
            ) : (
              <EmptyRow icon={<PackageCheck size={32} className="text-gray-300" />} message="No recent GRNs" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// UNIT PURCHASE MANAGER — POs, indents, vendor management
// ═══════════════════════════════════════════════════════════════

