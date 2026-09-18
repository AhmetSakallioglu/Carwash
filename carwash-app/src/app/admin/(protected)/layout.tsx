import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/admin/AdminShell'
import { getAdminUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Admin',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await getAdminUser()
  if (!user) {
    redirect('/admin/login')
  }

  return <AdminShell userEmail={user.email}>{children}</AdminShell>
}
