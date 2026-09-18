import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-session'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)
  const isAdminUser = Boolean(session)
  const isLoginPath = pathname === '/admin/login'
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/')
  const isAdminApi = pathname === '/api/admin' || pathname.startsWith('/api/admin/')

  if (isLoginPath) {
    if (isAdminUser) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next({ request })
  }

  if ((isAdminPage || isAdminApi) && !isAdminUser) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin', '/api/admin/:path*'],
}
