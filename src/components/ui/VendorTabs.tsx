'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface Tab {
  key: string
  label: string
  count?: number
  content: React.ReactNode
}

export default function VendorTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.key || '')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0 border-b border-gray-200 mb-0 overflow-x-auto" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active === tab.key}
            onClick={() => setActive(tab.key)}
            className={cn(
              'px-5 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px',
              active === tab.key
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                'ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                active === tab.key ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="pt-5 animate-fade-in" key={active}>
        {tabs.find(t => t.key === active)?.content}
      </div>
    </div>
  )
}
