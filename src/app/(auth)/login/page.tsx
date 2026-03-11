'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
          <span className="text-2xl font-bold text-[#1B3A6B]">H1</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Health1 VPMS</h1>
        <p className="text-blue-200 text-sm mt-1">Vendor & Purchase Management System</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Sign in</h2>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="form-label">Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="form-input"
              placeholder="you@health1.in"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-2.5 text-base"
          >
            {loading ? (
              <>
                <div className="spinner !border-white !border-t-transparent" />
                Signing in...
              </>
            ) : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Health1 Super Speciality Hospitals Pvt. Ltd. — Internal System
        </p>
      </div>
    </div>
  )
}
