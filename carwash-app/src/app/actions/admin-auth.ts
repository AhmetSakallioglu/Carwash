'use server'

import { cookies } from 'next/headers'
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  createAdminSessionToken,
  isAdminPasswordConfigured,
  verifyAdminCredentials,
} from '@/lib/admin-session'

export async function loginAdminAction(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  if (!isAdminPasswordConfigured()) {
    return {
      success: false,
      error: 'Admin email and password are not configured on the server.',
    }
  }

  if (!verifyAdminCredentials(email, password)) {
    return { success: false, error: 'Invalid email or password.' }
  }

  const cookieStore = await cookies()
  cookieStore.set(
    ADMIN_SESSION_COOKIE,
    createAdminSessionToken(email),
    adminSessionCookieOptions()
  )

  return { success: true }
}

export async function logoutAdminAction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_SESSION_COOKIE, '', {
    ...adminSessionCookieOptions(),
    maxAge: 0,
  })
}
