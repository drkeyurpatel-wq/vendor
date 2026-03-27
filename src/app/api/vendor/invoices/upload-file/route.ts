import { NextRequest, NextResponse } from 'next/server'
import { requireVendorApiAuth } from '@/lib/vendor-auth'

export async function POST(request: NextRequest) {
  const session = await requireVendorApiAuth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const poId = formData.get('po_id') as string

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only PDF, JPG, and PNG files are allowed' }, { status: 400 })
    }

    // Validate file size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 10 MB' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
    const timestamp = Date.now()
    const path = `vendor-invoices/${session.vendorId}/${poId || 'general'}/${timestamp}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadErr } = await session.supabase.storage
      .from('documents')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadErr) {
      // If bucket doesn't exist, try creating it
      if (uploadErr.message?.includes('not found')) {
        await session.supabase.storage.createBucket('documents', { public: false })
        const { error: retryErr } = await session.supabase.storage
          .from('documents')
          .upload(path, buffer, { contentType: file.type, upsert: false })
        if (retryErr) {
          console.error('[Invoice Upload] Retry error:', retryErr)
          return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
        }
      } else {
        console.error('[Invoice Upload] Error:', uploadErr)
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, path })
  } catch (err: any) {
    console.error('[Invoice Upload] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
