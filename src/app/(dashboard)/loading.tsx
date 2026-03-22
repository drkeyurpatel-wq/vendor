import { StatCardSkeleton, ChartSkeleton, TableSkeleton, Skeleton } from '@/components/ui/Skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32 rounded-lg" />
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartSkeleton height={300} />
        <ChartSkeleton height={300} />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TableSkeleton rows={5} cols={4} />
        <TableSkeleton rows={5} cols={4} />
      </div>
    </div>
  )
}
