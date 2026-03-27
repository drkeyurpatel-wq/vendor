import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { setVendorSessionCookie } from '@/lib/vendor-auth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { phone, otp } = await request.json()

    if (!phone || !otp || otp.length !== 6) {
      return NextResponse.json({ success: false, error: 'Phone and 6-digit OTP required' }, { status: 400 })
    }

    const cleanPhone = phone.replace(/\D/g, '').slice(-10)

    const userAgent = request.headers.get('user-agent') || null
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null

    // Use the RPC to verify OTP and create session
    const { data, error } = await supabaseAdmin.rpc('verify_vendor_otp', {
      p_phone: cleanPhone,
      p_otp: otp,
      p_user_agent: userAgent,
      p_ip_address: ip,
    })

    if (error) {
      console.error('[Vendor OTP Verify] RPC error:', error)
      return NextResponse.json({ success: false, error: 'Verification failed' }, { status: 500 })
    }

    if (!data?.success) {
      return NextResponse.json({
        success: false,
        error: data?.error || 'Invalid or expired OTP'
      }, { status: 401 })
    }

    // Set session cookie
    await setVendorSessionCookie(data.session_token, data.expires_at)

    return NextResponse.json({
      success: true,
      vendor_id: data.vendor_id,
    })

  } catch (err: any) {
    console.error('[Vendor OTP Verify] Error:', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
