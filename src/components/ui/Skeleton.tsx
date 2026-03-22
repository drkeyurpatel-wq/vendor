'use client'

import { cn } from '@/lib/utils'

// ─── Base Skeleton ────────────────────────────────────────

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  style?: React.CSSProperties
}

export function Skeleton({ className, width, height, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-gray-100 animate-shimmer',
        className
      )}
      style={{
        width,
        height,
        backgroundImage: 'linear-gradient(90deg, #f1f5f9 0%, #e8ecf2 40%, #f1f5f9 80%)',
        backgroundSize: '200% 100%',
        ...style,
      }}
    />
  )
}

// ─── Stat Card Skeleton ───────────────────────────────────

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-3 h-3 rounded-full" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

// ─── Table Skeleton ───────────────────────────────────────

export function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-card overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
        <Skeleton className="h-9 flex-1 max-w-sm" />
        <Skeleton className="h-9 w-24" />
      </div>
      {/* Header */}
      <div className="bg-navy-600/10 px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3" style={{ width: `${80 + Math.random() * 60}px` }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, ri) => (
        <div key={ri} className="px-4 py-3 border-b border-gray-50 flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, ci) => (
            <Skeleton
              key={ci}
              className="h-4"
              style={{ width: `${50 + Math.random() * 80}px` }}
            />
          ))}
        </div>
      ))}
      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="w-8 h-8 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Chart Skeleton ───────────────────────────────────────

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200/80 shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="p-5" style={{ height }}>
        <div className="w-full h-full flex items-end gap-3 px-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <Skeleton
                className="w-full rounded-t-md"
                style={{ height: `${25 + Math.random() * 60}%` }}
              />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page Skeleton ────────────────────────────────────────

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      {/* Table */}
      <TableSkeleton />
    </div>
  )
}
