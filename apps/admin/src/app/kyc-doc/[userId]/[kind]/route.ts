// PII-safe KYC document redirect.
//
// The KYC detail page renders links to this route instead of the raw
// Firebase Storage URL. When an admin clicks through, we fetch the
// submission server-side (session cookie forwarded via serverFetch),
// pick the requested URL for `kind`, and 302-redirect to it. The
// storage URL therefore never lands in HTML, network HAR captures,
// browser history auto-suggest, or the referer header of unrelated
// tabs — which matters because Firebase Storage URLs embed a signed
// access token.

import { NextResponse, type NextRequest } from 'next/server'
import { serverFetch, ApiRequestError } from '../../../../lib/server-api'

const VALID_KINDS = new Set(['selfie', 'pan', 'aadhaar'])

interface KycSubmission {
  selfie_url: string
  pan_doc_url: string
  aadhaar_doc_url: string | null
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ userId: string; kind: string }> },
): Promise<NextResponse> {
  const { userId, kind } = await ctx.params

  if (!VALID_KINDS.has(kind)) {
    return NextResponse.json(
      { error: { type: 'validation-failed', title: 'Invalid kind', status: 400, detail: 'kind must be selfie, pan, or aadhaar' } },
      { status: 400 },
    )
  }

  let submission: KycSubmission
  try {
    submission = await serverFetch<KycSubmission>(
      `/api/v1/admin/kyc/${userId}`,
    )
  } catch (err) {
    if (err instanceof ApiRequestError) {
      return NextResponse.json(
        { error: { type: 'upstream', title: 'KYC fetch failed', status: err.status, detail: err.message } },
        { status: err.status },
      )
    }
    return NextResponse.json(
      { error: { type: 'upstream', title: 'KYC fetch failed', status: 502, detail: 'Could not reach admin API' } },
      { status: 502 },
    )
  }

  const url =
    kind === 'selfie'
      ? submission.selfie_url
      : kind === 'pan'
        ? submission.pan_doc_url
        : submission.aadhaar_doc_url

  if (url === null || url.length === 0) {
    return NextResponse.json(
      { error: { type: 'not-found', title: 'Document missing', status: 404, detail: `No ${kind} document on this submission` } },
      { status: 404 },
    )
  }

  return NextResponse.redirect(url, 302)
}
