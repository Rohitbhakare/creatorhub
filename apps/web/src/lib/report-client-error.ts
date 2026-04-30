'use client'

/**
 * Ship browser-only errors back to the SSR log so the existing /tmp/web.log
 * monitor catches them. Used wherever Firebase / fetch / hydration code can
 * throw without a server log entry — e.g. signin form's sendPhoneOtp.
 *
 * Uses navigator.sendBeacon when available (survives page navigations),
 * falls back to fetch with keepalive for older browsers / when sendBeacon
 * is blocked.
 */
export function reportClientError(where: string, err: unknown): void {
  if (typeof window === 'undefined') return
  // Always log to the browser console first — devtools is the fastest path
  // for whoever is debugging.
  console.error(`[ch] ${where}`, err)

  let code: string | undefined
  let msg: string | undefined
  let stack: string | undefined
  if (err && typeof err === 'object') {
    if ('code' in err && typeof (err as { code: unknown }).code === 'string') {
      code = (err as { code: string }).code
    }
    if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
      msg = (err as { message: string }).message
    }
    if ('stack' in err && typeof (err as { stack: unknown }).stack === 'string') {
      stack = (err as { stack: string }).stack
    }
  } else if (typeof err === 'string') {
    msg = err
  }

  const payload = JSON.stringify({
    where,
    msg,
    code,
    stack,
    url: window.location.pathname + window.location.search,
  })

  try {
    const blob = new Blob([payload], { type: 'application/json' })
    const ok = navigator.sendBeacon('/api/client-error', blob)
    if (ok) return
  } catch {
    /* fall through to fetch */
  }
  try {
    void fetch('/api/client-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    })
  } catch {
    /* nothing more we can do — already in console */
  }
}
