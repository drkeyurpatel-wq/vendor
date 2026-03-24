'use client'

import { useState } from 'react'
import { CheckCheck, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BatchMatchButton() {
  const [loading, setLoading] = useState(false)

  async function runMatch() {
    setLoading(true)
    try {
      const res = await fetch('/api/invoices/batch-match', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success(`${data.matched} matched, ${data.partial_match} partial, ${data.mismatch} mismatch`)
      } else {
        toast.error(data.error || 'Match failed')
      }
    } catch { toast.error('Match failed') }
    setLoading(false)
    window.location.reload()
  }

  return (
    <button onClick={runMatch} disabled={loading} className="btn-secondary text-sm flex items-center gap-1.5">
      {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
      {loading ? 'Matching...' : 'Run 3-Way Match'}
    </button>
  )
}
