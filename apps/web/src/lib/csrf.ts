/**
 * CSRF defense — double-submit cookie + Origin header check.
 * Implements WEB-NFR-008 / WEB-AUTH-FR-021.
 *
 * Strategy:
 *   1. Edge middleware mints a high-entropy `ch_csrf` cookie on first response
 *      if missing. The cookie is httpOnly=false so client-side fetches can
 *      read it and echo back as an `x-csrf-token` header (double-submit).
 *      The cookie itself is SameSite=Lax + Secure (in prod) — exactly the
 *      attributes that prevent it from being attached cross-site.
 *   2. On mutating verbs (POST / PUT / PATCH / DELETE), middleware enforces
 *      that the request's `Origin` header matches the deployment's own
 *      origin (or a small allow-list of known UPI / Razorpay callbacks for
 *      future epics). The `Origin` header is CSRF-resistant: browsers always
 *      attach it on cross-origin requests, and an attacker's site cannot
 *      spoof it from a victim's browser.
 *   3. Server Actions can additionally verify `x-csrf-token === ch_csrf`
 *      cookie. Next.js 15 already enforces an Origin/host check on Server
 *      Actions; this header is belt-and-suspenders for fetch-based mutations
 *      a client component might issue.
 *
 * The middleware short-circuits safe verbs (GET / HEAD / OPTIONS).
 */

export const CSRF_COOKIE = 'ch_csrf'
export const CSRF_HEADER = 'x-csrf-token'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export function isSafeMethod(method: string): boolean {
  return SAFE_METHODS.has(method.toUpperCase())
}

/**
 * Generate a high-entropy CSRF token. 32 random bytes → 64 hex chars.
 * Uses the Web Crypto API which is available in the edge runtime.
 */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Determine whether an Origin header matches the request's own origin or
 * is in the allow-list. Returns true when there is no Origin header AND
 * no Referer either — that's the case for non-browser tools (curl, server
 * SSR fetches, health checks) which don't trigger a browser-CSRF risk.
 *
 * @param origin   `req.headers.get('origin')`
 * @param referer  `req.headers.get('referer')`
 * @param ownOrigin protocol+host+port of the request URL, e.g. `https://creatorhub.in`
 * @param allowList additional accepted origins (Razorpay callbacks etc.)
 */
export function isOriginAllowed(
  origin: string | null,
  referer: string | null,
  ownOrigin: string,
  allowList: readonly string[] = [],
): boolean {
  if (origin === ownOrigin) return true
  if (allowList.includes(origin ?? '')) return true
  // No Origin AND no Referer → likely a non-browser tool. Allow.
  if (!origin && !referer) return true
  // Referer fallback for very old clients that strip Origin on POST.
  if (!origin && referer) {
    try {
      const refOrigin = new URL(referer).origin
      return refOrigin === ownOrigin || allowList.includes(refOrigin)
    } catch {
      return false
    }
  }
  return false
}

/**
 * Origin allow-list for cross-site callbacks. Empty in M1; Razorpay
 * webhook callbacks land on /api (which is excluded from middleware
 * matcher), so we do not need them here yet.
 */
export const CSRF_ORIGIN_ALLOW_LIST: readonly string[] = []
