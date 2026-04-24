// Same-origin proxy to the Hono API.
//
// The browser calls `/api/proxy/<path>` which forwards to the Hono
// endpoint at `${API_INTERNAL_URL}/api/v1/<path>`. Request + response
// cookies are passed through 1:1 so the `ch_admin_session` Set-Cookie
// from `/auth/login` lands on the admin app origin — first-party,
// httpOnly, no CORS or SameSite weirdness.
//
// We forward only safe-to-relay headers. Method, body, and query
// string flow through untouched.

import { NextResponse, type NextRequest } from 'next/server'
import { API_INTERNAL_URL } from '../../../../lib/env'

const METHODS_WITH_BODY = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

async function handle(
  req: NextRequest,
  params: Promise<{ path: string[] }>,
): Promise<NextResponse> {
  const { path } = await params
  const target = new URL(
    `${API_INTERNAL_URL}/api/v1/${path.join('/')}${req.nextUrl.search}`,
  )

  const headers = new Headers()
  const cookie = req.headers.get('cookie')
  if (cookie) headers.set('cookie', cookie)
  const contentType = req.headers.get('content-type')
  if (contentType) headers.set('content-type', contentType)
  const userAgent = req.headers.get('user-agent')
  if (userAgent) headers.set('user-agent', userAgent)
  // Help audit logs surface the real client IP instead of the Next.js
  // server IP (critical for forensics on any admin action).
  const forwardedFor = req.headers.get('x-forwarded-for') ?? ''
  const clientIp = forwardedFor.split(',')[0]?.trim()
  if (clientIp) {
    headers.set('x-forwarded-for', clientIp)
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
  }
  if (METHODS_WITH_BODY.has(req.method)) {
    init.body = await req.text()
  }

  let upstream: Response
  try {
    upstream = await fetch(target, init)
  } catch (err) {
    console.error('[admin-proxy] upstream fetch failed:', err)
    return NextResponse.json(
      {
        error: {
          type: 'https://creatorhub.in/errors/upstream',
          title: 'Upstream unreachable',
          status: 502,
          detail: 'Admin API could not be reached',
        },
      },
      { status: 502 },
    )
  }

  // 204/205/304 are null-body statuses — the Response constructor
  // throws if we pass a string (even empty) on those codes.
  const isNullBody =
    upstream.status === 204 || upstream.status === 205 || upstream.status === 304
  const body = isNullBody ? null : await upstream.text()
  const res = new NextResponse(body, {
    status: upstream.status,
    statusText: upstream.statusText,
  })

  // Relay content-type + any Set-Cookie headers. Strip upstream's
  // transport-level headers (content-length, content-encoding) so
  // Next.js can re-encode cleanly.
  const upstreamContentType = upstream.headers.get('content-type')
  if (upstreamContentType) res.headers.set('content-type', upstreamContentType)
  for (const raw of upstream.headers.getSetCookie()) {
    res.headers.append('set-cookie', raw)
  }

  return res
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return handle(req, ctx.params)
}
export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return handle(req, ctx.params)
}
export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return handle(req, ctx.params)
}
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return handle(req, ctx.params)
}
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return handle(req, ctx.params)
}
