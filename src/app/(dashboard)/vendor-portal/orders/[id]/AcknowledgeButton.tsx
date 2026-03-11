'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { CheckCircle } from 'lucide-react'

export default function AcknowledgePOButton({ poId }: { poId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleAcknowledge = async () => {
    if (!confirm('Are you sure you want to acknowledge this Purchase Order?')) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'sent_to_vendor',
          sent_to_vendor_at: new Date().toISOString(),
        })
        .eq('id', poId)

      if (error) throw error

      toast.success('Purchase Order acknowledged successfully')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Failed to acknowledge PO')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleAcknowledge}
      disabled={loading}
      className="btn-primary text-sm flex items-center gap-2"
    >
      <CheckCircle size={16} />
      {loading ? 'Acknowledging...' : 'Acknowledge PO'}
    </button>
  )
}
