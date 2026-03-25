'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Loader2 } from 'lucide-react'
import BarcodeScanButton from './BarcodeScanButton'

interface ItemResult {
  id: string
  item_code: string
  generic_name: string
  brand_name: string | null
  unit: string
  gst_percent: number
  category?: { name: string } | { name: string }[] | null
}

interface Props {
  onSelect: (item: ItemResult) => void
  excludeIds?: string[]
  placeholder?: string
}

export default function ItemSearch({ onSelect, excludeIds = [], placeholder = 'Search item by name or code...' }: Props) {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ItemResult[]>([])
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
      const { data } = await supabase
        .from('items')
        .select('id, item_code, generic_name, brand_name, unit, gst_percent, category:item_categories(name)')
        .eq('is_active', true)
        .or(`generic_name.ilike.%${query}%,item_code.ilike.%${query}%,brand_name.ilike.%${query}%`)
        .order('generic_name')
        .limit(10)
      const filtered = (data ?? []).filter(i => !excludeIds.includes(i.id))
      setResults(filtered)
      setLoading(false)
      setOpen(true)
    }, 300)
    return () => clearTimeout(timer)
  }, [query, excludeIds.join(',')])

  async function handleBarcodeScan(code: string) {
    setLoading(true)
    const { data } = await supabase
      .from('items')
      .select('id, item_code, generic_name, brand_name, unit, gst_percent, category:item_categories(name)')
      .eq('is_active', true)
      .or(`item_code.eq.${code},item_code.ilike.${code}`)
      .limit(1)
    setLoading(false)
    const match = (data ?? []).find(i => !excludeIds.includes(i.id))
    if (match) {
      onSelect(match)
    } else {
      setQuery(code)
    }
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
          <input
            className="form-input pl-11"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder={placeholder}
          />
        </div>
        <BarcodeScanButton onScan={handleBarcodeScan} label="Scan" scanType="item" />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map(item => (
            <button
              key={item.id}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-50 last:border-0"
              onClick={() => { onSelect(item); setQuery(''); setOpen(false) }}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gray-500">{item.item_code}</span>
                <span className="font-medium text-gray-900">{item.generic_name}</span>
                {item.brand_name && <span className="text-xs text-gray-400">({item.brand_name})</span>}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                Unit: {item.unit} | GST: {item.gst_percent}%
                {item.category && ` | ${Array.isArray(item.category) ? item.category[0]?.name : item.category.name}`}
              </div>
            </button>
          ))}
        </div>
      )}
      {open && loading && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4 flex items-center justify-center gap-2 text-gray-400 text-sm">
          <Loader2 size={16} className="animate-spin text-[#0D7E8A]" />
          Searching items...
        </div>
      )}
    </div>
  )
}
