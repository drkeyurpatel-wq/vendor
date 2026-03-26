'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Clock, BellOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  alertId: string
  vendorName: string
  documentType: string
  userRole: string
}

export default function DocumentAlertActions({ alertId, vendorName, documentType, userRole }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState<string | null>(null)

  const canManage = ['group_admin', 'group_cao', 'unit_cao', 'unit_purchase_manager'].includes(userRole)
  if (!canManage) return null

  async function markReviewed() {
    setLoading('review')
    const { error } = await supabase.from('vendor_documents').update({
      review_status: 'reviewed', reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).eq('id', alertId)
    if (error) { toast.error(error.message); setLoading(null); return }
    toast.success(`${documentType} for ${vendorName} marked reviewed`)
    setLoading(null); router.refresh()
  }

  async function snooze(days: number) {
    setLoading('snooze')
    const snoozeUntil = new Date(Date.now() + days * 86400000).toISOString()
    const { error } = await supabase.from('vendor_documents').update({
      snooze_until: snoozeUntil, updated_at: new Date().toISOString(),
    }).eq('id', alertId)
    if (error) { toast.error(error.message); setLoading(null); return }
    toast.success(`Snoozed ${days} days`)
    setLoading(null); router.refresh()
  }

  async function dismiss() {
    setLoading('dismiss')
    const { error } = await supabase.from('vendor_documents').update({
      alert_dismissed: true, updated_at: new Date().toISOString(),
    }).eq('id', alertId)
    if (error) { toast.error(error.message); setLoading(null); return }
    toast.success('Alert dismissed')
    setLoading(null); router.refresh()
  }

  return (
    <div className="flex gap-1">
      <button onClick={markReviewed} disabled={!!loading} title="Mark reviewed"
        className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors">
        {loading === 'review' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
      </button>
      <button onClick={() => snooze(7)} disabled={!!loading} title="Snooze 7 days"
        className="p-1.5 rounded-lg hover:bg-yellow-50 text-yellow-600 transition-colors">
        {loading === 'snooze' ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
      </button>
      <button onClick={dismiss} disabled={!!loading} title="Dismiss"
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors">
        {loading === 'dismiss' ? <Loader2 size={14} className="animate-spin" /> : <BellOff size={14} />}
      </button>
    </div>
  )
}
