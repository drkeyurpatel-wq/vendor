import { NextResponse } from 'next/server'
import { clearVendorSession } from '@/lib/vendor-auth'

export async function POST() {
  await clearVendorSession()
  return NextResponse.json({ success: true })
}
