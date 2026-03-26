'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'

interface SearchInputProps {
  placeholder?: string
  paramName?: string
}

export default function SearchInput({ placeholder = 'Search...', paramName = 'q' }: SearchInputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get(paramName) || '')

  const applySearch = useCallback((search: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (search.trim()) {
      params.set(paramName, search.trim())
    } else {
      params.delete(paramName)
    }
    params.delete('page') // Reset to page 1 on search
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams, paramName])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      applySearch(value)
    }
  }

  function handleClear() {
    setValue('')
    applySearch('')
  }

  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10" />
      <input
        type="text"
        className="form-input pl-11 pr-8 w-full md:w-72"
        placeholder={placeholder}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-600"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
