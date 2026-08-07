'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Trophy } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { useConfirm } from '@/components/ui/ConfirmProvider'
import { awardBlockedReason } from '@/lib/rfq'

interface Props {
  rfqId: string
  rfqStatus: string
  quoteId: string
  quoteStatus: string
  vendorName: string
  total: number | null
}

export default function RFQAwardActions({
  rfqId,
  rfqStatus,
  quoteId,
  quoteStatus,
  vendorName,
  total,
}: Props) {
  const router = useRouter()
  const confirm = useConfirm()
  const [loading, setLoading] = useState(false)

  // Same rule the API enforces, so the button is only offered when the award
  // would actually be accepted.
  const blocked = awardBlockedReason(rfqStatus, quoteStatus)

  if (quoteStatus === 'awarded') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700">
        <Trophy size={12} aria-hidden="true" /> Awarded
      </span>
    )
  }

  if (blocked) {
    return <span className="text-xs text-gray-500">—</span>
  }

  async function handleAward() {
    const proceed = await confirm({
      title: `Award to ${vendorName}?`,
      description:
        total && total > 0
          ? `${vendorName} wins this RFQ at ${formatCurrency(total)}. Every other submitted quote is rejected and the RFQ closes. This cannot be undone.`
          : `${vendorName} wins this RFQ. Every other submitted quote is rejected and the RFQ closes. This cannot be undone.`,
      confirmLabel: 'Award',
      confirmVariant: 'primary',
    })
    if (!proceed) return

    setLoading(true)
    try {
      const res = await fetch(`/api/rfq/${rfqId}/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote_id: quoteId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not award the RFQ')
      toast.success(`Awarded to ${vendorName}`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || 'Could not award the RFQ')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleAward}
      disabled={loading}
      className="text-xs font-medium px-2.5 py-1 rounded-lg bg-navy-600 text-white hover:bg-navy-700 transition-colors duration-150 cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-1"
    >
      {loading ? (
        <>
          <Loader2 size={11} className="animate-spin inline mr-1" aria-hidden="true" /> Awarding...
        </>
      ) : (
        'Award'
      )}
    </button>
  )
}
