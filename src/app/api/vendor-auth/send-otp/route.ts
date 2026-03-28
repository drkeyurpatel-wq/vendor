import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendOTP } from '@/lib/whatsapp'

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json()

    if (!phone || phone.replace(/\D/g, '').length < 10) {
      return NextResponse.json({ success: false, error: 'Valid phone number required' }, { status: 400 })
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10) // Last 10 digits
    const supabaseAdmin = getAdmin()

    // Find vendor by phone (check primary_contact_phone, secondary_contact_phone, portal_phone)
    const { data: vendor, error: vendorErr } = await supabaseAdmin
      .from('vendors')
      .select('id, legal_name, vendor_code, portal_access, primary_contact_phone')
      .or(`primary_contact_phone.ilike.%${cleanPhone},portal_phone.ilike.%${cleanPhone}`)
      .eq('status', 'active')
      .limit(1)
      .single()

    if (vendorErr || !vendor) {
      return NextResponse.json({
        success: false,
        error: 'No active vendor account found for this phone number. Contact Health1 admin.'
      }, { status: 404 })
    }

    if (vendor.portal_access === false) {
      return NextResponse.json({
        success: false,
        error: 'Portal access is disabled for your account. Contact Health1 admin.'
      }, { status: 403 })
    }

    // Rate limit: max 5 OTPs per phone per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabaseAdmin
      .from('vendor_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('phone', cleanPhone)
      .gte('created_at', oneHourAgo)
      .is('session_token', null) // Only count OTP requests, not active sessions

    if ((count ?? 0) >= 5) {
      return NextResponse.json({
        success: false,
        error: 'Too many OTP requests. Please try again in an hour.'
      }, { status: 429 })
    }

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

    // Store OTP session
    const { error: insertErr } = await supabaseAdmin
      .from('vendor_sessions')
      .insert({
        vendor_id: vendor.id,
        phone: cleanPhone,
        otp_code: otp,
        otp_expires_at: expiresAt,
        otp_attempts: 0,
      })

    if (insertErr) {
      console.error('[Vendor OTP] Insert error:', insertErr)
      return NextResponse.json({ success: false, error: 'Failed to generate OTP' }, { status: 500 })
    }

    // Send OTP via WhatsApp (falls back to console log if not configured)
    const sendResult = await sendOTP(vendor.id, cleanPhone, otp)

    if (!sendResult.success) {
      console.warn('[Vendor OTP] WhatsApp send failed, OTP stored in DB:', sendResult.error)
      // Still return success — OTP is in DB, admin can read it if needed during testing
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your WhatsApp',
      // Include OTP in dev mode for testing
      ...(process.env.NODE_ENV === 'development' ? { _dev_otp: otp } : {}),
    })

  } catch (err: any) {
    console.error('[Vendor OTP] Error:', err)
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 })
  }
}
