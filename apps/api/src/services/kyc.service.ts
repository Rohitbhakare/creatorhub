import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import { createLinkedAccountForUser } from './linked-account.service.js'
import { hashIdentifier, encryptBankAccount } from '../utils/kyc-crypto.js'

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

/**
 * Translate the mobile submit payload (`KycSubmitData`) into the real
 * `kyc_submissions` row shape (migration 009).
 *
 * The mobile wizard currently collects a subset of the schema's fields:
 *   - PAN number (plaintext, hashed here)
 *   - Aadhaar last 4 only (hashed here — full-number path will be
 *     added when DigiLocker lands)
 *   - A single Aadhaar doc URL (used for both front and back until the
 *     wizard is split into two uploads)
 *   - Bank account number (plaintext, AES-GCM encrypted here)
 *   - Account holder name is inferred from PAN name (same person)
 *
 * Admin review uses `pan_name` as the canonical identity check; the
 * legal names on the Aadhaar / bank rows are wired here so they stay
 * NOT NULL–safe and match existing UX.
 */
function buildKycWriteRow(
  userId: string,
  data: KycSubmitData,
): Record<string, unknown> {
  const aadhaarUrl = data.aadhaarDocUrl ?? data.panDocUrl
  return {
    creator_id: userId,
    pan_number_hash: hashIdentifier(data.panNumber),
    pan_name: data.panName,
    pan_photo_url: data.panDocUrl,
    aadhaar_number_hash: hashIdentifier(data.aadhaarLast4),
    aadhaar_name: data.panName,
    aadhaar_front_url: aadhaarUrl,
    aadhaar_back_url: aadhaarUrl,
    bank_account_holder: data.panName,
    bank_account_number_encrypted: encryptBankAccount(data.bankAccount),
    bank_account_number_last4: data.bankAccount.slice(-4),
    bank_ifsc: data.bankIfsc,
    bank_name: data.bankName,
    selfie_url: data.selfieUrl,
    declaration_accepted: true,
    declaration_accepted_at: new Date().toISOString(),
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
    .select('status, rejection_reasons, submitted_at, reviewed_at')
    .eq('creator_id', userId)
    .maybeSingle()

  if (subError) {
    throw new AppError('db-error', 500, 'Failed to fetch KYC status')
  }

  if (!submission) {
    // Edge case: user has kyc_status but no submission row
    return { status: userKycStatus as KycStatus['status'] }
  }

  // kyc_submissions.status uses 'approved'; KycStatus external type
  // keeps 'verified' to match users.kyc_status. Normalise.
  const rawStatus = submission.status as string
  const mappedStatus: KycStatus['status'] =
    rawStatus === 'approved' ? 'verified' : (rawStatus as KycStatus['status'])
  const result: KycStatus = { status: mappedStatus }

  const rejections = submission.rejection_reasons as
    | Array<{ field: string; reason: string }>
    | null
  if (rejections && rejections.length > 0) {
    result.rejectionReason = rejections.map((r) => r.reason).join('; ')
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
  const insertRow = buildKycWriteRow(userId, data)
  insertRow['status'] = 'pending'
  insertRow['submitted_at'] = now
  insertRow['updated_at'] = now

  const { error: insertError } = await supabase
    .from('kyc_submissions')
    .insert(insertRow)

  if (insertError) {
    console.error('[kyc.submit] insert error:', insertError.message)
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
    .eq('creator_id', userId)
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
  const updateRow = buildKycWriteRow(userId, data)
  // creator_id is set on insert only; re-setting on update is redundant
  // and risks hitting a NOT NULL constraint check needlessly.
  delete updateRow['creator_id']
  updateRow['status'] = 'pending'
  updateRow['rejection_reasons'] = null
  updateRow['reviewed_at'] = null
  updateRow['reviewed_by'] = null
  updateRow['submitted_at'] = now
  updateRow['updated_at'] = now

  const { error: updateError } = await supabase
    .from('kyc_submissions')
    .update(updateRow)
    .eq('creator_id', userId)

  if (updateError) {
    console.error('[kyc.resubmit] update error:', updateError.message)
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

  // kyc_submissions.status enum uses 'approved'; users.kyc_status uses
  // 'verified'. They describe the same state from two viewpoints — keep
  // them aligned in sync below.
  const { error: submissionError } = await supabase
    .from('kyc_submissions')
    .update({
      status: 'approved',
      reviewed_at: now,
      reviewed_by: adminId,
      updated_at: now,
    })
    .eq('creator_id', userId)

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
      rejection_reasons: [{ field: 'general', reason }],
      reviewed_at: now,
      reviewed_by: adminId,
      updated_at: now,
    })
    .eq('creator_id', userId)

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
