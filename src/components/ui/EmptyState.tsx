'use client'

import { cn } from '@/lib/utils'
import { Package, Users, ShoppingCart, FileText, ClipboardList, Search, Inbox } from 'lucide-react'

type EmptyVariant = 'vendors' | 'items' | 'orders' | 'invoices' | 'grn' | 'search' | 'generic'

const variants: Record<EmptyVariant, { icon: React.ReactNode; defaultTitle: string; defaultDescription: string }> = {
  vendors: {
    icon: <Users size={44} strokeWidth={1.2} />,
    defaultTitle: 'No vendors yet',
    defaultDescription: 'Start by onboarding your first vendor to the system',
  },
  items: {
    icon: <Package size={44} strokeWidth={1.2} />,
    defaultTitle: 'No items found',
    defaultDescription: 'Add your first SKU to the item master',
  },
  orders: {
    icon: <ShoppingCart size={44} strokeWidth={1.2} />,
    defaultTitle: 'No purchase orders',
    defaultDescription: 'Create your first purchase order to get started',
  },
  invoices: {
    icon: <FileText size={44} strokeWidth={1.2} />,
    defaultTitle: 'No invoices',
    defaultDescription: 'Invoices will appear here once GRNs are processed',
  },
  grn: {
    icon: <ClipboardList size={44} strokeWidth={1.2} />,
    defaultTitle: 'No goods receipts',
    defaultDescription: 'GRNs will appear when you receive goods against purchase orders',
  },
  search: {
    icon: <Search size={44} strokeWidth={1.2} />,
    defaultTitle: 'No results found',
    defaultDescription: 'Try adjusting your search or filters',
  },
  generic: {
    icon: <Inbox size={44} strokeWidth={1.2} />,
    defaultTitle: 'Nothing here yet',
    defaultDescription: 'Data will appear as you start using the system',
  },
}

interface EmptyStateProps {
  variant?: EmptyVariant
  icon?: React.ReactNode
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
  compact?: boolean
}

export default function EmptyState({
  variant = 'generic',
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  const v = variants[variant]

  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      compact ? 'py-10 px-4' : 'py-16 px-6',
      className
    )}>
      {/* Decorative circle behind icon */}
      <div className="relative mb-4">
        <div className="absolute inset-0 -m-3 bg-gray-100/80 rounded-full" />
        <div className="relative text-gray-300">
          {icon || v.icon}
        </div>
      </div>

      <h3 className={cn(
        'font-semibold text-gray-600',
        compact ? 'text-sm' : 'text-base'
      )}>
        {title || v.defaultTitle}
      </h3>

      <p className={cn(
        'text-gray-400 mt-1.5 max-w-sm',
        compact ? 'text-xs' : 'text-sm'
      )}>
        {description || v.defaultDescription}
      </p>

      {action && (
        <div className="mt-5">
          {action}
        </div>
      )}
    </div>
  )
}
