export default function ItemsLoading() {
  return (
    <div className="animate-pulse">
      <div className="page-header">
        <div>
          <div className="h-7 bg-gray-200 rounded w-36 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-48" />
        </div>
        <div className="h-10 bg-gray-200 rounded w-28" />
      </div>
      <div className="card mt-4">
        <div className="p-4 flex gap-3 border-b border-gray-100">
          <div className="h-9 bg-gray-100 rounded flex-1" />
          <div className="h-9 bg-gray-100 rounded w-32" />
        </div>
        <table className="w-full">
          <thead><tr className="bg-gray-50">{[1, 2, 3, 4, 5].map(i => <th key={i} className="p-3"><div className="h-4 bg-gray-200 rounded w-20" /></th>)}</tr></thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <tr key={i} className="border-t border-gray-100">{[1, 2, 3, 4, 5].map(j => <td key={j} className="p-3"><div className="h-4 bg-gray-100 rounded" /></td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
