'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Lock, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Supabase processes the hash fragment from the magic link automatically
    // We just need to check if user has a valid session
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setSessionReady(true)
      } else {
        setError('Invalid or expired reset link. Please request a new one.')
      }
    }

    // Listen for auth state change (Supabase processes the token from URL)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })

    // Small delay to allow Supabase to process URL token
    const timer = setTimeout(checkSession, 1000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <div className="w-full animate-fade-in">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl shadow-black/20 mb-4">
          <span className="text-xl sm:text-2xl font-extrabold text-[#1B3A6B] tracking-tight">H1</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Reset Password</h1>
        <p className="text-blue-300/60 text-sm mt-1.5 font-medium">Choose a new secure password</p>
      </div>

      <div className="bg-white/[0.95] backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 p-6 sm:p-8 border border-white/20">
        {success ? (
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-2xl mb-4">
              <CheckCircle2 size={28} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Password updated</h2>
            <p className="text-sm text-gray-500 mb-6">
              Your password has been changed successfully. You can now sign in with your new password.
            </p>
            <Link href="/login" className="btn-primary w-full justify-center py-3 text-base">
              Sign in <ArrowRight size={16} />
            </Link>
          </div>
        ) : !sessionReady && error ? (
          <div className="text-center py-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Link expired</h2>
            <p className="text-sm text-gray-500 mb-6">{error}</p>
            <Link href="/forgot-password" className="btn-primary w-full justify-center py-3 text-base">
              Request New Link <ArrowRight size={16} />
            </Link>
          </div>
        ) : !sessionReady ? (
          <div className="text-center py-8">
            <div className="spinner mx-auto mb-4" />
            <p className="text-sm text-gray-500">Verifying reset link...</p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Set new password</h2>
            <p className="text-sm text-gray-400 mb-6">
              Choose a strong password with at least 8 characters.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="password" className="form-label">New password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="form-input pl-10 pr-10"
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
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
              <div>
                <label htmlFor="confirmPassword" className="form-label">Confirm new password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="form-input pl-10"
                    placeholder="Repeat your password"
                    required
                    minLength={8}
                    autoComplete="new-password"
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
                  <><div className="spinner !border-white/30 !border-t-white" /> Updating...</>
                ) : (
                  <>Update Password <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" /></>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
