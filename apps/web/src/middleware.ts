import { type NextRequest, NextResponse } from 'next/server'
import {
  CSRF_COOKIE,
  CSRF_ORIGIN_ALLOW_LIST,
  generateCsrfToken,
  isOriginAllowed,
  isSafeMethod,
} from './lib/csrf'

/**
 * Middleware: theme cookie + auth gate + CSRF + security headers + request id.
 * Edge runtime — keep this lightweight (no DB, no heavy imports).
 *
 * CSRF defense (WEB-NFR-008):
 *   - Mint a high-entropy `ch_csrf` cookie on first response
 *   - Block mutating verbs whose Origin header doesn't match this deployment
 *   - Safe verbs (GET / HEAD / OPTIONS) are short-circuited
 */

// Routes that require auth. /feed is intentionally NOT here — guests can
// browse the home feed (per IAM-FR-010 / WEB-FEED-FR-023 cold-start), they
// just see a Join card in place of the personalised right rail.
const PROTECTED_PREFIXES = [
  '/saved',
  '/bookings',
  '/studio',
  '/you',
  '/settings',
  '/publish',
  '/booking',
  '/quests',
  '/notifications',
  '/onboarding',
]

const PUBLIC_AUTH_ROUTES = ['/signin', '/signup', '/verify-otp', '/forgot-password']

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function isAuthRoute(pathname: string): boolean {
  return PUBLIC_AUTH_ROUTES.some((p) => pathname === p)
}

// Legacy creator URL pattern — /travel/<username> and /stories/<username>.
// Permanently redirected to /u/<username> (vertical-independent canonical).
// Matches exactly two segments where the first is a known vertical, so it
// won't collide with any /travel/foo/bar future routes.
const LEGACY_CREATOR_RE = /^\/(travel|stories)\/([^/]+)\/?$/

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const legacyMatch = LEGACY_CREATOR_RE.exec(pathname)
  if (legacyMatch && legacyMatch[2]) {
    const url = req.nextUrl.clone()
    url.pathname = `/u/${legacyMatch[2]}`
    return NextResponse.redirect(url, 301)
  }

  const sessionCookie = req.cookies.get('ch_session')?.value
  const isAuthenticated = Boolean(sessionCookie)

  // CSRF defense for mutating verbs (WEB-NFR-008). Run before auth-gate
  // redirects so an attacker can't trigger a 302 + cookie-set response.
  if (!isSafeMethod(req.method)) {
    const ownOrigin = req.nextUrl.origin
    const origin = req.headers.get('origin')
    const referer = req.headers.get('referer')
    if (!isOriginAllowed(origin, referer, ownOrigin, CSRF_ORIGIN_ALLOW_LIST)) {
      return new NextResponse('CSRF check failed', {
        status: 403,
        headers: { 'content-type': 'text/plain' },
      })
    }
  }

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

  // Mint the CSRF double-submit cookie if missing. Not httpOnly so client
  // fetch handlers can read it and echo as `x-csrf-token`. SameSite=Lax
  // and Secure (in prod) are what stop a cross-site form from carrying it.
  if (!req.cookies.get(CSRF_COOKIE)) {
    res.cookies.set(CSRF_COOKIE, generateCsrfToken(), {
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false,
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
