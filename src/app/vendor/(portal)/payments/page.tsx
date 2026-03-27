import { requireVendorAuth } from '@/lib/vendor-auth'
import Link from 'next/link'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { CreditCard, Download } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function VendorPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const { supabase, vendorId } = await requireVendorAuth()
  const PAGE_SIZE = 50
  const currentPage = parseInt(params.page || '1', 10)

  // Get paid invoices with payment details
  const { data: payments, count: totalCount } = await supabase
    .from('invoices')
    .select('id, invoice_ref, vendor_invoice_no, vendor_invoice_date, total_amount, paid_amount, paid_at, tds_amount, advance_adjusted, payment_status, due_date, centre:centres(code), po:purchase_orders(po_number)', { count: 'exact' })
    .eq('vendor_id', vendorId)
    .in('payment_status', ['paid', 'partial'])
    .order('paid_at', { ascending: false })
    .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1)

  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE)
  const totalPaid = payments?.reduce((s, p: any) => s + (Number(p.paid_amount) || 0), 0) ?? 0
  const totalTDS = payments?.reduce((s, p: any) => s + (Number(p.tds_amount) || 0), 0) ?? 0

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track all payments received from Health1</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">Total Paid</div>
          <div className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">TDS Deducted</div>
          <div className="text-xl font-bold text-orange-600">{formatCurrency(totalTDS)}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">Transactions</div>
          <div className="text-xl font-bold text-gray-900">{totalCount ?? 0}</div>
        </div>
      </div>

      {/* Payment Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {payments && payments.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">PO</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Centre</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Invoice Amt</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">TDS</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Paid</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Paid On</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p: any) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-semibold">{p.invoice_ref}</div>
                        <div className="text-[11px] text-gray-500">{p.vendor_invoice_no}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-600">{(p.po as any)?.po_number || '—'}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">{(p.centre as any)?.code}</span></td>
                      <td className="px-4 py-3 text-xs text-right">{formatCurrency(p.total_amount)}</td>
                      <td className="px-4 py-3 text-xs text-right text-orange-600">{p.tds_amount ? formatCurrency(p.tds_amount) : '—'}</td>
                      <td className="px-4 py-3 text-xs text-right font-bold text-green-600">{formatCurrency(p.paid_amount)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{p.paid_at ? formatDate(p.paid_at) : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium',
                          p.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                        )}>{p.payment_status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                  {currentPage > 1 && <Link href={`/vendor/payments?page=${currentPage - 1}`} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50">Previous</Link>}
                  {currentPage < totalPages && <Link href={`/vendor/payments?page=${currentPage + 1}`} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium hover:bg-gray-50">Next</Link>}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <CreditCard size={40} className="mx-auto mb-3 text-gray-400" />
            <p className="font-medium text-gray-500">No payments found</p>
            <p className="text-sm text-gray-400 mt-1">Payments will appear here once processed</p>
          </div>
        )}
      </div>
    </div>
  )
}
