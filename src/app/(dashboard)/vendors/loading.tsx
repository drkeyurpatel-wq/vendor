import { TableSkeleton, Skeleton } from '@/components/ui/Skeleton'

export default function VendorsLoading() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-lg" />
        ))}
      </div>
      <TableSkeleton rows={10} cols={7} />
    </div>
  )
}
