import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (must come before imports that touch these modules) ─

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn() }
  return { supabase: mockSupabase }
})

vi.mock('./linked-account.service.js', () => ({
  createLinkedAccountForUser: vi.fn().mockResolvedValue({
    id: 'la_1',
    razorpayAccountId: 'acc_x',
    status: 'created',
    wasAlreadyPresent: false,
  }),
}))

import {
  getKycStatus,
  submitKyc,
  resubmitKyc,
  approveKyc,
  rejectKyc,
} from './kyc.service.js'
import { supabase } from '../lib/supabase.js'
import { createLinkedAccountForUser } from './linked-account.service.js'

// ─── Mock helpers ──────────────────────────────────────────────

function mockChain(data: unknown, error: unknown = null) {
  const resolvedVal = { data, error }
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: (
      onFulfilled: (val: typeof resolvedVal) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolvedVal).then(onFulfilled, onRejected),
  }
  return chain
}

// ─── Fixtures ──────────────────────────────────────────────────

const USER_ID = 'user-kyc-001'
const ADMIN_ID = 'admin-001'

const VALID_SUBMIT_DATA = {
  panNumber: 'ABCDE1234F',
  panName: 'Test User',
  aadhaarLast4: '1234',
  bankAccount: '1234567890',
  bankIfsc: 'SBIN0001234',
  bankName: 'State Bank of India',
  selfieUrl: 'https://storage.example.com/selfie.jpg',
  panDocUrl: 'https://storage.example.com/pan.jpg',
}

beforeEach(() => {
  vi.resetAllMocks()
})

// ── getKycStatus ───────────────────────────────────────────────

describe('getKycStatus', () => {
  it('returns status=none when user has no kyc_status', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ kyc_status: null }) as never)

    const result = await getKycStatus(USER_ID)
    expect(result.status).toBe('none')
    expect(result.rejectionReason).toBeUndefined()
  })

  it('returns status=none when user kyc_status is "none"', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ kyc_status: 'none' }) as never)

    const result = await getKycStatus(USER_ID)
    expect(result.status).toBe('none')
  })

  it('returns status=pending with submittedAt when submission exists', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ kyc_status: 'pending' }) as never)
    fromMock.mockReturnValueOnce(
      mockChain({
        status: 'pending',
        rejection_reasons: null,
        submitted_at: '2026-04-10T10:00:00Z',
        reviewed_at: null,
      }) as never,
    )

    const result = await getKycStatus(USER_ID)
    expect(result.status).toBe('pending')
    expect(result.submittedAt).toBe('2026-04-10T10:00:00Z')
    expect(result.rejectionReason).toBeUndefined()
    expect(result.reviewedAt).toBeUndefined()
  })

  it('returns status=verified with reviewedAt when approved', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ kyc_status: 'verified' }) as never)
    fromMock.mockReturnValueOnce(
      mockChain({
        status: 'approved',
        rejection_reasons: null,
        submitted_at: '2026-04-10T10:00:00Z',
        reviewed_at: '2026-04-11T12:00:00Z',
      }) as never,
    )

    const result = await getKycStatus(USER_ID)
    expect(result.status).toBe('verified')
    expect(result.reviewedAt).toBe('2026-04-11T12:00:00Z')
    expect(result.rejectionReason).toBeUndefined()
  })

  it('returns status=rejected with rejectionReason', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ kyc_status: 'rejected' }) as never)
    fromMock.mockReturnValueOnce(
      mockChain({
        status: 'rejected',
        rejection_reasons: [{ field: 'general', reason: 'PAN photo is blurry' }],
        submitted_at: '2026-04-10T10:00:00Z',
        reviewed_at: '2026-04-11T12:00:00Z',
      }) as never,
    )

    const result = await getKycStatus(USER_ID)
    expect(result.status).toBe('rejected')
    expect(result.rejectionReason).toBe('PAN photo is blurry')
  })

  it('throws not-found if user does not exist', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'not found' }) as never)

    await expect(getKycStatus(USER_ID)).rejects.toThrow('User not found')
  })
})

