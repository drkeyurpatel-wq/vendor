'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, X, Loader2 } from 'lucide-react'

interface VendorResult {
  id: string
  vendor_code: string
  legal_name: string
  trade_name: string | null
  category?: { name: string } | { name: string }[] | null
}

interface Props {
  value: VendorResult | null
  onChange: (vendor: VendorResult | null) => void
  centreId?: string
  placeholder?: string
}

export default function VendorSearch({ value, onChange, centreId, placeholder = 'Search vendor by name or code...' }: Props) {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<VendorResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      let q = supabase
        .from('vendors')
        .select('id, vendor_code, legal_name, trade_name, category:vendor_categories(name)')
        .in('status', ['active', 'pending', 'approved'])
        .is('deleted_at', null)
        .neq('onboarding_status', 'quick_draft')
        .or(`legal_name.ilike.%${query}%,vendor_code.ilike.%${query}%,trade_name.ilike.%${query}%`)
        .order('legal_name')
        .limit(10)
      // Don't filter by centre — approved_centres=null means all centres
      const { data } = await q
      setResults(data ?? [])
      setLoading(false)
      setOpen(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, centreId])

  if (value) {
    return (
      <div className="flex items-center gap-2 form-input bg-blue-50">
        <div className="flex-1">
          <span className="font-mono text-xs text-gray-500">{value.vendor_code}</span>
          <span className="ml-2 font-medium text-gray-900">{value.legal_name}</span>
          {value.category && <span className="ml-2 text-xs text-gray-400">{Array.isArray(value.category) ? value.category[0]?.name : value.category.name}</span>}
        </div>
        <button type="button" onClick={() => onChange(null)} className="text-gray-400 hover:text-red-500">
          <X size={16} />
        </button>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
        <input
          className="form-input pl-11"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map(v => (
            <button
              key={v.id}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-50 last:border-0"
              onClick={() => { onChange(v); setQuery(''); setOpen(false) }}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-500">{v.vendor_code}</span>
                <span className="font-medium text-gray-900">{v.legal_name}</span>
              </div>
              {v.category && <div className="text-xs text-gray-400 mt-0.5">{Array.isArray(v.category) ? v.category[0]?.name : v.category.name}</div>}
            </button>
          ))}
        </div>
      )}
      {open && loading && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center justify-center gap-2 text-gray-400 text-sm">
          <Loader2 size={16} className="animate-spin text-[#0D7E8A]" />
          Searching vendors...
        </div>
      )}
    </div>
  )
}
