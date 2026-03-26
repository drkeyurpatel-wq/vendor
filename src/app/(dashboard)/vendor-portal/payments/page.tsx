import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { Package, AlertTriangle, CreditCard, IndianRupee, Download } from 'lucide-react'
import Pagination from '@/components/ui/Pagination'

const PAGE_SIZE = 50

export const dynamic = 'force-dynamic'

export default async function VendorPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const { supabase, user, profile, role, centreId, isGroupLevel } = await requireAuth()
  if (!profile || role !== 'vendor') {
    return (
      <div className="card p-12 text-center">
        <Package size={40} className="mx-auto mb-3 text-gray-500" />
        <p className="font-medium text-gray-500">Vendor Portal</p>
        <p className="text-sm text-gray-500 mt-1">This page is only accessible to vendor users</p>
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
        <p className="text-sm text-gray-500 mt-1">No vendor profile is linked to your email. Contact the admin.</p>
      </div>
    )
  }

  const currentPage = parseInt(params.page || '1', 10)

  // Fetch payment batch items for this vendor
  // payment_batch_items are linked to invoices which have vendor_id
  const { count: totalCount } = await supabase
    .from('payment_batch_items')
    .select('*, invoice:invoices!inner(vendor_id)', { count: 'exact', head: true })
    .eq('invoice.vendor_id', vendor.id)

  const { data: payments } = await supabase
    .from('payment_batch_items')
    .select(`
      id, amount, payment_mode, utr_number, reference_number, status, created_at,
      invoice:invoices!inner(id, invoice_ref, vendor_id, vendor_invoice_no),
      batch:payment_batches(batch_number, payment_date, status)
    `)
    .eq('invoice.vendor_id', vendor.id)
    .order('created_at', { ascending: false })
    .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1)

  // Summary stats
  const totalPaid = payments?.reduce((s, p: any) => s + (p.amount || 0), 0) ?? 0
  const lastPayment = payments?.[0]
  const batch = Array.isArray(lastPayment?.batch) ? lastPayment?.batch[0] : lastPayment?.batch
  const lastPaymentDate = batch?.payment_date || lastPayment?.created_at

  // Next expected Saturday
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7
  const nextSaturday = new Date(now)
  nextSaturday.setDate(now.getDate() + daysUntilSaturday)

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment History</h1>
          <p className="page-subtitle">{vendor.legal_name} ({vendor.vendor_code})</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={18} className="text-green-500" />
            <span className="text-sm text-gray-500">Total Paid</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
        </div>
        <div className="stat-card border-l-4 border-navy-600">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={18} className="text-navy-600" />
            <span className="text-sm text-gray-500">Last Payment</span>
          </div>
          <div className="text-lg font-bold text-navy-600">
            {lastPaymentDate ? formatDate(lastPaymentDate) : 'No payments yet'}
          </div>
        </div>
        <div className="stat-card border-l-4 border-teal-500">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={18} className="text-teal-500" />
            <span className="text-sm text-gray-500">Next Payment Cycle</span>
          </div>
          <div className="text-lg font-bold text-teal-500">
            {formatDate(nextSaturday.toISOString())}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Saturday payment cycle</div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {payments && payments.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Payment Date</th>
                    <th>Batch Ref</th>
                    <th>Invoice Ref</th>
                    <th className="text-right">Amount</th>
                    <th>UTR / Reference</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((pmt: any) => (
                    <tr key={pmt.id} className="hover:bg-gray-50">
                      <td className="text-sm text-gray-600">
                        {pmt.batch?.payment_date ? formatDate(pmt.batch.payment_date) : formatDate(pmt.created_at)}
                      </td>
                      <td>
                        <span className="font-mono text-xs font-semibold text-navy-600">
                          {pmt.batch?.batch_number || '-'}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-xs text-gray-600">
                          {pmt.invoice?.invoice_ref || '-'}
                        </span>
                        {pmt.invoice?.vendor_invoice_no && (
                          <div className="text-xs text-gray-500">{pmt.invoice.vendor_invoice_no}</div>
                        )}
                      </td>
                      <td className="text-sm text-right font-semibold text-green-600">
                        {formatCurrency(pmt.amount)}
                      </td>
                      <td className="text-sm text-gray-600 font-mono">
                        {pmt.utr_number || pmt.reference_number || '-'}
                      </td>
                      <td>
                        <span className="badge bg-blue-50 text-blue-700 uppercase text-xs">
                          {pmt.payment_mode || '-'}
                        </span>
                      </td>
                      <td>
                        <span className={cn(
                          'badge',
                          pmt.status === 'completed' || pmt.status === 'paid' ? 'bg-green-100 text-green-700' :
                          pmt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        )}>
                          {pmt.status || 'completed'}
                        </span>
                      </td>
                      <td>
                        {pmt.payment_batch_id && (
                          <a href={`/api/pdf/payment-advice?id=${pmt.payment_batch_id}`} target="_blank"
                            className="text-xs font-medium text-teal-600 hover:underline flex items-center gap-1">
                            <Download size={12} /> Receipt
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination totalCount={totalCount ?? 0} pageSize={PAGE_SIZE} currentPage={currentPage} />
          </>
        ) : (
          <div className="empty-state">
            <CreditCard size={40} className="mx-auto mb-3 text-gray-500" />
            <p className="font-medium text-gray-500">No payment records found</p>
            <p className="text-sm text-gray-500 mt-1">
              Payments are processed every Saturday. Records will appear here after payment.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
