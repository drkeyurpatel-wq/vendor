'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useState } from 'react'

export default function DateRangeFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [from, setFrom] = useState(searchParams.get('from') || '')
  const [to, setTo] = useState(searchParams.get('to') || '')

  function apply() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('page') // reset to page 1
    if (from) params.set('from', from); else params.delete('from')
    if (to) params.set('to', to); else params.delete('to')
    router.push(`${pathname}?${params.toString()}`)
  }

  function clear() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('from')
    params.delete('to')
    params.delete('page')
    setFrom('')
    setTo('')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-500">Date:</span>
      <input
        type="date"
        className="form-input !py-1.5 !text-xs !w-auto"
        value={from}
        onChange={e => setFrom(e.target.value)}
        placeholder="From"
      />
      <span className="text-xs text-gray-500">to</span>
      <input
        type="date"
        className="form-input !py-1.5 !text-xs !w-auto"
        value={to}
        onChange={e => setTo(e.target.value)}
        placeholder="To"
      />
      <button onClick={apply} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-navy-600 text-white">
        Apply
      </button>
      {(from || to) && (
        <button onClick={clear} className="px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-700">
          Clear
        </button>
      )}
    </div>
  )
}
