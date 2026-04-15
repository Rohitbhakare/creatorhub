import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks (must come before imports that touch these modules) ─

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn() }
  return { supabase: mockSupabase }
})

import {
  getKycStatus,
  submitKyc,
  resubmitKyc,
  approveKyc,
  rejectKyc,
} from './kyc.service.js'
import { supabase } from '../lib/supabase.js'

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
        rejection_reason: null,
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
        status: 'verified',
        rejection_reason: null,
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
        rejection_reason: 'PAN photo is blurry',
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
