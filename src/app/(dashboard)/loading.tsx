export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="page-header">
        <div>
          <div className="h-7 bg-gray-200 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-64" />
        </div>
        <div className="h-10 bg-gray-200 rounded w-40" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card">
            <div className="h-10 w-10 bg-gray-200 rounded-xl mb-3" />
            <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-4 bg-gray-100 rounded w-28 mb-1" />
            <div className="h-3 bg-gray-100 rounded w-36" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="card">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="h-5 bg-gray-200 rounded w-40" />
            </div>
            <div className="p-5 space-y-4">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="flex items-center gap-3">
                  <div className="h-4 bg-gray-100 rounded flex-1" />
                  <div className="h-4 bg-gray-200 rounded w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
