'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import DataTable from '@/components/ui/DataTable'
import { cn, formatDate, formatLakhs } from '@/lib/utils'
import { Wallet, Plus, Calendar, CheckCircle2, Play, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import BulkActionBar from '@/components/ui/BulkActionBar'

const BATCH_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  pending_approval: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const NEXT_STATUS: Record<string, { label: string; status: string; icon: any }> = {
  draft: { label: 'Submit', status: 'pending_approval', icon: <CheckCircle2 size={10} /> },
  pending_approval: { label: 'Approve', status: 'approved', icon: <CheckCircle2 size={10} /> },
  approved: { label: 'Process', status: 'processing', icon: <Play size={10} /> },
  processing: { label: 'Complete', status: 'completed', icon: <CheckCircle2 size={10} /> },
}

interface Batch {
  id: string; batch_number: string; batch_date: string; status: string
  total_amount: number; notes?: string; payment_count?: number
}

function InlineStatusButton({ batchId, batchNumber, currentStatus }: { batchId: string; batchNumber: string; currentStatus: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const next = NEXT_STATUS[currentStatus]
  if (!next) return null

  async function advance() {
    setLoading(true)
    const updates: Record<string, any> = { status: next.status, updated_at: new Date().toISOString() }
    if (next.status === 'approved') updates.approved_at = new Date().toISOString()

    const { error } = await supabase.from('payment_batches').update(updates).eq('id', batchId)
    if (error) { toast.error(error.message); setLoading(false); return }

    // If completing, mark all batch invoices as paid
    if (next.status === 'completed') {
      const { data: items } = await supabase.from('payment_batch_items').select('invoice_id, amount').eq('batch_id', batchId)
      if (items) {
        for (const item of items) {
          if (item.invoice_id) {
            const { data: inv } = await supabase.from('invoices').select('total_amount, paid_amount').eq('id', item.invoice_id).single()
            if (inv) {
              const newPaid = (inv.paid_amount || 0) + (item.amount || 0)
              const ps = newPaid >= inv.total_amount - 0.01 ? 'paid' : 'partial'
              await supabase.from('invoices').update({ paid_amount: Math.round(newPaid * 100) / 100, payment_status: ps, ...(ps === 'paid' ? { paid_at: new Date().toISOString() } : {}), updated_at: new Date().toISOString() }).eq('id', item.invoice_id)
            }
          }
        }
      }
    }

    try { await supabase.from('audit_logs').insert({ entity_type: 'payment_batch', entity_id: batchId, action: `batch_${next.status}`, details: { batch_number: batchNumber } }) } catch {}
    toast.success(`${batchNumber} → ${next.status.replace(/_/g, ' ')}`)
    setLoading(false); router.refresh()
  }

  return (
    <button onClick={(e) => { e.stopPropagation(); advance() }} disabled={loading}
      className="text-[10px] font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded transition-colors flex items-center gap-1 whitespace-nowrap">
      {loading ? <Loader2 size={10} className="animate-spin" /> : next.icon} {next.label}
    </button>
  )
}

export default function PaymentListClient({ batches, userRole }: { batches: Batch[]; userRole: string }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const canBulk = ['group_admin', 'group_cao', 'finance_staff'].includes(userRole)

  function toggleSelect(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const columns = useMemo<ColumnDef<Batch, any>[]>(() => {
    const cols: ColumnDef<Batch, any>[] = []
    if (canBulk) {
      cols.push({
        id: 'select', size: 40, enableSorting: false,
        header: () => <input type="checkbox" checked={selectedIds.length === batches.length && batches.length > 0}
          onChange={() => setSelectedIds(selectedIds.length === batches.length ? [] : batches.map(b => b.id))}
          className="w-4 h-4 rounded border-gray-300 text-teal-600" />,
        cell: ({ row }) => <input type="checkbox" checked={selectedIds.includes(row.original.id)}
          onChange={() => toggleSelect(row.original.id)} onClick={e => e.stopPropagation()}
          className="w-4 h-4 rounded border-gray-300 text-teal-600" />,
      })
    }
    cols.push(
      { accessorKey: 'batch_number', header: 'Batch #', size: 160,
        cell: ({ row }) => <span className="font-mono text-xs font-semibold text-gray-900">{row.original.batch_number}</span> },
      { accessorKey: 'batch_date', header: 'Date', size: 110,
        cell: ({ row }) => <div className="flex items-center gap-1.5"><Calendar size={13} className="text-gray-400" /><span className="text-sm text-gray-700">{formatDate(row.original.batch_date)}</span></div> },
      { accessorKey: 'total_amount', header: 'Amount', size: 120,
        cell: ({ row }) => <span className="text-sm font-bold text-gray-900">{formatLakhs(row.original.total_amount)}</span> },
      { id: 'count', header: 'Invoices', size: 80, accessorFn: r => r.payment_count || 0,
        cell: ({ row }) => <span className="text-sm text-gray-600">{row.original.payment_count || '—'}</span> },
      { accessorKey: 'status', header: 'Status', size: 120,
        cell: ({ row }) => <span className={cn('badge', BATCH_STATUS_COLORS[row.original.status] || 'bg-gray-100 text-gray-700')}>{row.original.status?.replace(/_/g, ' ')}</span> },
      { id: 'action', header: '', size: 90, enableSorting: false,
        cell: ({ row }) => canBulk ? <InlineStatusButton batchId={row.original.id} batchNumber={row.original.batch_number} currentStatus={row.original.status} /> : null },
    )
    return cols
  }, [selectedIds, batches.length, canBulk])

  const bulkActions = [
    { key: 'approve', label: 'Approve', icon: <CheckCircle2 size={12} />, variant: 'primary' as const, newStatus: 'approved' },
    { key: 'cancel', label: 'Cancel', icon: <XCircle size={12} />, variant: 'danger' as const, requireComment: true, newStatus: 'cancelled' },
  ]

  return (
    <>
      {canBulk && (
        <BulkActionBar selectedIds={selectedIds} entityType="payment_batch" tableName="payment_batches"
          actions={bulkActions} onClear={() => setSelectedIds([])} entityLabel="batch" />
      )}
      <DataTable columns={columns} data={batches}
        searchPlaceholder="Search batch number..." showSearch showExport exportFilename="payment-batches" pageSize={25}
        onRowClick={batch => router.push(`/finance/payments/${batch.id}`)}
        emptyIcon={<Wallet size={40} className="text-gray-300" />}
        emptyTitle="No payment batches" emptyDescription="Saturday payment cycle batches"
        emptyAction={<Link href="/finance/payments/new" className="btn-primary text-sm"><Plus size={15} /> New Batch</Link>} />
    </>
  )
}
