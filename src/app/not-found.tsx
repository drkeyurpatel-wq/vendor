import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" role="alert">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileQuestion size={32} className="text-navy-600" aria-hidden="true" />
          </div>
          {/* Use h1 for proper heading hierarchy as this is a standalone page */}
          <h1 className="text-xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-sm text-gray-500 mb-6">
            The page you are looking for does not exist or has been moved.
            Please check the URL or navigate back to the dashboard.
          </p>
          <Link
            href="/"
            className="inline-block px-5 py-2.5 bg-navy-600 text-white text-sm font-medium rounded-lg hover:bg-navy-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
