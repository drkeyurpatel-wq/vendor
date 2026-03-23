'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  contractId: string
  contractNumber: string
  currentStatus: string
}

export default function RateContractQuickAction({ contractId, contractNumber, currentStatus }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  async function activate() {
    setLoading(true)
    const { error } = await supabase.from('rate_contracts').update({
      status: 'active', approved_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', contractId)
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success(`${contractNumber} activated`)
    setLoading(false); router.refresh()
  }

  async function expire() {
    setLoading(true)
    const { error } = await supabase.from('rate_contracts').update({
      status: 'expired', updated_at: new Date().toISOString(),
    }).eq('id', contractId)
    if (error) { toast.error(error.message); setLoading(false); return }
    toast.success(`${contractNumber} expired`)
    setLoading(false); router.refresh()
  }

  if (loading) return <Loader2 size={14} className="animate-spin text-gray-400" />

  if (currentStatus === 'draft') {
    return (
      <button onClick={activate} className="text-[10px] font-medium text-green-600 bg-green-50 hover:bg-green-100 px-2 py-0.5 rounded transition-colors flex items-center gap-1">
        <CheckCircle2 size={10} /> Activate
      </button>
    )
  }

  if (currentStatus === 'active') {
    return (
      <button onClick={expire} className="text-[10px] font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded transition-colors flex items-center gap-1">
        <XCircle size={10} /> Expire
      </button>
    )
  }

  return null
}
