export default function POLoading() {
  return (
    <div className="animate-pulse">
      <div className="page-header">
        <div>
          <div className="h-7 bg-gray-200 rounded w-48 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-56" />
        </div>
        <div className="h-10 bg-gray-200 rounded w-32" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card"><div className="h-6 bg-gray-200 rounded w-16 mb-1" /><div className="h-4 bg-gray-100 rounded w-24" /></div>
        ))}
      </div>
      <div className="card">
        <table className="w-full">
          <thead><tr className="bg-gray-50">{[1, 2, 3, 4, 5, 6].map(i => <th key={i} className="p-3"><div className="h-4 bg-gray-200 rounded w-20" /></th>)}</tr></thead>
          <tbody>
            {[1, 2, 3, 4, 5].map(i => (
              <tr key={i} className="border-t border-gray-100">{[1, 2, 3, 4, 5, 6].map(j => <td key={j} className="p-3"><div className="h-4 bg-gray-100 rounded" /></td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
