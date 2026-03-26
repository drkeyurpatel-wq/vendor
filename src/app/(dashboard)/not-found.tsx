import Link from 'next/link'
import { Search } from 'lucide-react'

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 mb-4">
          <Search className="text-gray-500" size={24} />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Page not found</h2>
        <p className="text-sm text-gray-500 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/" className="btn-primary">
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
