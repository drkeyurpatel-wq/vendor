import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatDate, formatCurrency, PAYMENT_STATUS_COLORS, MATCH_STATUS_COLORS } from '@/lib/utils'
import { Package, AlertTriangle, FileText, Plus } from 'lucide-react'
import Pagination from '@/components/ui/Pagination'

const PAYMENT_STATUSES = [
  { value: '', label: 'All' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'disputed', label: 'Disputed' },
  { value: 'on_hold', label: 'On Hold' },
]

const PAGE_SIZE = 50

export default async function VendorInvoicesPage({
  searchParams,
}: {
  searchParams: { page?: string; payment_status?: string }
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, centre_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'vendor') {
    return (
      <div className="card p-12 text-center">
        <Package size={40} className="mx-auto mb-3 text-gray-300" />
        <p className="font-medium text-gray-500">Vendor Portal</p>
        <p className="text-sm text-gray-400 mt-1">This page is only accessible to vendor users</p>
      </div>
    )
  }

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, vendor_code, legal_name')
    .eq('primary_contact_email', user.email)
    .single()

  if (!vendor) {
    return (
      <div className="card p-12 text-center">
        <AlertTriangle size={40} className="mx-auto mb-3 text-yellow-400" />
        <p className="font-medium text-gray-500">Vendor Profile Not Found</p>
        <p className="text-sm text-gray-400 mt-1">No vendor profile is linked to your email. Contact the admin.</p>
      </div>
    )
  }

  const currentPage = parseInt(searchParams.page || '1', 10)
  const paymentFilter = searchParams.payment_status || ''

  // Count
  let countQuery = supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('vendor_id', vendor.id)

  if (paymentFilter) {
    countQuery = countQuery.eq('payment_status', paymentFilter)
  }

  const { count: totalCount } = await countQuery

  // Data
  let dataQuery = supabase
    .from('invoices')
    .select(`
      id, invoice_ref, vendor_invoice_no, vendor_invoice_date, total_amount, paid_amount, due_date,
      payment_status, match_status, net_payable,
      po:purchase_orders(po_number),
      grn:grns(grn_number),
      centre:centres(code)
    `)
    .eq('vendor_id', vendor.id)

  if (paymentFilter) {
    dataQuery = dataQuery.eq('payment_status', paymentFilter)
  }

  const { data: invoices } = await dataQuery
    .order('created_at', { ascending: false })
    .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1)

  function buildFilterUrl(params: Record<string, string>) {
    const sp = new URLSearchParams()
    const merged = { payment_status: paymentFilter, ...params }
    Object.entries(merged).forEach(([k, v]) => {
      if (v) sp.set(k, v)
    })
    return `/vendor-portal/invoices?${sp.toString()}`
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">{vendor.legal_name} ({vendor.vendor_code})</p>
        </div>
        <Link href="/vendor-portal/invoices/upload" className="btn-primary text-sm flex items-center gap-2">
          <Plus size={16} />
          Upload Invoice
        </Link>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {PAYMENT_STATUSES.map((s) => (
          <Link
            key={s.value}
            href={buildFilterUrl({ payment_status: s.value, page: '' })}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors border',
              paymentFilter === s.value
                ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#0D7E8A] hover:text-[#0D7E8A]'
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {invoices && invoices.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice Ref</th>
                    <th>Vendor Invoice</th>
                    <th>Date</th>
                    <th>PO</th>
                    <th>GRN</th>
                    <th className="text-right">Amount</th>
                    <th className="text-right">Paid</th>
                    <th className="text-right">Balance</th>
                    <th>Due Date</th>
                    <th>Payment</th>
                    <th>Match</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => {
                    const balance = (inv.total_amount || 0) - (inv.paid_amount || 0)
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td>
                          <span className="font-mono text-xs font-semibold text-[#0D7E8A]">{inv.invoice_ref}</span>
                        </td>
                        <td className="text-sm text-gray-600">{inv.vendor_invoice_no}</td>
                        <td className="text-sm text-gray-600">{formatDate(inv.vendor_invoice_date)}</td>
                        <td>
                          {inv.po?.po_number ? (
                            <span className="font-mono text-xs text-gray-500">{inv.po.po_number}</span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td>
                          {inv.grn?.grn_number ? (
                            <span className="font-mono text-xs text-gray-500">{inv.grn.grn_number}</span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="text-sm text-right font-semibold">{formatCurrency(inv.total_amount)}</td>
                        <td className="text-sm text-right text-green-600">{formatCurrency(inv.paid_amount || 0)}</td>
                        <td className="text-sm text-right font-semibold">
                          {balance > 0 ? (
                            <span className="text-red-600">{formatCurrency(balance)}</span>
                          ) : (
                            <span className="text-green-600">{formatCurrency(0)}</span>
                          )}
                        </td>
                        <td className="text-sm text-gray-600">{formatDate(inv.due_date)}</td>
                        <td>
                          <span className={cn('badge', PAYMENT_STATUS_COLORS[inv.payment_status as keyof typeof PAYMENT_STATUS_COLORS])}>
                            {inv.payment_status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          <span className={cn('badge', MATCH_STATUS_COLORS[inv.match_status as keyof typeof MATCH_STATUS_COLORS])}>
                            {inv.match_status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination totalCount={totalCount ?? 0} pageSize={PAGE_SIZE} currentPage={currentPage} />
          </>
        ) : (
          <div className="empty-state">
            <FileText size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No invoices found</p>
            <p className="text-sm text-gray-400 mt-1">
              {paymentFilter ? 'Try adjusting your filter' : 'Upload your first invoice to get started'}
            </p>
            <Link href="/vendor-portal/invoices/upload" className="btn-primary text-sm mt-4 inline-flex items-center gap-2">
              <Plus size={16} />
              Upload Invoice
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
