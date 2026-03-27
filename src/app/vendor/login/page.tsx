'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Phone, ArrowRight, ShieldCheck, RefreshCw, CheckCircle } from 'lucide-react'

type Step = 'phone' | 'otp'

export default function VendorLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const accessError = searchParams.get('error')

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return
    const interval = setInterval(() => setResendTimer((t) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [resendTimer])

  // Auto-focus first OTP input
  useEffect(() => {
    if (step === 'otp') otpRefs.current[0]?.focus()
  }, [step])

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setError('Enter a valid 10-digit phone number')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/vendor-auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to send OTP. Please try again.')
        setLoading(false)
        return
      }

      setStep('otp')
      setResendTimer(60)
    } catch {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    // Auto-advance
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 filled
    if (newOtp.every((d) => d !== '') && value) {
      handleVerifyOTP(newOtp.join(''))
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const newOtp = pasted.split('')
      setOtp(newOtp)
      handleVerifyOTP(pasted)
    }
  }

  async function handleVerifyOTP(otpCode?: string) {
    setLoading(true)
    setError('')
    const code = otpCode || otp.join('')

    if (code.length !== 6) {
      setError('Enter the complete 6-digit OTP')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/vendor-auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/\D/g, ''), otp: code }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid OTP. Please try again.')
        setOtp(['', '', '', '', '', ''])
        otpRefs.current[0]?.focus()
        setLoading(false)
        return
      }

      // Success — redirect to portal dashboard
      router.push('/vendor')
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    }
    setLoading(false)
  }

  async function handleResend() {
    if (resendTimer > 0) return
    setLoading(true)
    setError('')
    setOtp(['', '', '', '', '', ''])

    try {
      const res = await fetch('/api/vendor-auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.replace(/\D/g, '') }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to resend OTP.')
      } else {
        setResendTimer(60)
      }
    } catch {
      setError('Network error.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12 relative overflow-y-auto bg-[#0f2847]">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#1B3A6B] rounded-full blur-[120px] opacity-60 -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#0D7E8A] rounded-full blur-[120px] opacity-40 translate-x-1/4 translate-y-1/4" />
      </div>
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl shadow-black/20 mb-4">
            <span className="text-xl sm:text-2xl font-extrabold text-[#1B3A6B] tracking-tight">H1</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Vendor Portal</h1>
          <p className="text-blue-300/60 text-sm mt-1.5 font-medium">Health1 Super Speciality Hospitals</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.95] backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 p-6 sm:p-8 border border-white/20">
          {accessError === 'access_disabled' && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl mb-5">
              Your portal access has been disabled. Contact Health1 admin.
            </div>
          )}

          {step === 'phone' ? (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your registered phone number to receive an OTP</p>

              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <div className="relative flex">
                    <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm font-medium">
                      +91
                    </span>
                    <div className="relative flex-1">
                      <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D7E8A] focus:border-transparent transition-all"
                        placeholder="98765 43210"
                        maxLength={10}
                        required
                        autoComplete="tel"
                        autoFocus
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || phone.replace(/\D/g, '').length < 10}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#0D7E8A] text-white rounded-xl text-sm font-semibold hover:bg-[#0a6972] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-lg shadow-[#0D7E8A]/20"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send OTP via WhatsApp
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Enter OTP</h2>
              <p className="text-sm text-gray-500 mb-6">
                Sent to <span className="font-semibold text-gray-700">+91 {phone.replace(/(\d{5})(\d{5})/, '$1 $2')}</span>
                <button onClick={() => { setStep('phone'); setError('') }} className="text-[#0D7E8A] ml-2 hover:underline font-medium cursor-pointer">Change</button>
              </p>

              <div className="space-y-5">
                {/* OTP Input */}
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D7E8A] focus:border-transparent transition-all"
                    />
                  ))}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  onClick={() => handleVerifyOTP()}
                  disabled={loading || otp.some((d) => !d)}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#0D7E8A] text-white rounded-xl text-sm font-semibold hover:bg-[#0a6972] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-lg shadow-[#0D7E8A]/20"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Verify & Login
                    </>
                  )}
                </button>

                {/* Resend */}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <span className="text-sm text-gray-500">Resend OTP in <span className="font-semibold text-gray-700">{resendTimer}s</span></span>
                  ) : (
                    <button
                      onClick={handleResend}
                      disabled={loading}
                      className="text-sm font-medium text-[#0D7E8A] hover:underline cursor-pointer flex items-center gap-1 mx-auto"
                    >
                      <RefreshCw size={14} /> Resend OTP
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
              <ShieldCheck size={14} />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Secure Access</span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed text-center">
              OTP will be sent to your WhatsApp. If you don&apos;t receive it, an SMS will be sent as fallback.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
