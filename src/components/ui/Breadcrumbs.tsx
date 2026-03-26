'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

const PATH_LABELS: Record<string, string> = {
  vendors: 'Vendors',
  items: 'Items',
  'purchase-orders': 'Purchase Orders',
  grn: 'GRN',
  finance: 'Finance',
  invoices: 'Invoices',
  payments: 'Payments',
  credit: 'Credit Period',
  reports: 'Reports',
  settings: 'Settings',
  users: 'Users',
  centres: 'Centres',
  approvals: 'Approvals',
  categories: 'Categories',
  stock: 'Stock Levels',
  indents: 'Indents',
  new: 'New',
  documents: 'Documents',
  'rate-contracts': 'Rate Contracts',
  'vendor-performance': 'Vendor Performance',
}

export default function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length <= 1) return null

  // Skip UUID-like segments from display but keep them in paths
  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/')
    const isUUID = /^[0-9a-f]{8}-/.test(seg)
    const label = isUUID ? 'Detail' : PATH_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1)
    return { label, href }
  })

  return (
    <nav className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
      <Link href="/" className="hover:text-gray-600 transition-colors">
        <Home size={13} />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight size={12} />
          {i === crumbs.length - 1 ? (
            <span className="text-gray-600 font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-gray-600 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
