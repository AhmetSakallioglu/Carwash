import type { User } from '@supabase/supabase-js'
import { allowedAdminEmails, verifyAdminSessionToken } from '@/lib/admin-session'

export { allowedAdminEmails } from '@/lib/admin-session'

export function isAllowedAdmin(user: User | null | undefined): boolean {
  if (!user?.email) return false
  const allowlist = allowedAdminEmails()
  if (allowlist.length > 0) {
    return allowlist.includes(user.email.toLowerCase())
  }
  return false
}

export function adminIdentityFromCookie(token?: string | null) {
  return verifyAdminSessionToken(token)
}