// ── submitKyc ─────────────────────────────────────────────────

describe('submitKyc', () => {
  it('submits KYC successfully for a new user', async () => {
    const fromMock = vi.mocked(supabase.from)
    // user fetch
    fromMock.mockReturnValueOnce(mockChain({ kyc_status: null }) as never)
    // insert submission
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    // update user
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(submitKyc(USER_ID, VALID_SUBMIT_DATA)).resolves.toBeUndefined()

    expect(fromMock).toHaveBeenCalledWith('kyc_submissions')
    expect(fromMock).toHaveBeenCalledWith('users')
  })

  it('submits KYC successfully with optional aadhaarDocUrl', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ kyc_status: null }) as never)
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(
      submitKyc(USER_ID, { ...VALID_SUBMIT_DATA, aadhaarDocUrl: 'https://storage.example.com/aadhaar.jpg' }),
    ).resolves.toBeUndefined()
  })

  it('translates mobile payload into real kyc_submissions schema (hashes + encryption)', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ kyc_status: null }) as never)

    // Capture the insert chain so we can inspect what was written.
    const insertChain = mockChain(null)
    fromMock.mockReturnValueOnce(insertChain as never)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await submitKyc(USER_ID, {
      ...VALID_SUBMIT_DATA,
      aadhaarDocUrl: 'https://storage.example.com/aadhaar.jpg',
    })

    const insertFn = insertChain['insert'] as ReturnType<typeof vi.fn>
    expect(insertFn).toHaveBeenCalledTimes(1)
    const row = insertFn.mock.calls[0]?.[0] as Record<string, unknown>

    // Identity columns use the real schema names, not the phantom ones.
    expect(row['creator_id']).toBe(USER_ID)
    expect(row['user_id']).toBeUndefined()
    expect(row['pan_number']).toBeUndefined()
    expect(row['bank_account']).toBeUndefined()
    expect(row['aadhaar_last4']).toBeUndefined()
    expect(row['pan_doc_url']).toBeUndefined()
    expect(row['aadhaar_doc_url']).toBeUndefined()
    expect(row['rejection_reason']).toBeUndefined()

    // PAN + Aadhaar stored as SHA-256 hashes (64 hex chars, deterministic).
    expect(row['pan_number_hash']).toMatch(/^[0-9a-f]{64}$/)
    expect(row['aadhaar_number_hash']).toMatch(/^[0-9a-f]{64}$/)

    // Document URLs remapped.
    expect(row['pan_photo_url']).toBe(VALID_SUBMIT_DATA.panDocUrl)
    expect(row['aadhaar_front_url']).toBe('https://storage.example.com/aadhaar.jpg')
    expect(row['aadhaar_back_url']).toBe('https://storage.example.com/aadhaar.jpg')

    // Bank account: last4 derived, full number AES-GCM encrypted.
    expect(row['bank_account_holder']).toBe(VALID_SUBMIT_DATA.panName)
    expect(row['bank_account_number_last4']).toBe('7890')
    const encrypted = row['bank_account_number_encrypted'] as string
    // iv:ciphertext:tag, all hex
    expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/)
    expect(encrypted.includes(VALID_SUBMIT_DATA.bankAccount)).toBe(false)

    // Declaration + status + IFSC + selfie pass through unchanged.
    expect(row['declaration_accepted']).toBe(true)
    expect(row['status']).toBe('pending')
    expect(row['bank_ifsc']).toBe(VALID_SUBMIT_DATA.bankIfsc)
    expect(row['selfie_url']).toBe(VALID_SUBMIT_DATA.selfieUrl)
  })

  it('falls back to panDocUrl for aadhaar front/back when aadhaarDocUrl is omitted', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ kyc_status: null }) as never)
    const insertChain = mockChain(null)
    fromMock.mockReturnValueOnce(insertChain as never)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await submitKyc(USER_ID, VALID_SUBMIT_DATA)

    const insertFn = insertChain['insert'] as ReturnType<typeof vi.fn>
    const row = insertFn.mock.calls[0]?.[0] as Record<string, unknown>
    expect(row['aadhaar_front_url']).toBe(VALID_SUBMIT_DATA.panDocUrl)
    expect(row['aadhaar_back_url']).toBe(VALID_SUBMIT_DATA.panDocUrl)
  })

  it('throws validation-failed for invalid PAN format', async () => {
    await expect(
      submitKyc(USER_ID, { ...VALID_SUBMIT_DATA, panNumber: 'INVALID123' }),
    ).rejects.toThrow('Invalid PAN number format')
  })

  it('throws validation-failed for invalid PAN — lowercase letters', async () => {
    await expect(
      submitKyc(USER_ID, { ...VALID_SUBMIT_DATA, panNumber: 'abcde1234f' }),
    ).rejects.toThrow('Invalid PAN number format')
  })

  it('throws validation-failed for invalid IFSC format', async () => {
    await expect(
      submitKyc(USER_ID, { ...VALID_SUBMIT_DATA, bankIfsc: 'INVALID' }),
    ).rejects.toThrow('Invalid IFSC code format')
  })

  it('throws validation-failed for aadhaar_last4 with non-digits', async () => {
    await expect(
      submitKyc(USER_ID, { ...VALID_SUBMIT_DATA, aadhaarLast4: 'AB12' }),
    ).rejects.toThrow('Aadhaar last 4 digits must be exactly 4 numeric digits')
  })

  it('throws validation-failed for aadhaar_last4 with wrong length', async () => {
    await expect(
      submitKyc(USER_ID, { ...VALID_SUBMIT_DATA, aadhaarLast4: '12345' }),
    ).rejects.toThrow('Aadhaar last 4 digits must be exactly 4 numeric digits')
  })

  it('throws conflict if KYC is already verified', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ kyc_status: 'verified' }) as never)

    await expect(submitKyc(USER_ID, VALID_SUBMIT_DATA)).rejects.toThrow(
      'KYC is already verified',
    )
  })

  it('throws conflict if KYC is already pending', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ kyc_status: 'pending' }) as never)

    await expect(submitKyc(USER_ID, VALID_SUBMIT_DATA)).rejects.toThrow(
      'KYC is already pending',
    )
  })
})

