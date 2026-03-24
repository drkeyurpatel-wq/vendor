'use client'

import { useState } from 'react'
import { RefreshCw, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ComputeScoresButton() {
  const [loading, setLoading] = useState(false)

  async function compute() {
    setLoading(true)
    try {
      const res = await fetch('/api/vendors/compute-scores', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        toast.success(`${data.vendors_scored} vendors scored. ${data.flagged_for_review} flagged, ${data.auto_blacklisted} blacklisted.`)
      } else {
        toast.error(data.error || 'Scoring failed')
      }
    } catch { toast.error('Scoring failed') }
    setLoading(false)
    window.location.reload()
  }

  return (
    <button onClick={compute} disabled={loading} className="btn-secondary text-sm flex items-center gap-1.5">
      {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
      {loading ? 'Computing...' : 'Recompute Scores'}
    </button>
  )
}
