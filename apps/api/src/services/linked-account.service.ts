/**
 * Linked Account Service — Razorpay Route linked account lifecycle.
 *
 * Flow:
 *   1. KYC approved → createLinkedAccountForUser() called from kyc.service
 *   2. Webhook account.under_review / needs_clarification / activated / rejected
 *      → updateLinkedAccountStatus() updates status in DB
 *   3. getLinkedAccountForUser() returns masked bank info for the creator UI
 *
 * Idempotency: createLinkedAccountForUser() is safe to call repeatedly — returns
 * existing row if one is already present and not deactivated.
 */

import { supabase } from '../lib/supabase.js'
import { AppError } from '../errors/AppError.js'
import * as razorpay from '../lib/razorpay.js'
import type { LinkedAccount, LinkedAccountStatus } from '@creatorhub/shared'

type Row = Record<string, unknown>

// ─── Helpers ────────────────────────────────────────────────

function maskBankAccount(last4: string | null | undefined): string | null {
  if (!last4) return null
  return `XXXXXX${last4}`
}

// ─── createLinkedAccountForUser ─────────────────────────────

export type CreateLinkedAccountResult = {
  id: string
  razorpayAccountId: string
  status: LinkedAccountStatus
  wasAlreadyPresent: boolean
}

export async function createLinkedAccountForUser(
  userId: string,
): Promise<CreateLinkedAccountResult> {
  // 1. Idempotency: return existing non-deactivated row
  const { data: existing, error: fetchError } = await supabase
    .from('razorpay_linked_accounts')
    .select('id, razorpay_account_id, status')
    .eq('user_id', userId)
    .neq('status', 'deactivated')
    .maybeSingle()

  if (fetchError) {
    throw new AppError('db-error', 500, 'Failed to fetch linked account')
  }

  if (existing) {
    const e = existing as Row
    return {
      id: e.id as string,
      razorpayAccountId: e.razorpay_account_id as string,
      status: e.status as LinkedAccountStatus,
      wasAlreadyPresent: true,
    }
  }

  // 2. Load user + KYC submission
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, phone, display_name, kyc_status')
    .eq('id', userId)
    .maybeSingle()

  if (userError || !user) {
    throw new AppError('not-found', 404, 'User not found')
  }

  const u = user as Row
  if (u.kyc_status !== 'verified') {
    throw new AppError('precondition-failed', 412, 'KYC must be verified before enabling payouts')
  }

  const { data: kyc, error: kycError } = await supabase
    .from('kyc_submissions')
    .select(
      'pan_name, bank_account_holder, bank_account_number_last4, bank_ifsc, bank_name, bank_city',
    )
    .eq('creator_id', userId)
    .eq('status', 'approved')
    .maybeSingle()

  if (kycError) {
    throw new AppError('db-error', 500, 'Failed to fetch KYC submission')
  }

  if (!kyc) {
    throw new AppError('precondition-failed', 412, 'Approved KYC submission required')
  }

  const k = kyc as Row

  // 3. Call Razorpay
  const email = (u.email as string | null) ?? `user+${userId}@creators.creatorhub.app`
  const phone = u.phone as string
  const contactName = (k.pan_name as string | null) ?? (u.display_name as string | null) ?? 'Creator'

  const rzpAccount = await razorpay.createLinkedAccount({
    email,
    phone,
    legal_business_name: contactName,
    business_type: 'individual',
    contact_name: contactName,
    profile: {
      category: 'others',
      subcategory: 'others',
      addresses: {
        registered: {
          street1: 'N/A',
          city: (k.bank_city as string | null) ?? 'Mumbai',
          state: 'Maharashtra',
          postal_code: '400001',
          country: 'IN',
        },
      },
    },
    reference_id: userId,
  })

  // 4. Persist
  const { data: inserted, error: insertError } = await supabase
    .from('razorpay_linked_accounts')
    .insert({
      user_id: userId,
      razorpay_account_id: rzpAccount.id,
      status: 'created',
      business_type: 'individual',
    })
    .select('id, razorpay_account_id, status')
    .single()

  if (insertError) {
    throw new AppError('db-error', 500, 'Failed to persist linked account')
  }

  const row = inserted as Row
  return {
    id: row.id as string,
    razorpayAccountId: row.razorpay_account_id as string,
    status: row.status as LinkedAccountStatus,
    wasAlreadyPresent: false,
  }
}

// ─── updateLinkedAccountStatus ──────────────────────────────

export async function updateLinkedAccountStatus(
  razorpayAccountId: string,
  status: LinkedAccountStatus,
  activatedAt?: string,
): Promise<void> {
  const patch: Record<string, unknown> = { status }
  if (status === 'activated' && activatedAt) {
    patch['activated_at'] = activatedAt
  }

  const { error } = await supabase
    .from('razorpay_linked_accounts')
    .update(patch)
    .eq('razorpay_account_id', razorpayAccountId)

  if (error) {
    throw new AppError('db-error', 500, 'Failed to update linked account status')
  }
}

// ─── getLinkedAccountForUser ────────────────────────────────

export async function getLinkedAccountForUser(
  userId: string,
): Promise<LinkedAccount> {
  const { data: row, error } = await supabase
    .from('razorpay_linked_accounts')
    .select('status, activated_at')
    .eq('user_id', userId)
    .neq('status', 'deactivated')
    .maybeSingle()

  if (error) {
    throw new AppError('db-error', 500, 'Failed to fetch linked account')
  }

  if (!row) {
    return {
      status: null,
      activatedAt: null,
      holderName: null,
      bankAccountMasked: null,
      bankIfsc: null,
    }
  }

  const { data: kyc } = await supabase
    .from('kyc_submissions')
    .select('bank_account_holder, bank_account_number_last4, bank_ifsc')
    .eq('creator_id', userId)
    .eq('status', 'approved')
    .maybeSingle()

  const r = row as Row
  const k = (kyc as Row | null) ?? null
  return {
    status: r.status as LinkedAccountStatus,
    activatedAt: (r.activated_at as string | null) ?? null,
    holderName: (k?.bank_account_holder as string | null) ?? null,
    bankAccountMasked: maskBankAccount(k?.bank_account_number_last4 as string | null | undefined),
    bankIfsc: (k?.bank_ifsc as string | null) ?? null,
  }
}

// ─── getRazorpayAccountIdForUser ────────────────────────────
/** Return the current razorpay_account_id usable for transfers, or null. */
export async function getActiveRazorpayAccountId(
  userId: string,
): Promise<string | null> {
  const { data: row } = await supabase
    .from('razorpay_linked_accounts')
    .select('razorpay_account_id, status')
    .eq('user_id', userId)
    .in('status', ['created', 'activated'])
    .maybeSingle()

  if (!row) return null
  return (row as Row).razorpay_account_id as string
}
