import { createClient } from '@/lib/supabase/server'
import { cn, formatDate, formatDateTime, formatCurrency, formatLakhs } from '@/lib/utils'
import { ArrowLeft, Wallet, Calendar, User, FileText, Hash, Download } from 'lucide-react'
import Link from 'next/link'
import BatchActions from './BatchActions'

const BATCH_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default async function PaymentBatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: batch, error } = await supabase
    .from('payment_batches')
    .select('*')
    .eq('id', id)
    .single()

  if (!batch || error) {
    return (
      <div>
        <Link href="/finance/payments" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={14} /> Back
        </Link>
        <div className="card p-8 text-center">
          <Wallet size={40} className="mx-auto mb-3 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-700">Payment Batch Not Found</h2>
          <p className="text-sm text-gray-400 mt-1">This batch may have been deleted or does not exist.</p>
        </div>
      </div>
    )
  }

  // Fetch batch items with invoice and vendor details
  const { data: items } = await supabase
    .from('payment_batch_items')
    .select('*, invoice:invoices(invoice_ref, vendor_invoice_no, due_date, total_amount, paid_amount, payment_status, vendor:vendors(legal_name, vendor_code))')
    .eq('batch_id', id)

  // Fetch approver profile if approved_by is set
  let approverName: string | null = null
  if (batch.approved_by) {
    const { data: approver } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', batch.approved_by)
      .single()
    approverName = approver?.full_name ?? null
  }

  const batchItems = items ?? []
  const totalOutstanding = batchItems.reduce((sum: number, item: any) => {
    const invoice = item.invoice
    if (!invoice) return sum
    return sum + (invoice.total_amount - (invoice.paid_amount || 0))
  }, 0)

  return (
    <div>
      <Link href="/finance/payments" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Payment Batches
      </Link>

      {/* Batch Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[#1B3A6B] font-mono">{batch.batch_number}</h1>
              <span className={cn('badge', BATCH_STATUS_COLORS[batch.status] || 'bg-gray-100 text-gray-700')}>
                {batch.status?.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Batch Date: <span className="font-medium text-gray-700">{formatDate(batch.batch_date)}</span>
              {' | '}
              {batch.payment_count || batchItems.length} payment{(batch.payment_count || batchItems.length) !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a
              href={`/api/pdf/payment-advice?id=${batch.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center gap-1.5"
            >
              <Download size={15} /> Payment Advice
            </a>
            <BatchActions batchId={batch.id} currentStatus={batch.status} />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card border-l-4 border-[#1B3A6B]">
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={18} className="text-[#1B3A6B]" />
            <span className="text-sm font-semibold text-gray-700">Total Amount</span>
          </div>
          <div className="text-2xl font-bold text-[#1B3A6B]">{formatLakhs(batch.total_amount || 0)}</div>
        </div>
        <div className="stat-card border-l-4 border-[#0D7E8A]">
          <div className="flex items-center gap-2 mb-1">
            <Hash size={18} className="text-[#0D7E8A]" />
            <span className="text-sm font-semibold text-gray-700">Payment Count</span>
          </div>
          <div className="text-2xl font-bold text-[#0D7E8A]">{batch.payment_count || batchItems.length}</div>
        </div>
        <div className="stat-card border-l-4 border-orange-500">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={18} className="text-orange-500" />
            <span className="text-sm font-semibold text-gray-700">Outstanding</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{formatLakhs(totalOutstanding)}</div>
        </div>
        <div className="stat-card border-l-4 border-green-500">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={18} className="text-green-500" />
            <span className="text-sm font-semibold text-gray-700">Batch Date</span>
          </div>
          <div className="text-lg font-bold text-green-600">{formatDate(batch.batch_date)}</div>
        </div>
      </div>

      {/* Approval Info */}
      <div className="card p-5 mb-6">
        <h2 className="text-lg font-semibold text-[#1B3A6B] mb-3 flex items-center gap-2">
          <User size={18} /> Batch Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Created</span>
            <p className="font-medium text-gray-800">{formatDateTime(batch.created_at)}</p>
          </div>
          {batch.approved_by && (
            <div>
              <span className="text-gray-500">Approved By</span>
              <p className="font-medium text-gray-800">{approverName || 'Unknown'}</p>
            </div>
          )}
          {batch.approved_at && (
            <div>
              <span className="text-gray-500">Approved At</span>
              <p className="font-medium text-gray-800">{formatDateTime(batch.approved_at)}</p>
            </div>
          )}
        </div>
        {batch.notes && (
          <div className="mt-4 pt-3 border-t">
            <span className="text-sm text-gray-500">Notes</span>
            <p className="text-sm text-gray-800 mt-1">{batch.notes}</p>
          </div>
        )}
      </div>

      {/* Batch Items Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b bg-[#EEF2F9]">
          <h2 className="text-lg font-semibold text-[#1B3A6B]">Payment Items</h2>
          <p className="text-sm text-gray-500 mt-0.5">{batchItems.length} invoice{batchItems.length !== 1 ? 's' : ''} in this batch</p>
        </div>
        {batchItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Invoice Ref</th>
                  <th>Vendor</th>
                  <th>Vendor Invoice No</th>
                  <th>Due Date</th>
                  <th className="text-right">Outstanding Amount</th>
                </tr>
              </thead>
              <tbody>
                {batchItems.map((item: any, index: number) => {
                  const invoice = item.invoice
                  const outstanding = invoice ? invoice.total_amount - (invoice.paid_amount || 0) : (item.amount || 0)
                  return (
                    <tr key={item.id}>
                      <td className="text-sm text-gray-500">{index + 1}</td>
                      <td>
                        <span className="font-mono text-xs font-semibold text-[#0D7E8A]">
                          {invoice?.invoice_ref || '-'}
                        </span>
                      </td>
                      <td>
                        <div className="text-sm font-medium text-gray-800">{invoice?.vendor?.legal_name || '-'}</div>
                        <div className="text-xs text-gray-400 font-mono">{invoice?.vendor?.vendor_code || ''}</div>
                      </td>
                      <td className="text-sm text-gray-700">{invoice?.vendor_invoice_no || '-'}</td>
                      <td className="text-sm text-gray-700">
                        {invoice?.due_date ? formatDate(invoice.due_date) : '-'}
                      </td>
                      <td className="text-sm font-semibold text-right">{formatCurrency(outstanding)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#EEF2F9] font-semibold">
                  <td colSpan={5} className="text-right text-sm text-[#1B3A6B]">Total Outstanding</td>
                  <td className="text-right text-sm text-[#1B3A6B]">{formatCurrency(totalOutstanding)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="empty-state py-12">
            <FileText size={40} className="mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No items in this batch</p>
            <p className="text-sm text-gray-400 mt-1">Add invoices to this payment batch to proceed.</p>
          </div>
        )}
      </div>
    </div>
  )
}
