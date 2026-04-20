import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import { createLinkedAccountForUser } from './linked-account.service.js'

// ─── Types ────────────────────────────────────────────────────

export interface KycStatus {
  status: 'none' | 'pending' | 'verified' | 'rejected'
  rejectionReason?: string
  submittedAt?: string
  reviewedAt?: string
}

export interface KycSubmitData {
  panNumber: string
  panName: string
  aadhaarLast4: string
  bankAccount: string
  bankIfsc: string
  bankName: string
  selfieUrl: string
  panDocUrl: string
  aadhaarDocUrl?: string
}

// ─── Validation helpers ───────────────────────────────────────

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/
const AADHAAR_LAST4_REGEX = /^\d{4}$/

function validateKycInput(data: KycSubmitData): void {
  if (!PAN_REGEX.test(data.panNumber)) {
    throw new AppError('validation-failed', 400, 'Invalid PAN number format. Must match AAAAA9999A pattern.')
  }
  if (!IFSC_REGEX.test(data.bankIfsc)) {
    throw new AppError('validation-failed', 400, 'Invalid IFSC code format. Must match AAAA0XXXXXX pattern.')
  }
  if (!AADHAAR_LAST4_REGEX.test(data.aadhaarLast4)) {
    throw new AppError('validation-failed', 400, 'Aadhaar last 4 digits must be exactly 4 numeric digits.')
  }
}

// ─── getKycStatus ─────────────────────────────────────────────

export async function getKycStatus(userId: string): Promise<KycStatus> {
  // First check user's kyc_status
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('kyc_status')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    throw new AppError('not-found', 404, 'User not found')
  }

  const userKycStatus = user.kyc_status as string | null

  // If user has no kyc_status set (none/not_started), return early.
  // Note: DB CHECK constraint allows 'not_started' | 'pending' | 'verified' |
  // 'rejected' | 'expired'. Mobile maps 'none' → _NoneView (Start KYC CTA).
  if (!userKycStatus || userKycStatus === 'none' || userKycStatus === 'not_started') {
    return { status: 'none' }
  }

  // Fetch submission details
  const { data: submission, error: subError } = await supabase
    .from('kyc_submissions')
    .select('status, rejection_reason, submitted_at, reviewed_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (subError) {
    throw new AppError('db-error', 500, 'Failed to fetch KYC status')
  }

  if (!submission) {
    // Edge case: user has kyc_status but no submission row
    return { status: userKycStatus as KycStatus['status'] }
  }

  const result: KycStatus = {
    status: submission.status as KycStatus['status'],
  }

  if (submission.rejection_reason != null) {
    result.rejectionReason = submission.rejection_reason as string
  }
  if (submission.submitted_at != null) {
    result.submittedAt = submission.submitted_at as string
  }
  if (submission.reviewed_at != null) {
    result.reviewedAt = submission.reviewed_at as string
  }

  return result
}

// ─── submitKyc ────────────────────────────────────────────────

export async function submitKyc(userId: string, data: KycSubmitData): Promise<void> {
  validateKycInput(data)

  // Check current status
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('kyc_status')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    throw new AppError('not-found', 404, 'User not found')
  }

  const currentStatus = user.kyc_status as string | null

  if (currentStatus === 'verified') {
    throw new AppError('conflict', 409, 'KYC is already verified and cannot be resubmitted')
  }

  if (currentStatus === 'pending') {
    throw new AppError('conflict', 409, 'KYC is already pending review. Use resubmit after rejection.')
  }

  const now = new Date().toISOString()

  const insertRow: Record<string, unknown> = {
    user_id: userId,
    status: 'pending',
    pan_number: data.panNumber,
    pan_name: data.panName,
    aadhaar_last4: data.aadhaarLast4,
    bank_account: data.bankAccount,
    bank_ifsc: data.bankIfsc,
    bank_name: data.bankName,
    selfie_url: data.selfieUrl,
    pan_doc_url: data.panDocUrl,
    submitted_at: now,
    updated_at: now,
  }

  if (data.aadhaarDocUrl !== undefined) {
    insertRow['aadhaar_doc_url'] = data.aadhaarDocUrl
  }

  const { error: insertError } = await supabase
    .from('kyc_submissions')
    .insert(insertRow)

  if (insertError) {
    throw new AppError('db-error', 500, 'Failed to submit KYC')
  }

  // Update user kyc_status to pending
  const { error: updateError } = await supabase
    .from('users')
    .update({ kyc_status: 'pending', updated_at: now })
    .eq('id', userId)

  if (updateError) {
    throw new AppError('db-error', 500, 'Failed to update user KYC status')
  }
}

