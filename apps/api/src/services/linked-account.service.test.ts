import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/supabase.js', () => ({
  supabase: { from: vi.fn() },
}))

vi.mock('../lib/razorpay.js', () => ({
  createLinkedAccount: vi.fn(),
  fetchLinkedAccount: vi.fn(),
}))

import {
  createLinkedAccountForUser,
  updateLinkedAccountStatus,
  getLinkedAccountForUser,
  getActiveRazorpayAccountId,
} from './linked-account.service.js'
import { supabase } from '../lib/supabase.js'
import * as razorpay from '../lib/razorpay.js'
import { AppError } from '../errors/AppError.js'

type MaybeSingleResult = { data: unknown; error: unknown }

function mockChain(result: MaybeSingleResult) {
  return {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
  }
}

const USER_ID = '11111111-1111-1111-1111-111111111111'
const ACCOUNT_ID = 'acc_ABC'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createLinkedAccountForUser', () => {
  it('happy — creates Razorpay account and persists', async () => {
    const rows = [
      mockChain({ data: null, error: null }), // existing lookup
      mockChain({
        data: { id: USER_ID, email: 'a@b.com', phone: '+919999', display_name: 'Asha', kyc_status: 'verified' },
        error: null,
      }),
      mockChain({
        data: {
          pan_name: 'ASHA PATIL',
          bank_account_holder: 'Asha Patil',
          bank_account_number_last4: '1234',
          bank_ifsc: 'HDFC0000001',
          bank_name: 'HDFC',
          bank_city: 'Pune',
        },
        error: null,
      }),
      mockChain({
        data: { id: 'la_1', razorpay_account_id: ACCOUNT_ID, status: 'created' },
        error: null,
      }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => rows.shift() as never)
    vi.mocked(razorpay.createLinkedAccount).mockResolvedValueOnce({ id: ACCOUNT_ID, status: 'created' })

    const res = await createLinkedAccountForUser(USER_ID)
    expect(res.wasAlreadyPresent).toBe(false)
    expect(res.razorpayAccountId).toBe(ACCOUNT_ID)
    expect(res.status).toBe('created')
    expect(razorpay.createLinkedAccount).toHaveBeenCalledTimes(1)
    const call = vi.mocked(razorpay.createLinkedAccount).mock.calls[0]![0]
    expect(call.reference_id).toBe(USER_ID)
    expect(call.contact_name).toBe('ASHA PATIL')
  })

  it('idempotent — returns existing row without calling Razorpay', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain({
        data: { id: 'la_1', razorpay_account_id: ACCOUNT_ID, status: 'activated' },
        error: null,
      }) as never,
    )

    const res = await createLinkedAccountForUser(USER_ID)
    expect(res.wasAlreadyPresent).toBe(true)
    expect(res.razorpayAccountId).toBe(ACCOUNT_ID)
    expect(razorpay.createLinkedAccount).not.toHaveBeenCalled()
  })

  it('412 when kyc_status is not verified', async () => {
    const rows = [
      mockChain({ data: null, error: null }),
      mockChain({
        data: { id: USER_ID, email: null, phone: '+9199', display_name: 'x', kyc_status: 'pending' },
        error: null,
      }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => rows.shift() as never)

    try {
      await createLinkedAccountForUser(USER_ID)
      expect.fail('should throw')
    } catch (err) {
      expect(err).toBeInstanceOf(AppError)
      expect((err as AppError).status).toBe(412)
    }
    expect(razorpay.createLinkedAccount).not.toHaveBeenCalled()
  })

  it('412 when no approved KYC submission', async () => {
    const rows = [
      mockChain({ data: null, error: null }),
      mockChain({
        data: { id: USER_ID, email: 'a@b.com', phone: '+9199', display_name: 'x', kyc_status: 'verified' },
        error: null,
      }),
      mockChain({ data: null, error: null }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => rows.shift() as never)

    await expect(createLinkedAccountForUser(USER_ID)).rejects.toMatchObject({ status: 412 })
    expect(razorpay.createLinkedAccount).not.toHaveBeenCalled()
  })

  it('surfaces Razorpay error without persisting DB row', async () => {
    const rows = [
      mockChain({ data: null, error: null }),
      mockChain({
        data: { id: USER_ID, email: 'a@b.com', phone: '+9199', display_name: 'x', kyc_status: 'verified' },
        error: null,
      }),
      mockChain({
        data: {
          pan_name: 'X',
          bank_account_holder: 'X',
          bank_account_number_last4: '0000',
          bank_ifsc: 'X',
          bank_name: 'X',
          bank_city: 'X',
        },
        error: null,
      }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => rows.shift() as never)
    vi.mocked(razorpay.createLinkedAccount).mockRejectedValueOnce(
      new AppError('external_service', 502, 'Invalid IFSC'),
    )

    await expect(createLinkedAccountForUser(USER_ID)).rejects.toMatchObject({ status: 502 })
    // insert chain never called — only 3 from() calls
    expect(vi.mocked(supabase.from).mock.calls.length).toBe(3)
  })
})

describe('updateLinkedAccountStatus', () => {
  it('updates status and sets activated_at when activated', async () => {
    const chain = mockChain({ data: null, error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(chain as never)

    await updateLinkedAccountStatus(ACCOUNT_ID, 'activated', '2026-04-19T00:00:00Z')
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'activated', activated_at: '2026-04-19T00:00:00Z' }),
    )
    expect(chain.eq).toHaveBeenCalledWith('razorpay_account_id', ACCOUNT_ID)
  })

  it('updates status without activated_at for non-activated transitions', async () => {
    const chain = mockChain({ data: null, error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(chain as never)

    await updateLinkedAccountStatus(ACCOUNT_ID, 'suspended')
    expect(chain.update).toHaveBeenCalledWith({ status: 'suspended' })
  })
})

describe('getLinkedAccountForUser', () => {
  it('returns null shape when no row exists', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain({ data: null, error: null }) as never,
    )

    const res = await getLinkedAccountForUser(USER_ID)
    expect(res).toEqual({
      status: null,
      activatedAt: null,
      holderName: null,
      bankAccountMasked: null,
      bankIfsc: null,
    })
  })

  it('returns masked bank info when activated', async () => {
    const rows = [
      mockChain({
        data: { status: 'activated', activated_at: '2026-04-19T00:00:00Z' },
        error: null,
      }),
      mockChain({
        data: {
          bank_account_holder: 'Asha Patil',
          bank_account_number_last4: '5678',
          bank_ifsc: 'HDFC0000001',
        },
        error: null,
      }),
    ]
    vi.mocked(supabase.from).mockImplementation(() => rows.shift() as never)

    const res = await getLinkedAccountForUser(USER_ID)
    expect(res.status).toBe('activated')
    expect(res.bankAccountMasked).toBe('XXXXXX5678')
    expect(res.bankAccountMasked).toMatch(/^XXXXXX\d{4}$/)
  })
})

describe('getActiveRazorpayAccountId', () => {
  it('returns id when status is activated', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain({
        data: { razorpay_account_id: ACCOUNT_ID, status: 'activated' },
        error: null,
      }) as never,
    )
    expect(await getActiveRazorpayAccountId(USER_ID)).toBe(ACCOUNT_ID)
  })

  it('returns null when no eligible row', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(
      mockChain({ data: null, error: null }) as never,
    )
    expect(await getActiveRazorpayAccountId(USER_ID)).toBeNull()
  })
})
