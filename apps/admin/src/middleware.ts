// Edge middleware: fast-path cookie presence check.
//
// Runs on every request. If the session cookie is missing we redirect
// to `/login` immediately — avoiding a round-trip to the API for
// unauthenticated traffic. We do NOT verify the JWT here (no secret
// in edge runtime); the authoritative role + `must_change_password`
// check happens in server components via `getCurrentAdmin()`.

import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_SESSION_COOKIE } from './lib/env'

const PUBLIC_PATHS = ['/login']

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl

  // Skip middleware for public routes, static assets, and the proxy
  // (the proxy forwards the login request itself; blocking it would
  // trap the user).
  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const hasSession = req.cookies.has(ADMIN_SESSION_COOKIE)
  if (!hasSession) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    if (pathname !== '/') {
      url.searchParams.set('returnTo', pathname)
    }
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
