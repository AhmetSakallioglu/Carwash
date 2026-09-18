import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

export const ADMIN_SESSION_COOKIE = 'ozer_admin_auth'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export type AdminIdentity = {
  email: string
}

function uniqueEmails(values: string[]): string[] {
  return [...new Set(values.map(value => value.trim().toLowerCase()).filter(Boolean))]
}

export function allowedAdminEmails(): string[] {
  const primary = process.env.ADMIN_EMAIL || ''
  const extras = (process.env.ADMIN_ALLOWED_EMAILS || '').split(',')
  return uniqueEmails([primary, ...extras])
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || ''
}

export function isAdminPasswordConfigured(): boolean {
  return Boolean(getAdminPassword().trim() && allowedAdminEmails().length > 0)
}

function sessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  )
}

function sha256(value: string): Buffer {
  return createHash('sha256').update(value).digest()
}

function safeEqual(a: string, b: string): boolean {
  const left = sha256(a)
  const right = sha256(b)
  return timingSafeEqual(left, right)
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  const allowed = allowedAdminEmails()
  const expectedPassword = getAdminPassword()
  if (!allowed.length || !expectedPassword.trim() || !email.trim() || !password) {
    return false
  }

  const normalizedEmail = email.trim().toLowerCase()
  if (!allowed.includes(normalizedEmail)) {
    return false
  }

  return safeEqual(password, expectedPassword)
}

export function createAdminSessionToken(email: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      email: email.trim().toLowerCase(),
      exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
    })
  ).toString('base64url')
  const signature = createHmac('sha256', sessionSecret()).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function verifyAdminSessionToken(token?: string | null): AdminIdentity | null {
  if (!token || !isAdminPasswordConfigured() || !sessionSecret()) return null

  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const expected = createHmac('sha256', sessionSecret()).update(payload).digest('base64url')
  const given = Buffer.from(signature)
  const wanted = Buffer.from(expected)
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return null
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      email?: string
      exp?: number
    }
    if (!data.email || typeof data.exp !== 'number' || data.exp < Date.now()) {
      return null
    }
    const email = data.email.trim().toLowerCase()
    if (!allowedAdminEmails().includes(email)) {
      return null
    }
    return { email }
  } catch {
    return null
  }
}

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  }
}
