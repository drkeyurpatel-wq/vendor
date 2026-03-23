import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cn, formatDate, formatLakhs, formatCurrency } from '@/lib/utils'
import { AlertTriangle, Clock, IndianRupee } from 'lucide-react'
import VendorDisputeButton from '@/components/ui/VendorDisputeButton'

function getAgingBucket(daysOverdue: number): { label: string; class: string } {
  if (daysOverdue <= 0) return { label: 'Current', class: 'bg-green-100 text-green-800' }
  if (daysOverdue <= 30) return { label: '1-30 days', class: 'bg-green-100 text-green-700' }
  if (daysOverdue <= 60) return { label: '31-60 days', class: 'bg-yellow-100 text-yellow-800' }
  if (daysOverdue <= 90) return { label: '61-90 days', class: 'bg-orange-100 text-orange-800' }
  return { label: '>90 days', class: 'bg-red-100 text-red-800' }
}

export default async function VendorOutstandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'vendor') {
    return (
      <div className="card p-12 text-center">
        <AlertTriangle size={40} className="mx-auto mb-3 text-yellow-400" />
        <p className="font-medium text-gray-500">Access Denied</p>
        <p className="text-sm text-gray-400 mt-1">This page is only accessible to vendor users</p>
      </div>
    )
  }

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, vendor_code, legal_name, credit_period_days')
    .eq('primary_contact_email', user.email)
    .single()

  if (!vendor) {
    return (
      <div className="card p-12 text-center">
        <AlertTriangle size={40} className="mx-auto mb-3 text-yellow-400" />
        <p className="font-medium text-gray-500">Vendor Profile Not Found</p>
      </div>
    )
  }

  // Fetch unpaid/partially paid invoices with GRN date for aging
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_ref, vendor_invoice_no, vendor_invoice_date, total_amount, paid_amount, due_date, payment_status, match_status, grn_id, grn:grns(grn_date), centre:centres(code)')
    .eq('vendor_id', vendor.id)
    .in('payment_status', ['unpaid', 'partial'])
    .order('due_date', { ascending: true })

  const today = new Date()
  const creditDays = vendor.credit_period_days || 30

  // Calculate aging for each invoice
  const agingData = (invoices || []).map((inv: any) => {
    const grn = Array.isArray(inv.grn) ? inv.grn[0] : inv.grn
    const centre = Array.isArray(inv.centre) ? inv.centre[0] : inv.centre
    const grnDate = grn?.grn_date ? new Date(grn.grn_date) : new Date(inv.vendor_invoice_date || inv.due_date)
    const dueDate = inv.due_date ? new Date(inv.due_date) : new Date(grnDate.getTime() + creditDays * 86400000)
    const balance = (inv.total_amount || 0) - (inv.paid_amount || 0)
    const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / 86400000)

    return {
      ...inv,
      centre,
      grn_date: grn?.grn_date,
      balance,
      daysOverdue,
      dueDate: dueDate.toISOString().split('T')[0],
      bucket: getAgingBucket(daysOverdue),
    }
  })

  // Aging buckets
  const current = agingData.filter(i => i.daysOverdue <= 0)
  const bucket30 = agingData.filter(i => i.daysOverdue > 0 && i.daysOverdue <= 30)
  const bucket60 = agingData.filter(i => i.daysOverdue > 30 && i.daysOverdue <= 60)
  const bucket90 = agingData.filter(i => i.daysOverdue > 60 && i.daysOverdue <= 90)
  const bucket90plus = agingData.filter(i => i.daysOverdue > 90)

  const sum = (items: typeof agingData) => items.reduce((s, i) => s + i.balance, 0)
  const totalOutstanding = sum(agingData)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Outstanding & Aging</h1>
          <p className="page-subtitle">{vendor.legal_name} ({vendor.vendor_code}) — Credit Period: {creditDays} days</p>
        </div>
      </div>

      {/* Aging buckets */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="stat-card border-l-4 border-[#1B3A6B]">
          <div className="text-xs text-gray-500 mb-1">Total Outstanding</div>
          <div className="text-xl font-bold text-[#1B3A6B]">{formatLakhs(totalOutstanding)}</div>
          <div className="text-xs text-gray-400">{agingData.length} invoices</div>
        </div>
        <div className="stat-card border-l-4 border-green-500">
          <div className="text-xs text-gray-500 mb-1">Current</div>
          <div className="text-lg font-bold text-green-600">{formatLakhs(sum(current))}</div>
          <div className="text-xs text-gray-400">{current.length} invoices</div>
        </div>
        <div className="stat-card border-l-4 border-yellow-500">
          <div className="text-xs text-gray-500 mb-1">31-60 Days</div>
          <div className="text-lg font-bold text-yellow-600">{formatLakhs(sum(bucket60))}</div>
          <div className="text-xs text-gray-400">{bucket60.length} invoices</div>
        </div>
        <div className="stat-card border-l-4 border-orange-500">
          <div className="text-xs text-gray-500 mb-1">61-90 Days</div>
          <div className="text-lg font-bold text-orange-600">{formatLakhs(sum(bucket90))}</div>
          <div className="text-xs text-gray-400">{bucket90.length} invoices</div>
        </div>
        <div className="stat-card border-l-4 border-red-500">
          <div className="text-xs text-gray-500 mb-1">&gt;90 Days</div>
          <div className="text-lg font-bold text-red-600">{formatLakhs(sum(bucket90plus))}</div>
          <div className="text-xs text-gray-400">{bucket90plus.length} invoices</div>
        </div>
      </div>

      {/* Aging visual bar */}
      {totalOutstanding > 0 && (
        <div className="card p-4 mb-6">
          <div className="text-sm font-medium text-gray-700 mb-2">Aging Distribution</div>
          <div className="flex h-6 rounded-lg overflow-hidden">
            {sum(current) > 0 && (
              <div className="bg-green-500 flex items-center justify-center text-white text-[10px] font-medium" style={{ width: `${(sum(current) / totalOutstanding) * 100}%` }}>
                {Math.round((sum(current) / totalOutstanding) * 100)}%
              </div>
            )}
            {sum(bucket30) > 0 && (
              <div className="bg-lime-500 flex items-center justify-center text-white text-[10px] font-medium" style={{ width: `${(sum(bucket30) / totalOutstanding) * 100}%` }}>
                {Math.round((sum(bucket30) / totalOutstanding) * 100)}%
              </div>
            )}
            {sum(bucket60) > 0 && (
              <div className="bg-yellow-500 flex items-center justify-center text-white text-[10px] font-medium" style={{ width: `${(sum(bucket60) / totalOutstanding) * 100}%` }}>
                {Math.round((sum(bucket60) / totalOutstanding) * 100)}%
              </div>
            )}
            {sum(bucket90) > 0 && (
              <div className="bg-orange-500 flex items-center justify-center text-white text-[10px] font-medium" style={{ width: `${(sum(bucket90) / totalOutstanding) * 100}%` }}>
                {Math.round((sum(bucket90) / totalOutstanding) * 100)}%
              </div>
            )}
            {sum(bucket90plus) > 0 && (
              <div className="bg-red-500 flex items-center justify-center text-white text-[10px] font-medium" style={{ width: `${(sum(bucket90plus) / totalOutstanding) * 100}%` }}>
                {Math.round((sum(bucket90plus) / totalOutstanding) * 100)}%
              </div>
            )}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>Current</span>
            <span>1-30d</span>
            <span>31-60d</span>
            <span>61-90d</span>
            <span>&gt;90d</span>
          </div>
        </div>
      )}

      {/* Invoice detail table */}
      <div className="card overflow-hidden">
        {agingData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Centre</th>
                  <th>GRN Date</th>
                  <th>Due Date</th>
                  <th className="text-right">Invoice Amount</th>
                  <th className="text-right">Paid</th>
                  <th className="text-right">Balance</th>
                  <th>Days Overdue</th>
                  <th>Aging</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {agingData.map(inv => (
                  <tr key={inv.id}>
                    <td>
                      <div className="font-mono text-xs font-semibold">{inv.invoice_ref}</div>
                      <div className="text-xs text-gray-400">{inv.vendor_invoice_no}</div>
                    </td>
                    <td><span className="badge bg-blue-50 text-blue-700">{inv.centre?.code || '—'}</span></td>
                    <td className="text-sm text-gray-600">{inv.grn_date ? formatDate(inv.grn_date) : '—'}</td>
                    <td className="text-sm text-gray-600">{formatDate(inv.dueDate)}</td>
                    <td className="text-right text-sm">{formatCurrency(inv.total_amount)}</td>
                    <td className="text-right text-sm text-green-600">{formatCurrency(inv.paid_amount || 0)}</td>
                    <td className="text-right text-sm font-bold text-red-600">{formatCurrency(inv.balance)}</td>
                    <td className={cn('text-sm font-medium text-center', inv.daysOverdue > 0 ? 'text-red-600' : 'text-green-600')}>
                      {inv.daysOverdue > 0 ? `${inv.daysOverdue}d overdue` : `${Math.abs(inv.daysOverdue)}d remaining`}
                    </td>
                    <td><span className={cn('badge', inv.bucket.class)}>{inv.bucket.label}</span></td>
                    <td><VendorDisputeButton invoiceId={inv.id} invoiceRef={inv.invoice_ref} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#EEF2F9]">
                  <td colSpan={4} className="font-semibold text-[#1B3A6B]">Total</td>
                  <td className="text-right font-bold text-[#1B3A6B]">{formatCurrency(agingData.reduce((s, i) => s + (i.total_amount || 0), 0))}</td>
                  <td className="text-right font-bold text-green-600">{formatCurrency(agingData.reduce((s, i) => s + (i.paid_amount || 0), 0))}</td>
                  <td className="text-right font-bold text-red-600">{formatCurrency(totalOutstanding)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <IndianRupee size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No outstanding invoices</p>
            <p className="text-sm text-gray-400 mt-1">All your invoices are fully paid</p>
          </div>
        )}
      </div>
    </div>
  )
}