// ── resubmitKyc ───────────────────────────────────────────────

describe('resubmitKyc', () => {
  it('resubmits successfully after rejection', async () => {
    const fromMock = vi.mocked(supabase.from)
    // fetch submission (status=rejected)
    fromMock.mockReturnValueOnce(mockChain({ status: 'rejected' }) as never)
    // update submission
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    // update user
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(resubmitKyc(USER_ID, VALID_SUBMIT_DATA)).resolves.toBeUndefined()
  })

  it('resubmit clears rejection_reasons + reviewer fields and filters by creator_id', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ status: 'rejected' }) as never)

    const updateChain = mockChain(null)
    fromMock.mockReturnValueOnce(updateChain as never)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await resubmitKyc(USER_ID, VALID_SUBMIT_DATA)

    const updateFn = updateChain['update'] as ReturnType<typeof vi.fn>
    const eqFn = updateChain['eq'] as ReturnType<typeof vi.fn>

    const row = updateFn.mock.calls[0]?.[0] as Record<string, unknown>
    expect(row['rejection_reasons']).toBeNull()
    expect(row['reviewed_at']).toBeNull()
    expect(row['reviewed_by']).toBeNull()
    expect(row['status']).toBe('pending')
    // The creator_id key must not be overwritten on update.
    expect(row['creator_id']).toBeUndefined()
    // And the filter must be by creator_id (not the phantom user_id).
    expect(eqFn).toHaveBeenCalledWith('creator_id', USER_ID)
  })

  it('throws conflict if current status is pending', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ status: 'pending' }) as never)

    await expect(resubmitKyc(USER_ID, VALID_SUBMIT_DATA)).rejects.toThrow(
      'KYC is already pending',
    )
  })

  it('throws conflict if current status is verified', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain({ status: 'verified' }) as never)

    await expect(resubmitKyc(USER_ID, VALID_SUBMIT_DATA)).rejects.toThrow(
      'KYC is already verified',
    )
  })

  it('throws not-found if no existing submission exists', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(resubmitKyc(USER_ID, VALID_SUBMIT_DATA)).rejects.toThrow(
      'No KYC submission found',
    )
  })

  it('throws validation-failed for invalid PAN on resubmit', async () => {
    await expect(
      resubmitKyc(USER_ID, { ...VALID_SUBMIT_DATA, panNumber: 'BADPAN' }),
    ).rejects.toThrow('Invalid PAN number format')
  })
})

