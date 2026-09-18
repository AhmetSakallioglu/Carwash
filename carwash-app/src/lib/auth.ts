import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { AdminIdentity } from '@/lib/admin-session'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-session'

export type { AdminIdentity } from '@/lib/admin-session'

export async function getAdminUser(): Promise<AdminIdentity | null> {
  try {
    const cookieStore = await cookies()
    return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value)
  } catch {
    return null
  }
}

export async function unauthorizedIfNotAdmin(): Promise<NextResponse | null> {
  const user = await getAdminUser()
  if (user) return null
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
