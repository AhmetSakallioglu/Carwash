'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminNav } from '@/components/admin/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState<string | null>('admin@ozerdetailaustin.com')

  useEffect(() => {
    if (pathname === '/admin/login') return

    let cancelled = false

    const checkUser = async () => {
      try {
        const hasDemoCookie = document.cookie.includes('ozer_admin_session=demo_active')
        if (hasDemoCookie) {
          if (!cancelled) setUserEmail('admin@ozerdetailaustin.com (Demo)')
          return
        }

        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        if (!cancelled && data.user?.email) {
          setUserEmail(data.user.email)
        }
      } catch {
        if (!cancelled) setUserEmail('admin@ozerdetailaustin.com')
      }
    }

    void checkUser()
    return () => {
      cancelled = true
    }
  }, [pathname])

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      // Ignore auth errors on demo sessions
    }
    document.cookie = 'ozer_admin_session=; path=/; max-age=0;'
    router.push('/admin/login')
  }

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col">
      <AdminNav userEmail={userEmail} onSignOut={handleSignOut} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 pb-24 md:pb-8 min-w-0">
        {children}
      </main>
    </div>
  )
}