// ── approveKyc ────────────────────────────────────────────────

describe('approveKyc', () => {
  it('approves KYC and sets is_creator=true on user', async () => {
    const fromMock = vi.mocked(supabase.from)
    // update kyc_submissions
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    // update users
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(approveKyc(USER_ID, ADMIN_ID)).resolves.toBeUndefined()

    // Verify both tables were updated
    expect(fromMock).toHaveBeenCalledWith('kyc_submissions')
    expect(fromMock).toHaveBeenCalledWith('users')
  })

  it('throws db-error if kyc_submissions update fails', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'update failed' }) as never)

    await expect(approveKyc(USER_ID, ADMIN_ID)).rejects.toThrow(
      'Failed to approve KYC submission',
    )
  })

  it('throws db-error if users update fails', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'update failed' }) as never)

    await expect(approveKyc(USER_ID, ADMIN_ID)).rejects.toThrow(
      'Failed to update user after KYC approval',
    )
  })

  it('triggers Razorpay linked-account creation after KYC approval', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    vi.mocked(createLinkedAccountForUser).mockClear()

    await approveKyc(USER_ID, ADMIN_ID)
    expect(createLinkedAccountForUser).toHaveBeenCalledWith(USER_ID)
  })

  it('KYC approval succeeds even if Razorpay linked-account creation fails', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    vi.mocked(createLinkedAccountForUser).mockRejectedValueOnce(new Error('Razorpay 503'))

    await expect(approveKyc(USER_ID, ADMIN_ID)).resolves.toBeUndefined()
  })
})

// ── rejectKyc ─────────────────────────────────────────────────

describe('rejectKyc', () => {
  it('rejects KYC with a reason and updates user status', async () => {
    const fromMock = vi.mocked(supabase.from)
    // update kyc_submissions
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    // update users
    fromMock.mockReturnValueOnce(mockChain(null) as never)

    await expect(rejectKyc(USER_ID, ADMIN_ID, 'PAN photo is blurry')).resolves.toBeUndefined()

    expect(fromMock).toHaveBeenCalledWith('kyc_submissions')
    expect(fromMock).toHaveBeenCalledWith('users')
  })

  it('throws db-error if kyc_submissions update fails', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'update failed' }) as never)

    await expect(rejectKyc(USER_ID, ADMIN_ID, 'Documents unclear')).rejects.toThrow(
      'Failed to reject KYC submission',
    )
  })

  it('throws db-error if users update fails after rejection', async () => {
    const fromMock = vi.mocked(supabase.from)
    fromMock.mockReturnValueOnce(mockChain(null) as never)
    fromMock.mockReturnValueOnce(mockChain(null, { message: 'update failed' }) as never)

    await expect(rejectKyc(USER_ID, ADMIN_ID, 'Selfie mismatch')).rejects.toThrow(
      'Failed to update user KYC status after rejection',
    )
  })
})
