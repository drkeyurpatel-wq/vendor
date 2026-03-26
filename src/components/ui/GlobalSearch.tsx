'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, Package, ShoppingCart, ClipboardList, FileText, Loader2 } from 'lucide-react'

interface SearchResult {
  id: string
  type: 'vendor' | 'item' | 'purchase_order' | 'grn' | 'invoice'
  title: string
  subtitle: string | null
}

const TYPE_CONFIG = {
  vendor: {
    label: 'Vendors',
    icon: Users,
    href: (id: string) => `/vendors/${id}`,
    color: 'text-navy-600',
    bg: 'bg-navy-50',
  },
  item: {
    label: 'Items',
    icon: Package,
    href: (id: string) => `/items/${id}`,
    color: 'text-teal-500',
    bg: 'bg-teal-50',
  },
  purchase_order: {
    label: 'Purchase Orders',
    icon: ShoppingCart,
    href: (id: string) => `/purchase-orders/${id}`,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  grn: {
    label: 'GRNs',
    icon: ClipboardList,
    href: (id: string) => `/grn/${id}`,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  invoice: {
    label: 'Invoices',
    icon: FileText,
    href: () => `/finance/invoices`,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
} as const

type ResultType = keyof typeof TYPE_CONFIG

export default function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        if (res.ok) {
          const data = await res.json()
          setResults(data.results || [])
        } else {
          setResults([])
        }
      } catch {
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Group results by type
  const grouped = results.reduce<Record<ResultType, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = []
    acc[r.type].push(r)
    return acc
  }, {} as Record<ResultType, SearchResult[]>)

  const flatResults = results
  const hasResults = flatResults.length > 0

  // Navigate to result
  const navigateTo = useCallback((result: SearchResult) => {
    const config = TYPE_CONFIG[result.type]
    router.push(config.href(result.id))
    setIsOpen(false)
    setQuery('')
    setResults([])
    inputRef.current?.blur()
  }, [router])

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // "/" to focus search (only when not typing in an input)
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Handle input keyboard navigation
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => (prev < flatResults.length - 1 ? prev + 1 : 0))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => (prev > 0 ? prev - 1 : flatResults.length - 1))
      return
    }
    if (e.key === 'Enter' && activeIndex >= 0 && activeIndex < flatResults.length) {
      e.preventDefault()
      navigateTo(flatResults[activeIndex])
    }
  }

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1)
  }, [results])

  const showDropdown = isOpen && query.trim().length >= 2

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative group">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-teal-500 transition-colors pointer-events-none z-10"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search vendors, POs, items..."
          className="w-full pl-11 pr-12 py-2 bg-gray-50/80 border border-gray-200/80 rounded-xl text-sm focus:outline-none focus:border-teal-500/40 focus:bg-white focus:shadow-md focus:shadow-teal-500/5 transition-all placeholder:text-gray-500"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 text-gray-500 pointer-events-none">
          {isLoading ? (
            <Loader2 size={14} className="animate-spin text-teal-500" />
          ) : (
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono border border-gray-200">/</kbd>
          )}
        </div>
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-[400px] overflow-y-auto z-50">
          {isLoading && !hasResults && (
            <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Searching...</span>
            </div>
          )}

          {!isLoading && !hasResults && (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Search size={24} className="mb-2 opacity-40" />
              <span className="text-sm">No results for &ldquo;{query.trim()}&rdquo;</span>
              <span className="text-xs mt-1">Try a different search term</span>
            </div>
          )}

          {hasResults && (
            <div className="py-2">
              {(Object.keys(TYPE_CONFIG) as ResultType[]).map((type) => {
                const group = grouped[type]
                if (!group || group.length === 0) return null
                const config = TYPE_CONFIG[type]
                const Icon = config.icon

                return (
                  <div key={type}>
                    <div className="px-4 py-1.5 flex items-center gap-2">
                      <Icon size={12} className={config.color} />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        {config.label}
                      </span>
                    </div>
                    {group.map((result) => {
                      const globalIdx = flatResults.indexOf(result)
                      const isActive = globalIdx === activeIndex
                      return (
                        <button
                          key={result.id}
                          onClick={() => navigateTo(result)}
                          onMouseEnter={() => setActiveIndex(globalIdx)}
                          className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                            isActive ? 'bg-navy-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon size={14} className={config.color} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-800 truncate">
                              {result.title}
                            </div>
                            {result.subtitle && (
                              <div className="text-xs text-gray-500 truncate">
                                {result.subtitle}
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
