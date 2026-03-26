'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCheck, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BatchMatchButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function runMatch() {
    setLoading(true)
    try {
      const res = await fetch('/api/invoices/batch-match', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Batch match failed')
        return
      }

      const processed = data.processed ?? 0
      if (processed === 0) {
        toast(data.message || 'No invoices to match', { icon: 'ℹ️' })
        return
      }

      const m = data.matched ?? 0
      const p = data.partial_match ?? 0
      const mm = data.mismatch ?? 0
      const s = data.skipped ?? 0

      const parts: string[] = []
      if (m > 0) parts.push(`${m} matched`)
      if (p > 0) parts.push(`${p} partial`)
      if (mm > 0) parts.push(`${mm} mismatch`)
      if (s > 0) parts.push(`${s} skipped`)

      if (mm > 0) {
        toast.error(`${processed} processed: ${parts.join(', ')}`, { duration: 5000 })
      } else if (p > 0) {
        toast(`${processed} processed: ${parts.join(', ')}`, { icon: '⚠️', duration: 5000 })
      } else {
        toast.success(`${processed} processed: ${parts.join(', ')}`, { duration: 4000 })
      }
    } catch (err: any) {
      toast.error(err?.message || 'Network error')
    } finally {
      setLoading(false)
      router.refresh()
    }
  }

  return (
    <button onClick={runMatch} disabled={loading} className="btn-secondary text-sm flex items-center gap-1.5">
      {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
      {loading ? 'Matching...' : 'Run 3-Way Match'}
    </button>
  )
}
