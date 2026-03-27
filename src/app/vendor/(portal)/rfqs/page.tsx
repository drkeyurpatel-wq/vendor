import { requireVendorAuth } from '@/lib/vendor-auth'
import Link from 'next/link'
import { cn, formatDate, formatCurrency } from '@/lib/utils'
import { FileQuestion, Clock, CheckCircle, XCircle } from 'lucide-react'

const RFQ_STATUS_COLORS: Record<string, string> = {
  open: 'bg-green-100 text-green-700',
  evaluation: 'bg-blue-100 text-blue-700',
  awarded: 'bg-purple-100 text-purple-700',
  cancelled: 'bg-red-100 text-red-700',
  closed: 'bg-gray-100 text-gray-700',
}

const QUOTE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  under_evaluation: 'bg-yellow-100 text-yellow-700',
  shortlisted: 'bg-purple-100 text-purple-700',
  awarded: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export const dynamic = 'force-dynamic'

export default async function VendorRFQsPage() {
  const { supabase, vendorId } = await requireVendorAuth()

  // Get vendor's category to filter relevant RFQs
  const { data: vendor } = await supabase
    .from('vendors')
    .select('category_id')
    .eq('id', vendorId)
    .single()

  // Open RFQs relevant to vendor (matching category or no category filter)
  let rfqQuery = supabase
    .from('rfqs')
    .select('id, rfq_number, title, description, status, submission_deadline, delivery_required_by, centre:centres(code), items:rfq_items(id)')
    .in('status', ['open', 'evaluation'])
    .order('submission_deadline', { ascending: true })

  if (vendor?.category_id) {
    rfqQuery = rfqQuery.or(`category_id.eq.${vendor.category_id},category_id.is.null`)
  }

  const { data: openRFQs } = await rfqQuery

  // Vendor's existing quotes
  const { data: myQuotes } = await supabase
    .from('rfq_quotes')
    .select('id, rfq_id, status, total_amount, submitted_at, rfq:rfqs(id, rfq_number, title, status, submission_deadline, centre:centres(code))')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })

  const quotedRfqIds = new Set(myQuotes?.map((q: any) => q.rfq_id) || [])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quotations (RFQ)</h1>
        <p className="text-sm text-gray-500 mt-0.5">View open requests and submit your quotes</p>
      </div>

      {/* Open RFQs */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Open for Quotation</h2>
        {openRFQs && openRFQs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openRFQs.map((rfq: any) => {
              const hasQuoted = quotedRfqIds.has(rfq.id)
              const deadlinePassed = new Date(rfq.submission_deadline) < new Date()
              return (
                <div key={rfq.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="font-mono text-xs font-semibold text-gray-500">{rfq.rfq_number}</div>
                      <h3 className="text-sm font-bold text-gray-900 mt-1">{rfq.title}</h3>
                    </div>
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium flex-shrink-0', RFQ_STATUS_COLORS[rfq.status])}>
                      {rfq.status}
                    </span>
                  </div>
                  {rfq.description && <p className="text-xs text-gray-600 mb-3 line-clamp-2">{rfq.description}</p>}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span>{rfq.centre?.code}</span>
                    <span>{rfq.items?.length || 0} items</span>
                    <span className={cn('font-medium', deadlinePassed ? 'text-red-600' : '')}>
                      Deadline: {formatDate(rfq.submission_deadline)}
                    </span>
                  </div>
                  {hasQuoted ? (
                    <Link href={`/vendor/rfqs/${rfq.id}`} className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-xl border border-green-200 w-fit cursor-pointer">
                      <CheckCircle size={14} /> Quote Submitted — View
                    </Link>
                  ) : deadlinePassed ? (
                    <span className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-500 text-sm font-medium rounded-xl w-fit">
                      <XCircle size={14} /> Deadline Passed
                    </span>
                  ) : (
                    <Link href={`/vendor/rfqs/${rfq.id}`} className="flex items-center gap-2 px-4 py-2 bg-[#0D7E8A] text-white text-sm font-semibold rounded-xl hover:bg-[#0a6972] transition-colors w-fit cursor-pointer">
                      Submit Quote
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <FileQuestion size={36} className="mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-gray-500">No open RFQs at the moment</p>
          </div>
        )}
      </div>

      {/* My Quotes History */}
      {myQuotes && myQuotes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">My Submitted Quotes</h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">RFQ</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Quote Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Submitted</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Quote Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">RFQ Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myQuotes.map((q: any) => (
                    <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/vendor/rfqs/${q.rfq_id}`} className="font-mono text-xs font-semibold text-[#0D7E8A] hover:underline">
                          {q.rfq?.rfq_number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900">{q.rfq?.title}</td>
                      <td className="px-4 py-3 text-xs text-right font-semibold">{q.total_amount ? formatCurrency(q.total_amount) : '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{q.submitted_at ? formatDate(q.submitted_at) : 'Draft'}</td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', QUOTE_STATUS_COLORS[q.status])}>{q.status.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('px-2 py-0.5 rounded text-xs font-medium', RFQ_STATUS_COLORS[q.rfq?.status])}>{q.rfq?.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
