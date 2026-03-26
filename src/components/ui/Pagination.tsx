'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  totalCount: number
  pageSize?: number
  currentPage: number
}

export default function Pagination({ totalCount, pageSize = 50, currentPage }: PaginationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const totalPages = Math.ceil(totalCount / pageSize)

  if (totalPages <= 1) return null

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    return `${pathname}?${params.toString()}`
  }

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('...')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 gap-2">
      <div className="text-sm text-gray-500 hidden sm:block">
        Showing {Math.min((currentPage - 1) * pageSize + 1, totalCount)}–{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
      </div>
      <div className="flex items-center gap-1">
        {currentPage > 1 && (
          <Link href={buildHref(currentPage - 1)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
            <ChevronLeft size={16} />
          </Link>
        )}
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-gray-500">...</span>
          ) : (
            <Link
              key={p}
              href={buildHref(p)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                p === currentPage
                  ? 'bg-navy-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {p}
            </Link>
          )
        )}
        {currentPage < totalPages && (
          <Link href={buildHref(currentPage + 1)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
            <ChevronRight size={16} />
          </Link>
        )}
      </div>
    </div>
  )
}
