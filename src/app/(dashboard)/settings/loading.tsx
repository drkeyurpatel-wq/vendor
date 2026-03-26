export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-32 bg-gray-100 rounded" />
        </div>
        <div className="h-9 w-28 bg-gray-200 rounded-lg" />
      </div>
      <div className="flex gap-2 mb-5">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-8 w-20 bg-gray-100 rounded-lg" />
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-10 bg-gray-50 border-b" />
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="flex items-center px-5 py-4 border-b border-gray-100 gap-4">
            <div className="h-4 flex-1 bg-gray-100 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
