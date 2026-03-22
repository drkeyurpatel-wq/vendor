'use client'

import { useState, useMemo, useCallback, useTransition } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
  type Row,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Download, Search, SlidersHorizontal, X, Columns3,
  Loader2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  pageSize?: number
  showPagination?: boolean
  showSearch?: boolean
  showColumnToggle?: boolean
  showExport?: boolean
  exportFilename?: string
  emptyIcon?: React.ReactNode
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  isLoading?: boolean
  onRowClick?: (row: TData) => void
  stickyHeader?: boolean
  compact?: boolean
  className?: string
  // Server-side pagination
  totalRows?: number
  serverPage?: number
  onServerPageChange?: (page: number) => void
  serverPageSize?: number
  onServerPageSizeChange?: (size: number) => void
}

// ─── Skeleton Row ─────────────────────────────────────────

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-100 rounded animate-shimmer" 
            style={{
              width: `${50 + Math.random() * 40}%`,
              backgroundImage: 'linear-gradient(90deg, #f1f5f9 0%, #e8ecf2 40%, #f1f5f9 80%)',
              backgroundSize: '200% 100%',
            }} 
          />
        </td>
      ))}
    </tr>
  )
}

// ─── Empty State ──────────────────────────────────────────

function TableEmpty({ 
  icon, title, description, action 
}: { 
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      {icon && <div className="text-gray-300 mb-4">{icon}</div>}
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {description && <p className="text-xs text-gray-400 mt-1.5 text-center max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ─── Sort Icon ────────────────────────────────────────────

function SortIcon({ direction }: { direction: false | 'asc' | 'desc' }) {
  if (direction === 'asc') return <ChevronUp size={14} className="text-teal-500" />
  if (direction === 'desc') return <ChevronDown size={14} className="text-teal-500" />
  return <ChevronsUpDown size={14} className="text-white/40 group-hover:text-white/70 transition-colors" />
}

// ─── Main Component ───────────────────────────────────────

export default function DataTable<TData>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search...',
  pageSize = 25,
  showPagination = true,
  showSearch = true,
  showColumnToggle = false,
  showExport = false,
  exportFilename = 'export',
  emptyIcon,
  emptyTitle = 'No data found',
  emptyDescription,
  emptyAction,
  isLoading = false,
  onRowClick,
  stickyHeader = true,
  compact = false,
  className,
  totalRows,
  serverPage,
  onServerPageChange,
  serverPageSize,
  onServerPageSizeChange,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [showColumns, setShowColumns] = useState(false)
  const [isPending, startTransition] = useTransition()

  const isServerPaginated = totalRows !== undefined && onServerPageChange !== undefined

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      ...(isServerPaginated ? {} : {}),
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: isServerPaginated ? undefined : getPaginationRowModel(),
    initialState: {
      pagination: { pageSize },
    },
  })

  const rows = table.getRowModel().rows
  const headerGroups = table.getHeaderGroups()

  // Export to CSV
  const handleExport = useCallback(() => {
    const headers = table.getVisibleFlatColumns()
      .filter(c => c.id !== 'actions' && c.id !== 'select')
      .map(c => typeof c.columnDef.header === 'string' ? c.columnDef.header : c.id)
    
    const csvRows = rows.map(row => 
      table.getVisibleFlatColumns()
        .filter(c => c.id !== 'actions' && c.id !== 'select')
        .map(c => {
          const val = row.getValue(c.id)
          const str = String(val ?? '')
          return str.includes(',') ? `"${str}"` : str
        })
    )
    
    const csv = [headers.join(','), ...csvRows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exportFilename}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [rows, table, exportFilename])

  // Pagination info
  const currentPage = isServerPaginated ? (serverPage ?? 0) : table.getState().pagination.pageIndex
  const currentPageSize = isServerPaginated ? (serverPageSize ?? pageSize) : table.getState().pagination.pageSize
  const totalPageCount = isServerPaginated 
    ? Math.ceil((totalRows ?? 0) / currentPageSize)
    : table.getPageCount()
  const totalRowCount = isServerPaginated ? (totalRows ?? 0) : table.getFilteredRowModel().rows.length
  const startRow = currentPage * currentPageSize + 1
  const endRow = Math.min(startRow + currentPageSize - 1, totalRowCount)

  const cellPadding = compact ? 'px-3 py-2' : 'px-4 py-3'
  const headerPadding = compact ? 'px-3 py-2.5' : 'px-4 py-3'

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200/80 shadow-card overflow-hidden', className)}>
      {/* Toolbar */}
      {(showSearch || showColumnToggle || showExport) && (
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          {showSearch && (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={globalFilter ?? ''}
                onChange={e => {
                  startTransition(() => setGlobalFilter(e.target.value))
                }}
                placeholder={searchPlaceholder}
                className="w-full h-9 pl-9 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
              {globalFilter && (
                <button
                  onClick={() => setGlobalFilter('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2 ml-auto">
            {showColumnToggle && (
              <div className="relative">
                <button
                  onClick={() => setShowColumns(!showColumns)}
                  className="h-9 px-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1.5"
                >
                  <Columns3 size={14} /> Columns
                </button>
                {showColumns && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-elevated z-20 p-2 animate-scale-in">
                    {table.getAllColumns()
                      .filter(c => c.getCanHide())
                      .map(column => (
                        <label key={column.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={column.getIsVisible()}
                            onChange={column.getToggleVisibilityHandler()}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500/20"
                          />
                          {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                        </label>
                      ))}
                  </div>
                )}
              </div>
            )}

            {showExport && (
              <button
                onClick={handleExport}
                className="h-9 px-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1.5"
              >
                <Download size={14} /> Export
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            {headerGroups.map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className={cn(
                      headerPadding,
                      'text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-white whitespace-nowrap select-none',
                      'bg-gradient-to-r from-navy-600 to-navy-600/95',
                      stickyHeader && 'sticky top-0 z-[1]',
                      header.column.getCanSort() && 'cursor-pointer group',
                    )}
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1.5">
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <SortIcon direction={header.column.getIsSorted()} />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length} />
              ))
            ) : rows.length > 0 ? (
              rows.map((row, i) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    'border-b border-gray-100/80 last:border-0 transition-colors',
                    onRowClick && 'cursor-pointer',
                    'hover:bg-gray-50/80',
                    i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30',
                  )}
                  style={{
                    animationDelay: `${Math.min(i * 30, 300)}ms`,
                  }}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className={cn(cellPadding, 'text-[13px] text-gray-700 align-middle')}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : null}
          </tbody>
        </table>

        {/* Empty State */}
        {!isLoading && rows.length === 0 && (
          <TableEmpty
            icon={emptyIcon}
            title={emptyTitle}
            description={globalFilter ? 'Try adjusting your search or filters' : emptyDescription}
            action={!globalFilter ? emptyAction : undefined}
          />
        )}
      </div>

      {/* Pagination */}
      {showPagination && totalRowCount > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between gap-4 flex-wrap">
          <div className="text-xs text-gray-500">
            Showing <span className="font-medium text-gray-700">{startRow}</span> to{' '}
            <span className="font-medium text-gray-700">{endRow}</span> of{' '}
            <span className="font-medium text-gray-700">{totalRowCount.toLocaleString('en-IN')}</span> results
          </div>

          <div className="flex items-center gap-1.5">
            {/* Page size selector */}
            <select
              value={currentPageSize}
              onChange={e => {
                const size = Number(e.target.value)
                if (isServerPaginated) {
                  onServerPageSizeChange?.(size)
                } else {
                  table.setPageSize(size)
                }
              }}
              className="h-8 px-2 text-xs border border-gray-200 rounded-lg bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              {[10, 25, 50, 100].map(size => (
                <option key={size} value={size}>{size} / page</option>
              ))}
            </select>

            <div className="flex items-center gap-0.5 ml-2">
              <button
                onClick={() => isServerPaginated ? onServerPageChange?.(0) : table.setPageIndex(0)}
                disabled={currentPage === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="First page"
              >
                <ChevronsLeft size={15} />
              </button>
              <button
                onClick={() => isServerPaginated ? onServerPageChange?.(currentPage - 1) : table.previousPage()}
                disabled={currentPage === 0}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft size={15} />
              </button>

              {/* Page numbers */}
              {generatePageNumbers(currentPage, totalPageCount).map((p, i) => (
                p === '...' ? (
                  <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => isServerPaginated ? onServerPageChange?.(p as number) : table.setPageIndex(p as number)}
                    className={cn(
                      'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors',
                      currentPage === p
                        ? 'bg-navy-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    {(p as number) + 1}
                  </button>
                )
              ))}

              <button
                onClick={() => isServerPaginated ? onServerPageChange?.(currentPage + 1) : table.nextPage()}
                disabled={currentPage >= totalPageCount - 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight size={15} />
              </button>
              <button
                onClick={() => isServerPaginated ? onServerPageChange?.(totalPageCount - 1) : table.setPageIndex(totalPageCount - 1)}
                disabled={currentPage >= totalPageCount - 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Last page"
              >
                <ChevronsRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page Number Generator ────────────────────────────────

function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  
  const pages: (number | '...')[] = []
  
  if (current <= 3) {
    for (let i = 0; i < 5; i++) pages.push(i)
    pages.push('...')
    pages.push(total - 1)
  } else if (current >= total - 4) {
    pages.push(0)
    pages.push('...')
    for (let i = total - 5; i < total; i++) pages.push(i)
  } else {
    pages.push(0)
    pages.push('...')
    for (let i = current - 1; i <= current + 1; i++) pages.push(i)
    pages.push('...')
    pages.push(total - 1)
  }
  
  return pages
}
