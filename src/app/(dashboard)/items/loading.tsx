import { TableSkeleton, Skeleton } from '@/components/ui/Skeleton'

export default function ItemsLoading() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-28 rounded-lg" />
      </div>
      <TableSkeleton rows={12} cols={8} />
    </div>
  )
}
