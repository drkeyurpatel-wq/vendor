import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Auth: only callable from daily cron or with valid bearer token
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()

    const now = new Date()
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

    // Fetch all documents with expiry dates
    const { data: documents, error } = await supabase
      .from('vendor_documents')
      .select(`
        id,
        vendor_id,
        document_type,
        file_name,
        expires_at,
        is_verified,
        created_at,
        vendor:vendors(id, vendor_code, legal_name, primary_contact_email, primary_contact_phone)
      `)
      .not('expires_at', 'is', null)
      .order('expires_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const nowStr = now.toISOString().split('T')[0]
    const in30Str = in30Days.toISOString().split('T')[0]
    const in90Str = in90Days.toISOString().split('T')[0]

    const expired: typeof documents = []
    const expiring30: typeof documents = []
    const expiring90: typeof documents = []
    const valid: typeof documents = []

    for (const doc of documents || []) {
      const expiryDate = doc.expires_at
      if (!expiryDate) continue

      if (expiryDate < nowStr) {
        expired.push(doc)
      } else if (expiryDate <= in30Str) {
        expiring30.push(doc)
      } else if (expiryDate <= in90Str) {
        expiring90.push(doc)
      } else {
        valid.push(doc)
      }
    }

    const summary = {
      total: (documents || []).length,
      expired: expired.length,
      expiring_30_days: expiring30.length,
      expiring_90_days: expiring90.length,
      valid: valid.length,
      checked_at: now.toISOString(),
    }

    // Log the check to activity_log if there are critical items
    if (expired.length > 0 || expiring30.length > 0) {
      await supabase.from('activity_log').insert({
        action: 'document_expiry_check',
        entity_type: 'vendor_documents',
        details: JSON.stringify({
          expired: expired.length,
          expiring_30: expiring30.length,
          expiring_90: expiring90.length,
        }),
      })
    }

    return NextResponse.json({
      summary,
      expired,
      expiring_30_days: expiring30,
      expiring_90_days: expiring90,
      valid,
    })
  } catch (err) {
    console.error('Document expiry check failed:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
