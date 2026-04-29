import { NextResponse } from 'next/server'
import { apiFetch } from '@/lib/api-client'
import { getSession } from '@/lib/session'
import { logger } from '@/lib/logger'
import { AppError } from '@/lib/errors'

interface KycStatus {
  status: 'not_started' | 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  submitted_at?: string
  reviewed_at?: string
}

export async function GET() {
  const log = logger.child({ route: 'api/kyc/status' })
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { type: 'unauthorized', status: 401, detail: 'Sign in' },
      { status: 401 },
    )
  }
  try {
    const data = await apiFetch<KycStatus>(`/api/v1/kyc/status`, {
      next: { revalidate: 0 },
      retries: 1,
    })
    return NextResponse.json(data)
  } catch (err) {
    const e = err instanceof AppError ? err : AppError.upstream()
    if (e.status !== 404) log.error({ err: e.toJSON() }, 'kyc-status:failed')
    return NextResponse.json(e.toJSON(), { status: e.status })
  }
}
