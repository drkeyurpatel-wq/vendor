import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
export default function NewPOPage() {
  return (
    <div>
      <Link href="/purchase-orders" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft size={14}/> Back
      </Link>
      <h1 className="page-title mb-4">New Purchase Order</h1>
      <div className="card p-12 text-center text-gray-400">
        <p className="font-medium">Full PO creation form — building Day 4</p>
        <p className="text-sm mt-2">Will include: vendor selection, line items with rate contract lookup, approval routing</p>
      </div>
    </div>
  )
}
