'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  Search, Users, Package, ShoppingCart, ClipboardList,
  FileText, ArrowRight, Command, CornerDownLeft, Loader2,
  Hash, Building2, BarChart3, Settings,
} from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  subtitle?: string
  category: 'vendor' | 'item' | 'po' | 'grn' | 'invoice' | 'page'
  href: string
  code?: string
}

const CATEGORY_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  vendor: { icon: <Users size={14} />, label: 'Vendor', color: 'text-blue-600 bg-blue-50' },
  item: { icon: <Package size={14} />, label: 'Item', color: 'text-teal-600 bg-teal-50' },
  po: { icon: <ShoppingCart size={14} />, label: 'PO', color: 'text-purple-600 bg-purple-50' },
  grn: { icon: <ClipboardList size={14} />, label: 'GRN', color: 'text-orange-600 bg-orange-50' },
  invoice: { icon: <FileText size={14} />, label: 'Invoice', color: 'text-red-600 bg-red-50' },
  page: { icon: <ArrowRight size={14} />, label: 'Page', color: 'text-gray-600 bg-gray-50' },
}

const QUICK_PAGES: SearchResult[] = [
  { id: 'p-dashboard', title: 'Dashboard', category: 'page', href: '/' },
  { id: 'p-vendors', title: 'Vendor Master', category: 'page', href: '/vendors' },
  { id: 'p-items', title: 'Item Master', category: 'page', href: '/items' },
  { id: 'p-po', title: 'Purchase Orders', category: 'page', href: '/purchase-orders' },
  { id: 'p-po-new', title: 'New Purchase Order', category: 'page', href: '/purchase-orders/new' },
  { id: 'p-grn', title: 'Goods Receipt Notes', category: 'page', href: '/grn' },
  { id: 'p-grn-new', title: 'New GRN', category: 'page', href: '/grn/new' },
  { id: 'p-invoices', title: 'Invoices', category: 'page', href: '/finance/invoices' },
  { id: 'p-credit', title: 'Credit Period Aging', category: 'page', href: '/finance/credit' },
  { id: 'p-payments', title: 'Payment Batches', category: 'page', href: '/finance/payments' },
  { id: 'p-stock', title: 'Stock Levels', category: 'page', href: '/items/stock' },
  { id: 'p-reports', title: 'Reports', category: 'page', href: '/reports' },
  { id: 'p-users', title: 'User Management', category: 'page', href: '/settings/users' },
  { id: 'p-indents', title: 'Purchase Indents', category: 'page', href: '/purchase-orders/indents' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const debounceRef = useRef<NodeJS.Timeout>()

  // Open/close with Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSelectedIndex(0)
      return
    }

    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const q = query.trim().toLowerCase()
      const allResults: SearchResult[] = []

      try {
        // Search vendors
        const { data: vendors } = await supabase
          .from('vendors')
          .select('id, vendor_code, legal_name, trade_name')
          .is('deleted_at', null)
          .or(`legal_name.ilike.%${q}%,vendor_code.ilike.%${q}%,trade_name.ilike.%${q}%`)
          .limit(5)

        vendors?.forEach(v => allResults.push({
          id: v.id,
          title: v.legal_name,
          subtitle: v.trade_name || undefined,
          code: v.vendor_code,
          category: 'vendor',
          href: `/vendors/${v.id}`,
        }))

        // Search items
        const { data: items } = await supabase
          .from('items')
          .select('id, item_code, generic_name, brand_name')
          .is('deleted_at', null)
          .or(`generic_name.ilike.%${q}%,item_code.ilike.%${q}%,brand_name.ilike.%${q}%`)
          .limit(5)

        items?.forEach(it => allResults.push({
          id: it.id,
          title: it.generic_name,
          subtitle: it.brand_name || undefined,
          code: it.item_code,
          category: 'item',
          href: `/items/${it.id}`,
        }))

        // Search POs
        const { data: pos } = await supabase
          .from('purchase_orders')
          .select('id, po_number')
          .is('deleted_at', null)
          .ilike('po_number', `%${q}%`)
          .limit(5)

        pos?.forEach(po => allResults.push({
          id: po.id,
          title: po.po_number,
          category: 'po',
          href: `/purchase-orders/${po.id}`,
        }))

        // Search GRNs
        const { data: grns } = await supabase
          .from('grns')
          .select('id, grn_number')
          .ilike('grn_number', `%${q}%`)
          .limit(3)

        grns?.forEach(g => allResults.push({
          id: g.id,
          title: g.grn_number,
          category: 'grn',
          href: `/grn/${g.id}`,
        }))

        // Filter pages
        const pageMatches = QUICK_PAGES.filter(p =>
          p.title.toLowerCase().includes(q)
        ).slice(0, 4)

        setResults([...allResults, ...pageMatches])
        setSelectedIndex(0)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(debounceRef.current)
  }, [query])

  const visibleResults = query.trim() ? results : QUICK_PAGES.slice(0, 8)

  const navigate = useCallback((result: SearchResult) => {
    setOpen(false)
    router.push(result.href)
  }, [router])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, visibleResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && visibleResults[selectedIndex]) {
      e.preventDefault()
      navigate(visibleResults[selectedIndex])
    }
  }

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Command palette">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={() => setOpen(false)}
        style={{ animationDuration: '150ms' }}
      />

      {/* Dialog */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-full max-w-[560px] mx-4 animate-scale-in">
        <div className="bg-white rounded-2xl shadow-overlay border border-gray-200/60 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-gray-100">
            {loading ? (
              <Loader2 size={18} className="text-gray-400 animate-spin flex-shrink-0" />
            ) : (
              <Search size={18} className="text-gray-400 flex-shrink-0" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search vendors, items, POs, pages..."
              className="flex-1 h-12 text-sm bg-transparent border-0 outline-none placeholder:text-gray-400"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden sm:flex items-center gap-0.5 h-6 px-1.5 text-[10px] font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2">
            {visibleResults.length === 0 && query.trim() && !loading && (
              <div className="px-4 py-8 text-center">
                <Search size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No results for &ldquo;{query}&rdquo;</p>
              </div>
            )}

            {!query.trim() && (
              <div className="px-3 py-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-2">Quick navigation</span>
              </div>
            )}

            {visibleResults.map((result, i) => {
              const meta = CATEGORY_META[result.category]
              return (
                <button
                  key={result.id}
                  onClick={() => navigate(result)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    selectedIndex === i ? 'bg-navy-50' : 'hover:bg-gray-50'
                  )}
                >
                  <span className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', meta.color)}>
                    {meta.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{result.title}</span>
                      {result.code && (
                        <span className="text-2xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">{result.code}</span>
                      )}
                    </div>
                    {result.subtitle && (
                      <span className="text-xs text-gray-400 truncate block">{result.subtitle}</span>
                    )}
                  </div>
                  {selectedIndex === i && (
                    <CornerDownLeft size={14} className="text-gray-400 flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-4 text-[10px] text-gray-400">
            <span className="flex items-center gap-1"><kbd className="font-mono bg-gray-100 px-1 py-0.5 rounded border border-gray-200">↑↓</kbd> navigate</span>
            <span className="flex items-center gap-1"><kbd className="font-mono bg-gray-100 px-1 py-0.5 rounded border border-gray-200">↵</kbd> open</span>
            <span className="flex items-center gap-1"><kbd className="font-mono bg-gray-100 px-1 py-0.5 rounded border border-gray-200">esc</kbd> close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
