export default function VendorPortalLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded-lg w-48 mb-2" />
      <div className="h-4 bg-gray-200 rounded-lg w-64 mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 h-24" />
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 h-64" />
    </div>
  )
}
