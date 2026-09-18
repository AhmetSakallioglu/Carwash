'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { logoutAdminAction } from '@/app/actions/admin-auth'
import { AdminNav } from '@/components/admin/AdminNav'

export function AdminShell({
  userEmail,
  children,
}: {
  userEmail?: string | null
  children: React.ReactNode
}) {
  const router = useRouter()

  const handleSignOut = async () => {
    await logoutAdminAction()
    router.push('/admin/login')
    router.refresh()
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
