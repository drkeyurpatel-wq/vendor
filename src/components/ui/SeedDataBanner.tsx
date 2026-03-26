'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Database, Loader2, CheckCircle, AlertTriangle, Building2, Tag, FolderTree } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  hasCentres: boolean
  hasVendorCategories: boolean
  hasItemCategories: boolean
}

export default function SeedDataBanner({ hasCentres, hasVendorCategories, hasItemCategories }: Props) {
  const router = useRouter()
  const [seeding, setSeeding] = useState(false)
  const [done, setDone] = useState(false)

  // If everything already exists, don't show
  if (hasCentres && hasVendorCategories && hasItemCategories) return null
  if (done) return null

  const missing: string[] = []
  if (!hasCentres) missing.push('Centres')
  if (!hasVendorCategories) missing.push('Vendor Categories')
  if (!hasItemCategories) missing.push('Item Categories')

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Seed failed')
        setSeeding(false)
        return
      }

      toast.success('Master data seeded successfully!')
      setDone(true)
      router.refresh()
    } catch {
      toast.error('Network error — please try again')
    } finally {
      setSeeding(false)
    }
  }

  return (
    <div className="mb-6 bg-gradient-to-r from-navy-600 to-[#234880] rounded-xl p-6 text-white shadow-lg animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Database size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold">Setup Required — Master Data Missing</h2>
          <p className="text-blue-200 text-sm mt-1">
            Your system needs master data before it can be used. Click the button below to populate:
          </p>

          <div className="flex flex-wrap gap-3 mt-3">
            {!hasCentres && (
              <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 text-sm">
                <Building2 size={14} />
                <span>5 Hospital Centres</span>
              </div>
            )}
            {!hasVendorCategories && (
              <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 text-sm">
                <Tag size={14} />
                <span>14 Vendor Categories</span>
              </div>
            )}
            {!hasItemCategories && (
              <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 text-sm">
                <FolderTree size={14} />
                <span>13 Parent + 30 Sub Item Categories</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-3 py-1.5 text-sm">
              <Tag size={14} />
              <span>10 Sample Vendors + 20 Items + Demo PO</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="bg-white text-navy-600 font-bold px-6 py-2.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              {seeding ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Seeding Master Data...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Seed All Master Data Now
                </>
              )}
            </button>
            <span className="text-blue-300/70 text-xs">
              Safe to run multiple times — skips existing data
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
