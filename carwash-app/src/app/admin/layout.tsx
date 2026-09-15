'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminNav } from '@/components/admin/AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    if (pathname === '/admin/login') return

    const checkUser = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase.auth.getUser()
        if (data.user?.email) {
          setUserEmail(data.user.email)
        } else {
          // Check for demo session cookie
          const hasDemoCookie = document.cookie.includes('apex_admin_session=demo_active')
          if (hasDemoCookie) {
            setUserEmail('admin@apexdetailaustin.com (Demo)')
          }
        }
      } catch {
        setUserEmail('admin@apexdetailaustin.com')
      }
    }

    checkUser()
  }, [pathname])

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      // Ignore
    }
    document.cookie = 'apex_admin_session=; path=/; max-age=0;'
    router.push('/admin/login')
  }

  // If on login page, render cleanly without navbar
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col">
      <AdminNav userEmail={userEmail} onSignOut={handleSignOut} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
