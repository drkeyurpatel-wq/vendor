export default function ReportsLoading() {
  return (
    <div className="animate-pulse">
      <div className="page-header">
        <div>
          <div className="h-7 bg-gray-200 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-56" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card"><div className="h-6 bg-gray-200 rounded w-16 mb-2" /><div className="h-8 bg-gray-200 rounded w-24" /></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="card p-5 space-y-4">
            <div className="h-5 bg-gray-200 rounded w-36 mb-4" />
            {[1, 2, 3].map(j => (
              <div key={j}>
                <div className="flex justify-between mb-1"><div className="h-4 bg-gray-100 rounded w-32" /><div className="h-4 bg-gray-200 rounded w-20" /></div>
                <div className="h-2.5 bg-gray-100 rounded-full w-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
