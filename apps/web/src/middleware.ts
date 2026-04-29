import { type NextRequest, NextResponse } from 'next/server'

/**
 * Middleware: theme cookie + auth gate + security headers + request id.
 * Edge runtime — keep this lightweight (no DB, no heavy imports).
 */

const PROTECTED_PREFIXES = [
  '/feed',
  '/discover',
  '/saved',
  '/bookings',
  '/studio',
  '/you',
  '/settings',
  '/publish',
  '/booking',
  '/quests',
  '/notifications',
]

const PUBLIC_AUTH_ROUTES = ['/signin', '/signup', '/verify-otp', '/forgot-password']

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function isAuthRoute(pathname: string): boolean {
  return PUBLIC_AUTH_ROUTES.some((p) => pathname === p)
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const sessionCookie = req.cookies.get('ch_session')?.value
  const isAuthenticated = Boolean(sessionCookie)

  // Auth gate — push unauthenticated users away from protected routes
  if (isProtected(pathname) && !isAuthenticated) {
    const url = req.nextUrl.clone()
    url.pathname = '/signin'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Already-authed visitors don't need to see signin/signup again
  if (isAuthRoute(pathname) && isAuthenticated) {
    const url = req.nextUrl.clone()
    url.pathname = '/feed'
    return NextResponse.redirect(url)
  }

  const requestId =
    req.headers.get('x-request-id') ?? crypto.randomUUID().replace(/-/g, '').slice(0, 16)

  const res = NextResponse.next()

  // Theme cookie default — first-time visitor lands on Paper White
  if (!req.cookies.get('ch_theme')) {
    res.cookies.set('ch_theme', 'paper', {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      path: '/',
    })
  }

  res.headers.set('x-request-id', requestId)

  return res
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes (we have our own logging there)
     * - _next/static, _next/image
     * - favicon, robots, sitemap, og images
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|opengraph-image|twitter-image).*)',
  ],
}
