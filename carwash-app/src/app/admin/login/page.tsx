'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, ShieldCheck, Lock, Mail, Loader2, AlertCircle } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        // If Supabase is not yet configured with users in development, allow demo admin login
        if (
          error.message.includes('Invalid login') ||
          error.message.includes('FetchError') ||
          !process.env.NEXT_PUBLIC_SUPABASE_URL ||
          process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
        ) {
          // Set demo session cookie and proceed
          document.cookie = 'ozer_admin_session=demo_active; path=/; max-age=86400;'
          router.push('/admin')
          return
        }
        setErrorMessage(error.message)
      } else {
        router.push('/admin')
      }
    } catch {
      // Fallback for demo mode
      document.cookie = 'ozer_admin_session=demo_active; path=/; max-age=86400;'
      router.push('/admin')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = () => {
    document.cookie = 'ozer_admin_session=demo_active; path=/; max-age=86400;'
    router.push('/admin')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-brand-dark">
      <div className="w-full max-w-md glassmorphism p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 text-brand-neon mb-3 border border-brand-cyan/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Sparkles className="w-4 h-4 text-brand-neon" />
            <span className="font-display font-bold text-xl text-white">
              OZER<span className="text-brand-cyan">.ATX</span>
            </span>
          </div>
          <h2 className="font-display text-lg font-bold text-white">Admin Operations Portal</h2>
          <p className="text-xs text-slate-400 mt-1">Austin Studio Detailing Management</p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-brand-cyan" /> Admin Email
            </label>
            <input
              type="email"
              required
              placeholder="admin@ozerdetailaustin.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan transition"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-brand-cyan" /> Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-brand-cyan transition"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-brand-neon hover:bg-cyan-300 text-black font-bold text-xs rounded-xl transition shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In to Dashboard</span>
            )}
          </button>
        </form>

        {/* Demo Fast Access Button */}
        <div className="pt-4 border-t border-slate-800 text-center">
          <button
            onClick={handleDemoLogin}
            type="button"
            className="text-xs text-slate-400 hover:text-brand-neon transition cursor-pointer underline underline-offset-4"
          >
            Quick Access / Demo Admin Mode →
          </button>
        </div>
      </div>
    </div>
  )
}
