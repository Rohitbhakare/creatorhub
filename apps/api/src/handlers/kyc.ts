import type { Context } from 'hono'
import { AppError } from '../errors/AppError.js'
import {
  getKycStatus,
  submitKyc,
  resubmitKyc,
  approveKyc,
  rejectKyc,
  type KycSubmitData,
} from '../services/kyc.service.js'
import { env } from '../env.js'

// ─── Admin secret check ───────────────────────────────────────

function checkAdminSecret(c: Context): void {
  const secret = c.req.header('x-admin-secret')
  if (!secret || !env.ADMIN_SECRET || secret !== env.ADMIN_SECRET) {
    throw new AppError('forbidden', 403, 'Invalid or missing admin secret')
  }
}

// ─── GET /kyc/status ─────────────────────────────────────────

export async function handleGetKycStatus(c: Context): Promise<Response> {
  const userId = c.get('userId') as string
  const status = await getKycStatus(userId)

  const responseData: Record<string, unknown> = {
    status: status.status,
  }

  if (status.rejectionReason !== undefined) {
    responseData['rejection_reason'] = status.rejectionReason
  }
  if (status.submittedAt !== undefined) {
    responseData['submitted_at'] = status.submittedAt
  }
  if (status.reviewedAt !== undefined) {
    responseData['reviewed_at'] = status.reviewedAt
  }

  return c.json({ success: true, data: responseData })
}

// ─── POST /kyc/submit ─────────────────────────────────────────

export async function handleSubmitKyc(c: Context): Promise<Response> {
  const userId = c.get('userId') as string

  const body = await c.req.json().catch(() => {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  })

  validateSubmitBody(body)

  const submitData = buildSubmitData(body as Record<string, unknown>)

  await submitKyc(userId, submitData)

  c.header('Location', '/api/v1/kyc/status')
  return c.json({ success: true }, 201)
}

// ─── POST /kyc/resubmit ───────────────────────────────────────

export async function handleResubmitKyc(c: Context): Promise<Response> {
  const userId = c.get('userId') as string

  const body = await c.req.json().catch(() => {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  })

  validateSubmitBody(body)

  const submitData = buildSubmitData(body as Record<string, unknown>)

  await resubmitKyc(userId, submitData)

  return c.json({ success: true })
}

// ─── POST /kyc/admin/approve ──────────────────────────────────

export async function handleApproveKyc(c: Context): Promise<Response> {
  checkAdminSecret(c)

  const body = await c.req.json().catch(() => {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  })

  const b = body as Record<string, unknown>

  if (typeof b['user_id'] !== 'string' || !b['user_id']) {
    throw new AppError('validation-failed', 400, 'user_id is required')
  }
  if (typeof b['admin_id'] !== 'string' || !b['admin_id']) {
    throw new AppError('validation-failed', 400, 'admin_id is required')
  }

  await approveKyc(b['user_id'] as string, b['admin_id'] as string)

  return c.json({ success: true })
}

// ─── POST /kyc/admin/reject ───────────────────────────────────

export async function handleRejectKyc(c: Context): Promise<Response> {
  checkAdminSecret(c)

  const body = await c.req.json().catch(() => {
    throw new AppError('validation-failed', 400, 'Invalid JSON body')
  })

  const b = body as Record<string, unknown>

  if (typeof b['user_id'] !== 'string' || !b['user_id']) {
    throw new AppError('validation-failed', 400, 'user_id is required')
  }
  if (typeof b['admin_id'] !== 'string' || !b['admin_id']) {
    throw new AppError('validation-failed', 400, 'admin_id is required')
  }
  if (typeof b['reason'] !== 'string' || !b['reason']) {
    throw new AppError('validation-failed', 400, 'reason is required')
  }

  await rejectKyc(b['user_id'] as string, b['admin_id'] as string, b['reason'] as string)

  return c.json({ success: true })
}

// ─── Validation helpers ───────────────────────────────────────

function validateSubmitBody(body: unknown): void {
  const b = body as Record<string, unknown>

  const requiredStrings: string[] = [
    'pan_number',
    'pan_name',
    'aadhaar_last4',
    'bank_account',
    'bank_ifsc',
    'bank_name',
    'selfie_url',
    'pan_doc_url',
  ]

  for (const field of requiredStrings) {
    if (typeof b[field] !== 'string' || !(b[field] as string).trim()) {
      throw new AppError('validation-failed', 400, `${field} is required and must be a non-empty string`)
    }
  }

  // aadhaar_doc_url is optional
  if (b['aadhaar_doc_url'] !== undefined && typeof b['aadhaar_doc_url'] !== 'string') {
    throw new AppError('validation-failed', 400, 'aadhaar_doc_url must be a string if provided')
  }
}

function buildSubmitData(b: Record<string, unknown>): KycSubmitData {
  const base: KycSubmitData = {
    panNumber: b['pan_number'] as string,
    panName: b['pan_name'] as string,
    aadhaarLast4: b['aadhaar_last4'] as string,
    bankAccount: b['bank_account'] as string,
    bankIfsc: b['bank_ifsc'] as string,
    bankName: b['bank_name'] as string,
    selfieUrl: b['selfie_url'] as string,
    panDocUrl: b['pan_doc_url'] as string,
  }

  if (typeof b['aadhaar_doc_url'] === 'string') {
    base.aadhaarDocUrl = b['aadhaar_doc_url']
  }

  return base
}
