'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="w-full animate-fade-in">
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl shadow-black/20 mb-4">
          <span className="text-xl sm:text-2xl font-extrabold text-[#1B3A6B] tracking-tight">H1</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Forgot Password</h1>
        <p className="text-blue-300/60 text-sm mt-1.5 font-medium">We&apos;ll send you a reset link</p>
      </div>

      <div className="bg-white/[0.95] backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 p-6 sm:p-8 border border-white/20">
        {sent ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-2xl mb-4">
              <CheckCircle2 size={28} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-sm text-gray-500 mb-6">
              We sent a password reset link to <strong className="text-gray-700">{email}</strong>.
              <br />Click the link in the email to set a new password.
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Didn&apos;t receive it? Check your spam folder or try again.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="btn-secondary w-full justify-center"
              >
                Try another email
              </button>
              <Link href="/login" className="btn-primary w-full justify-center">
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Reset your password</h2>
            <p className="text-sm text-gray-400 mb-6">
              Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
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

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base group">
                {loading ? (
                  <><div className="spinner !border-white/30 !border-t-white" /> Sending link...</>
                ) : (
                  <>Send Reset Link <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-[#0D7E8A] hover:underline font-medium">
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
