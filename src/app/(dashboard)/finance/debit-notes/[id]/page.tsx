import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, FileText, AlertTriangle } from 'lucide-react'
import DebitNoteActions from '@/components/ui/DebitNoteActions'

export const dynamic = 'force-dynamic'

const DN_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700', approved: 'bg-blue-100 text-blue-800',
  sent: 'bg-purple-100 text-purple-800', adjusted: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default async function DebitNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase, user, role, centreId, isGroupLevel } = await requireAuth()
  const { data: dn, error } = await supabase
    .from('debit_notes')
    .select('*, vendor:vendors(id, legal_name, vendor_code, gstin), centre:centres(code, name), invoice:invoices(id, invoice_ref, vendor_invoice_no, total_amount)')
    .eq('id', id).single()

  if (!dn || error) {
    return (
      <div>
        <Link href="/finance/debit-notes" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft size={14} /> Back to Debit Notes
        </Link>
        <div className="card p-12 text-center">
          <AlertTriangle size={40} className="mx-auto mb-3 text-yellow-400" />
          <h2 className="text-xl font-semibold text-gray-700">Debit Note Not Found</h2>
        </div>
      </div>
    )
  }

  let createdByName: string | null = null
  if (dn.created_by) {
    const { data: u } = await supabase.from('user_profiles').select('full_name').eq('id', dn.created_by).single()
    createdByName = u?.full_name || null
  }

  // Fetch debit note items if they exist
  const { data: dnItems } = await supabase
    .from('debit_note_items')
    .select('*, item:items(item_code, generic_name, unit)')
    .eq('debit_note_id', id)

  return (
    <div>
      <Link href="/finance/debit-notes" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14} /> Back to Debit Notes
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-navy-600 font-mono">{dn.debit_note_number}</h1>
              <span className={cn('badge', DN_STATUS_COLORS[dn.status])}>{dn.status?.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Vendor: <Link href={`/vendors/${dn.vendor?.id}`} className="text-teal-600 hover:underline font-medium">{dn.vendor?.vendor_code} — {dn.vendor?.legal_name}</Link>
              {dn.centre && <> | Centre: <strong>{dn.centre.code}</strong></>}
            </p>
          </div>
          <DebitNoteActions
            debitNoteId={dn.id}
            dnNumber={dn.debit_note_number}
            status={dn.status}
            amount={dn.total_amount}
            vendorName={dn.vendor?.legal_name}
            userRole={role}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card p-5">
          <h3 className="font-semibold text-navy-600 mb-3 pb-2 border-b border-gray-100">Debit Note Details</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">DN Number:</span><span className="font-mono font-semibold">{dn.debit_note_number}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Date:</span><span className="font-medium">{formatDate(dn.created_at)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Reason:</span><span className="font-medium">{dn.reason}</span></div>
            {createdByName && <div className="flex justify-between"><span className="text-gray-500">Created By:</span><span className="font-medium">{createdByName}</span></div>}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-navy-600 mb-3 pb-2 border-b border-gray-100">Amounts</h3>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal:</span><span className="font-medium">{formatCurrency(dn.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">GST:</span><span className="font-medium">{formatCurrency(dn.gst_amount)}</span></div>
            <div className="flex justify-between pt-2 border-t border-gray-100"><span className="font-semibold text-navy-600">Total Amount:</span><span className="font-bold text-lg text-navy-600">{formatCurrency(dn.total_amount)}</span></div>
          </div>
        </div>
      </div>

      {/* Against Invoice */}
      {dn.invoice && (
        <div className="card p-5 mb-6">
          <h3 className="font-semibold text-navy-600 mb-3 pb-2 border-b border-gray-100">Against Invoice</h3>
          <div className="flex items-center gap-4 text-sm">
            <Link href={`/finance/invoices/${dn.invoice.id}`} className="font-mono text-teal-600 hover:underline font-semibold">{dn.invoice.invoice_ref}</Link>
            <span className="text-gray-500">Vendor Invoice: {dn.invoice.vendor_invoice_no || '—'}</span>
            <span className="font-semibold">{formatCurrency(dn.invoice.total_amount)}</span>
          </div>
        </div>
      )}

      {/* Notes */}
      {dn.notes && (
        <div className="card p-5 mb-6">
          <h3 className="font-semibold text-navy-600 mb-2">Notes</h3>
          <p className="text-sm text-gray-700">{dn.notes}</p>
        </div>
      )}

      {/* Items */}
      {dnItems && dnItems.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-navy-600">Debit Note Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>#</th><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
              <tbody>
                {dnItems.map((item: any, idx: number) => (
                  <tr key={item.id}>
                    <td className="text-xs text-gray-500">{idx + 1}</td>
                    <td><span className="text-sm font-medium">{item.item?.generic_name || item.description}</span><br /><span className="text-xs text-gray-500 font-mono">{item.item?.item_code}</span></td>
                    <td className="text-sm text-right">{item.quantity} {item.item?.unit}</td>
                    <td className="text-sm text-right font-mono">{formatCurrency(item.rate)}</td>
                    <td className="text-sm text-right font-semibold">{formatCurrency(item.amount || (item.quantity * item.rate))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
