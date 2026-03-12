'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2, CheckCircle, Play, CircleCheck } from 'lucide-react'
import { fireInAppNotification, fireEmailNotification } from '@/lib/notify'

interface BatchActionsProps {
  batchId: string
  currentStatus: string
}

export default function BatchActions({ batchId, currentStatus }: BatchActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStatusUpdate(newStatus: string) {
    const supabase = createClient()
    setLoading(true)

    try {
      if (newStatus === 'approved') {
        const { error } = await supabase
          .from('payment_batches')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
          })
          .eq('id', batchId)

        if (error) throw error
        toast.success('Batch approved successfully')

        // Notify: in-app to finance staff
        fireInAppNotification('payment_batch_approved', 'payment_batch', batchId)
      } else if (newStatus === 'processing') {
        const { error } = await supabase
          .from('payment_batches')
          .update({ status: 'processing' })
          .eq('id', batchId)

        if (error) throw error
        toast.success('Batch marked as processing')
      } else if (newStatus === 'completed') {
        // Update batch status
        const { error: batchError } = await supabase
          .from('payment_batches')
          .update({ status: 'completed' })
          .eq('id', batchId)

        if (batchError) throw batchError

        // Fetch all batch items to update their invoices
        const { data: batchItems, error: itemsError } = await supabase
          .from('payment_batch_items')
          .select('*, invoice:invoices(id, total_amount)')
          .eq('batch_id', batchId)

        if (itemsError) throw itemsError

        // Update each invoice's payment_status to 'paid' and set paid_amount
        if (batchItems && batchItems.length > 0) {
          const updatePromises = batchItems.map((item: any) => {
            if (!item.invoice?.id) return Promise.resolve()
            return supabase
              .from('invoices')
              .update({
                payment_status: 'paid',
                paid_amount: item.invoice.total_amount,
              })
              .eq('id', item.invoice.id)
          })

          const results = await Promise.all(updatePromises)
          const failedUpdate = results.find((r: any) => r?.error)
          if (failedUpdate?.error) throw failedUpdate.error
        }

        toast.success('Batch completed — all invoices marked as paid')

        // Notify: email each vendor their payment details
        fireEmailNotification('payment_processed', { batch_id: batchId })

        // Notify: in-app to finance
        fireInAppNotification('payment_batch_released', 'payment_batch', batchId)
      }

      router.refresh()
    } catch (err: any) {
      console.error('Status update failed:', err)
      toast.error(err.message || 'Failed to update batch status')
    } finally {
      setLoading(false)
    }
  }

  if (currentStatus === 'completed' || currentStatus === 'cancelled') {
    return null
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {currentStatus === 'pending_approval' && (
        <button
          onClick={() => handleStatusUpdate('approved')}
          disabled={loading}
          className="btn-primary flex items-center gap-1.5"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
          Approve Batch
        </button>
      )}

      {currentStatus === 'approved' && (
        <button
          onClick={() => handleStatusUpdate('processing')}
          disabled={loading}
          className="btn-primary flex items-center gap-1.5"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
          Mark as Processing
        </button>
      )}

      {currentStatus === 'processing' && (
        <button
          onClick={() => handleStatusUpdate('completed')}
          disabled={loading}
          className="btn-navy flex items-center gap-1.5"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <CircleCheck size={15} />}
          Mark as Completed
        </button>
      )}
    </div>
  )
}
