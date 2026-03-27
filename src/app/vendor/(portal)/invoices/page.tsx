import { requireVendorAuth } from '@/lib/vendor-auth'
import Link from 'next/link'
import { cn, formatDate, formatCurrency, PAYMENT_STATUS_COLORS, MATCH_STATUS_COLORS } from '@/lib/utils'
import { FileText, Upload, Search } from 'lucide-react'

const INVOICE_STATUSES = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'disputed', label: 'Disputed' },
]

const PAYMENT_STATUSES = [
  { value: '', label: 'All Payments' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
]

const PAGE_SIZE = 50

export const dynamic = 'force-dynamic'

export default async function VendorInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; payment?: string; search?: string }>
}) {
  const params = await searchParams
  const { supabase, vendorId } = await requireVendorAuth()

  const currentPage = parseInt(params.page || '1', 10)
  const statusFilter = params.status || ''
  const paymentFilter = params.payment || ''
  const searchQuery = params.search || ''

  let query = supabase
    .from('invoices')
    .select('id, invoice_ref, vendor_invoice_no, vendor_invoice_date, total_amount, paid_amount, tds_amount, due_date, payment_status, status, match_status, invoice_file_path, centre:centres(code), po:purchase_orders(po_number)', { count: 'exact' })
    .eq('vendor_id', vendorId)

  if (statusFilter) query = query.eq('status', statusFilter)
  if (paymentFilter) query = query.eq('payment_status', paymentFilter)
  if (searchQuery) query = query.or(`invoice_ref.ilike.%${searchQuery}%,vendor_invoice_no.ilike.%${searchQuery}%`)

  const { data: invoices, count: totalCount } = await query
    .order('created_at', { ascending: false })
    .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1)

  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE)

  function buildUrl(overrides: Record<string, string>) {
    const sp = new URLSearchParams()
    const merged = { status: statusFilter, payment: paymentFilter, search: searchQuery, ...overrides }
    Object.entries(merged).forEach(([k, v]) => { if (v) sp.set(k, v) })
    return `/vendor/invoices?${sp.toString()}`
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and upload invoices against purchase orders</p>
        </div>
        <Link href="/vendor/invoices/upload" className="flex items-center gap-2 px-4 py-2.5 bg-[#0D7E8A] text-white text-sm font-semibold rounded-xl hover:bg-[#0a6972] transition-colors cursor-pointer shadow-sm w-fit">
          <Upload size={14} /> Upload Invoice
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6 space-y-3">
        <form method="GET" action="/vendor/invoices" className="flex items-center gap-2">
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          {paymentFilter && <input type="hidden" name="payment" value={paymentFilter} />}
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text" name="search" defaultValue={searchQuery}
              placeholder="Search by invoice number..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7E8A] focus:border-transparent"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-[#0D7E8A] text-white text-sm font-medium rounded-xl hover:bg-[#0a6972] transition-colors cursor-pointer">Search</button>
        </form>

        <div className="flex flex-wrap gap-1.5">
          {INVOICE_STATUSES.map((s) => (
            <Link key={s.value} href={buildUrl({ status: s.value, page: '' })}
              className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                statusFilter === s.value ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0D7E8A] hover:text-[#0D7E8A]'
              )}>{s.label}</Link>
          ))}
          <span className="text-gray-300 mx-1">|</span>
          {PAYMENT_STATUSES.map((s) => (
            <Link key={s.value} href={buildUrl({ payment: s.value, page: '' })}
              className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                paymentFilter === s.value ? 'bg-[#1B3A6B] text-white border-[#1B3A6B]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#0D7E8A] hover:text-[#0D7E8A]'
              )}>{s.label}</Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {invoices && invoices.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">PO</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Centre</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Paid</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Due</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Match</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-semibold text-gray-900">{inv.invoice_ref}</div>
                        <div className="text-[11px] text-gray-500">{inv.vendor_invoice_no}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 font-mono">{(inv.po as any)?.po_number || '—'}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">{(inv.centre as any)?.code}</span></td>
                      <td className="px-4 py-3 text-xs text-gray-600">{inv.vendor_invoice_date ? formatDate(inv.vendor_invoice_date) : '—'}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-right">{formatCurrency(inv.total_amount)}</td>
                      <td className="px-4 py-3 text-xs text-right font-medium text-green-600">{formatCurrency(inv.paid_amount)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{inv.due_date ? formatDate(inv.due_date) : '—'}</td>
                      <td className="px-4 py-3">
                        {inv.match_status && (
                          <span className={cn('px-2 py-0.5 rounded text-xs font-medium', MATCH_STATUS_COLORS[inv.match_status as keyof typeof MATCH_STATUS_COLORS])}>
                            {inv.match_status.replace(/_/g, ' ')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', PAYMENT_STATUS_COLORS[inv.payment_status as keyof typeof PAYMENT_STATUS_COLORS])}>
                          {inv.payment_status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount ?? 0)} of {totalCount}</span>
                <div className="flex gap-2">
                  {currentPage > 1 && <Link href={buildUrl({ page: String(currentPage - 1) })} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50">Previous</Link>}
                  {currentPage < totalPages && <Link href={buildUrl({ page: String(currentPage + 1) })} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50">Next</Link>}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <FileText size={40} className="mx-auto mb-3 text-gray-400" />
            <p className="font-medium text-gray-500">No invoices found</p>
            <p className="text-sm text-gray-400 mt-1">{searchQuery || statusFilter || paymentFilter ? 'Try adjusting your filters' : 'Upload your first invoice to get started'}</p>
            <Link href="/vendor/invoices/upload" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#0D7E8A] text-white text-sm font-medium rounded-xl hover:bg-[#0a6972] transition-colors">
              <Upload size={14} /> Upload Invoice
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