// ─── resubmitKyc ─────────────────────────────────────────────

export async function resubmitKyc(userId: string, data: KycSubmitData): Promise<void> {
  validateKycInput(data)

  // Fetch existing submission
  const { data: submission, error: fetchError } = await supabase
    .from('kyc_submissions')
    .select('status')
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError) {
    throw new AppError('db-error', 500, 'Failed to fetch KYC submission')
  }

  if (!submission) {
    throw new AppError('not-found', 404, 'No KYC submission found. Use submit endpoint instead.')
  }

  const currentStatus = submission.status as string

  if (currentStatus === 'verified') {
    throw new AppError('conflict', 409, 'KYC is already verified and cannot be resubmitted')
  }

  if (currentStatus === 'pending') {
    throw new AppError('conflict', 409, 'KYC is already pending review. Cannot resubmit.')
  }

  // Only allowed when status is 'rejected'
  const now = new Date().toISOString()

  const updateRow: Record<string, unknown> = {
    status: 'pending',
    pan_number: data.panNumber,
    pan_name: data.panName,
    aadhaar_last4: data.aadhaarLast4,
    bank_account: data.bankAccount,
    bank_ifsc: data.bankIfsc,
    bank_name: data.bankName,
    selfie_url: data.selfieUrl,
    pan_doc_url: data.panDocUrl,
    rejection_reason: null,
    reviewed_at: null,
    reviewed_by: null,
    submitted_at: now,
    updated_at: now,
  }

  if (data.aadhaarDocUrl !== undefined) {
    updateRow['aadhaar_doc_url'] = data.aadhaarDocUrl
  }

  const { error: updateError } = await supabase
    .from('kyc_submissions')
    .update(updateRow)
    .eq('user_id', userId)

  if (updateError) {
    throw new AppError('db-error', 500, 'Failed to resubmit KYC')
  }

  // Update user kyc_status back to pending
  const { error: userUpdateError } = await supabase
    .from('users')
    .update({ kyc_status: 'pending', updated_at: now })
    .eq('id', userId)

  if (userUpdateError) {
    throw new AppError('db-error', 500, 'Failed to update user KYC status')
  }
}

// ─── approveKyc ──────────────────────────────────────────────

export async function approveKyc(userId: string, adminId: string): Promise<void> {
  const now = new Date().toISOString()

  const { error: submissionError } = await supabase
    .from('kyc_submissions')
    .update({
      status: 'verified',
      reviewed_at: now,
      reviewed_by: adminId,
      updated_at: now,
    })
    .eq('user_id', userId)

  if (submissionError) {
    throw new AppError('db-error', 500, 'Failed to approve KYC submission')
  }

  // Set user kyc_status to verified AND is_creator to true
  const { error: userError } = await supabase
    .from('users')
    .update({
      kyc_status: 'verified',
      is_creator: true,
      updated_at: now,
    })
    .eq('id', userId)

  if (userError) {
    throw new AppError('db-error', 500, 'Failed to update user after KYC approval')
  }

  // Trigger Razorpay linked account creation. Failures must NOT rollback KYC —
  // the cron in T10 reconciles users who are verified but have no linked account.
  try {
    await createLinkedAccountForUser(userId)
  } catch (err) {
    console.warn(
      `[kyc.approve] linked-account creation deferred for ${userId}: ${(err as Error).message}`,
    )
  }
}

// ─── rejectKyc ───────────────────────────────────────────────

export async function rejectKyc(userId: string, adminId: string, reason: string): Promise<void> {
  const now = new Date().toISOString()

  const { error: submissionError } = await supabase
    .from('kyc_submissions')
    .update({
      status: 'rejected',
      rejection_reason: reason,
      reviewed_at: now,
      reviewed_by: adminId,
      updated_at: now,
    })
    .eq('user_id', userId)

  if (submissionError) {
    throw new AppError('db-error', 500, 'Failed to reject KYC submission')
  }

  // Update user kyc_status to rejected
  const { error: userError } = await supabase
    .from('users')
    .update({ kyc_status: 'rejected', updated_at: now })
    .eq('id', userId)

  if (userError) {
    throw new AppError('db-error', 500, 'Failed to update user KYC status after rejection')
  }
}
