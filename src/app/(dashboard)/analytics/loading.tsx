export default function AnalyticsLoading() {
  return (
    <div className="animate-pulse">
      <div className="page-header">
        <div>
          <div className="h-7 bg-gray-200 rounded w-56 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-72" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 bg-gray-100 rounded w-40" />
          <div className="h-9 bg-gray-200 rounded w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="stat-card"><div className="h-5 bg-gray-200 rounded w-20 mb-2" /><div className="h-8 bg-gray-200 rounded w-12" /></div>
        ))}
      </div>
      <div className="h-10 bg-gray-100 rounded w-full mb-4" />
      <div className="card p-5 space-y-3">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-12 bg-gray-100 rounded" />)}
      </div>
    </div>
  )
}
