import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiFetch } from '@/lib/api-client'
import { getSession } from '@/lib/session'
import { logger } from '@/lib/logger'
import { AppError } from '@/lib/errors'

const Schema = z.object({
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format'),
  panName: z.string().min(2).max(120),
  aadhaarLast4: z.string().regex(/^\d{4}$/, 'Last 4 digits only'),
  bankAccount: z.string().regex(/^\d{9,18}$/, 'Bank account 9-18 digits'),
  bankIfsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC format'),
  bankName: z.string().min(2).max(120),
  selfieUrl: z.string().url(),
  panDocUrl: z.string().url(),
  aadhaarDocUrl: z.string().url().optional(),
  resubmit: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const log = logger.child({ route: 'api/kyc/submit' })
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { type: 'unauthorized', status: 401, detail: 'Sign in' },
      { status: 401 },
    )
  }

  let body
  try {
    body = Schema.parse(await req.json())
  } catch (err) {
    log.warn({ err: String(err) }, 'kyc-submit:bad-input')
    const message =
      err instanceof z.ZodError && err.issues[0]?.message
        ? err.issues[0].message
        : 'Invalid input'
    return NextResponse.json(
      { type: 'bad-request', status: 400, detail: message },
      { status: 400 },
    )
  }

  const { resubmit, ...payload } = body
  const path = resubmit === true ? '/api/v1/kyc/resubmit' : '/api/v1/kyc/submit'

  try {
    await apiFetch(path, {
      method: 'POST',
      body: {
        pan_number: payload.panNumber,
        pan_name: payload.panName,
        aadhaar_last_4: payload.aadhaarLast4,
        bank_account: payload.bankAccount,
        bank_ifsc: payload.bankIfsc,
        bank_name: payload.bankName,
        selfie_url: payload.selfieUrl,
        pan_doc_url: payload.panDocUrl,
        ...(payload.aadhaarDocUrl !== undefined
          ? { aadhaar_doc_url: payload.aadhaarDocUrl }
          : {}),
      },
      retries: 0,
      idempotencyKey: `kyc-submit:${session.userId}`,
    })
    log.info({ userId: session.userId, resubmit }, 'kyc-submit:ok')
    return NextResponse.json({ success: true })
  } catch (err) {
    const e = err instanceof AppError ? err : AppError.upstream()
    log.error({ err: e.toJSON() }, 'kyc-submit:failed')
    return NextResponse.json(e.toJSON(), { status: e.status })
  }
}
