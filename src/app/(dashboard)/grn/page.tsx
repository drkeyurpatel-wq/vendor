import Link from 'next/link'
import { Plus } from 'lucide-react'
export default function GRNPage() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Goods Receipt Notes</h1>
        <Link href="/grn/new" className="btn-primary"><Plus size={16}/> New GRN</Link>
      </div>
      <div className="card p-12 text-center text-gray-400">
        <p className="font-medium">GRN management — building Day 3</p>
      </div>
    </div>
  )
}
