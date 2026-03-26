'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="w-full animate-fade-in">
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl shadow-black/20 mb-4">
          <span className="text-xl sm:text-2xl font-extrabold text-navy-600 tracking-tight">H1</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Health1 VPMS</h1>
        <p className="text-blue-300/60 text-sm mt-1.5 font-medium">Vendor & Purchase Management System</p>
      </div>

      {/* Card */}
      <div className="bg-white/[0.95] backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 p-6 sm:p-8 border border-white/20">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome back</h2>
        <p className="text-sm text-gray-500 mb-6 sm:mb-7">Sign in to your account to continue</p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="email" className="form-label">Email address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
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
            <label htmlFor="password" className="form-label">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="form-input pl-10"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
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
            disabled={loading}
            className="btn-primary w-full justify-center py-3 text-base group"
          >
            {loading ? (
              <>
                <div className="spinner !border-white/30 !border-t-white" />
                Signing in...
              </>
            ) : (
              <>
                Sign in
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-gray-100">
          <div className="flex items-center justify-center gap-2 text-gray-500 mb-2">
            <ShieldCheck size={14} />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Secure Access</span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed text-center">
            Health1 Super Speciality Hospitals Pvt. Ltd.
            <br />
            Internal System — Authorized Users Only
          </p>
        </div>
      </div>
    </div>
  )
}
