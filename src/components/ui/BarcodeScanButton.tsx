'use client'

import { useState } from 'react'
import { Camera } from 'lucide-react'
import BarcodeScanner from './BarcodeScanner'

interface BarcodeScanButtonProps {
  onScan: (code: string) => void
  label?: string
  scanType?: 'item' | 'batch' | 'location'
}

export default function BarcodeScanButton({ onScan, label = 'Scan', scanType = 'item' }: BarcodeScanButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        title={label}
      >
        <Camera size={16} style={{ color: '#0D7E8A' }} />
        <span className="hidden sm:inline">{label}</span>
      </button>

      <BarcodeScanner
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onScan={onScan}
        scanType={scanType}
      />
    </>
  )
}
