'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Lock, Mail, ArrowRight, ShieldCheck, Phone, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

type AuthMode = 'email' | 'phone'

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function redirectByRole() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); router.refresh(); return }

    // Update last_login_at
    try {
      await supabase
        .from('user_profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id)
    } catch {
      // Non-blocking
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) { router.push('/'); router.refresh(); return }

    switch (profile.role) {
      case 'store_staff':
        router.push('/grn')
        break
      case 'vendor':
        router.push('/vendor-portal')
        break
      default:
        router.push('/')
    }
    router.refresh()
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      await redirectByRole()
    }
  }

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/^0+/, '')}`

    try {
      const res = await fetch('/api/auth/phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, action: 'send' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP')
        setLoading(false)
        return
      }
      setOtpSent(true)
    } catch {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone.replace(/^0+/, '')}`

    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      await redirectByRole()
    }
  }

  return (
    <div className="w-full animate-fade-in">
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl shadow-black/20 mb-4">
          <span className="text-xl sm:text-2xl font-extrabold text-[#1B3A6B] tracking-tight">H1</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Health1 VPMS</h1>
        <p className="text-blue-300/60 text-sm mt-1.5 font-medium">Vendor & Purchase Management System</p>
      </div>

      {/* Card */}
      <div className="bg-white/[0.95] backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 p-6 sm:p-8 border border-white/20">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h2>
        <p className="text-sm text-gray-400 mb-5">Sign in to your account to continue</p>

        {/* Auth mode toggle */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => { setMode('email'); setError(''); setOtpSent(false) }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === 'email' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mail size={14} /> Email
          </button>
          <button
            type="button"
            onClick={() => { setMode('phone'); setError('') }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
              mode === 'phone' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Phone size={14} /> Phone OTP
          </button>
        </div>

        {mode === 'email' ? (
          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="form-label">Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="form-input pl-10"
                  placeholder="you@health1.in"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="form-label mb-0">Password</label>
                <Link href="/forgot-password" className="text-xs text-[#0D7E8A] hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="form-input pl-10 pr-10"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base group">
              {loading ? (
                <><div className="spinner !border-white/30 !border-t-white" /> Signing in...</>
              ) : (
                <>Sign in <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} className="space-y-5">
            <div>
              <label htmlFor="phone" className="form-label">Mobile number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <div className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none">+91</div>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="form-input pl-[4.5rem]"
                  placeholder="9876543210"
                  required
                  disabled={otpSent}
                  autoComplete="tel"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">For store staff — enter registered mobile number</p>
            </div>

            {otpSent && (
              <div>
                <label htmlFor="otp" className="form-label">Enter OTP</label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="form-input text-center text-lg tracking-[0.3em] font-mono"
                  placeholder="000000"
                  required
                  maxLength={6}
                  autoComplete="one-time-code"
                />
                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(''); setError('') }}
                  className="text-xs text-[#0D7E8A] hover:underline mt-2"
                >
                  Change number / Resend OTP
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading || (phone.length < 10 && !otpSent)} className="btn-primary w-full justify-center py-3 text-base group">
              {loading ? (
                <><div className="spinner !border-white/30 !border-t-white" /> {otpSent ? 'Verifying...' : 'Sending OTP...'}</>
              ) : otpSent ? (
                <>Verify OTP <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></>
              ) : (
                <>Send OTP <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-100">
          <div className="flex items-center justify-center gap-2 text-gray-400 mb-2">
            <ShieldCheck size={14} />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Secure Access</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed text-center">
            Health1 Super Speciality Hospitals Pvt. Ltd.
            <br />
            Internal System — Authorized Users Only
          </p>
        </div>
      </div>
    </div>
  )
}
