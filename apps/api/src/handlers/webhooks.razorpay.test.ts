import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'node:crypto'

vi.mock('../lib/supabase.js', () => ({
  supabase: { from: vi.fn() },
}))

vi.mock('../services/payout.service.js', () => ({
  createPayoutOnPaymentCaptured: vi.fn().mockResolvedValue(undefined),
  updatePayoutByTransferId: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../services/linked-account.service.js', () => ({
  updateLinkedAccountStatus: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../services/payout-notifications.service.js', () => ({
  notifyPayoutsEnabled: vi.fn().mockResolvedValue(undefined),
  notifyPayoutProcessed: vi.fn().mockResolvedValue(undefined),
  notifyPayoutFailed: vi.fn().mockResolvedValue(undefined),
  notifyLinkedAccountActionRequired: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../env.js', () => ({
  env: {
    RAZORPAY_WEBHOOK_SECRET: 'webhook_secret_test_32_chars_xx',
    NODE_ENV: 'test',
  },
}))

import { handleRazorpayWebhook } from './webhooks.razorpay.js'
import { supabase } from '../lib/supabase.js'
import {
  createPayoutOnPaymentCaptured,
  updatePayoutByTransferId,
} from '../services/payout.service.js'
import { updateLinkedAccountStatus } from '../services/linked-account.service.js'

const SECRET = 'webhook_secret_test_32_chars_xx'

function sign(body: string): string {
  return crypto.createHmac('sha256', SECRET).update(body).digest('hex')
}

type HeaderRecord = Record<string, string>

function makeCtx(body: string, headers: HeaderRecord) {
  let capturedStatus = 200
  const json = vi.fn((data: unknown, status?: number) => {
    capturedStatus = status ?? 200
    return { status: capturedStatus, body: data }
  })
  return {
    req: {
      text: async () => body,
      header: (name: string) => headers[name.toLowerCase()] ?? undefined,
    },
    json,
    get status() {
      return capturedStatus
    },
  } as unknown as Parameters<typeof handleRazorpayWebhook>[0]
}

function insertOkChain() {
  return {
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    select: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  }
}

function duplicateInsertChain() {
  return {
    insert: vi.fn().mockResolvedValue({ data: null, error: { code: '23505' } }),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
}

function maybeSingleChain(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  }
}

describe('handleRazorpayWebhook', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects request without x-razorpay-signature', async () => {
    await expect(
      handleRazorpayWebhook(makeCtx('{}', {}) as never),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('rejects request with wrong signature', async () => {
    const body = JSON.stringify({ event: 'payment.captured', id: 'evt_1' })
    await expect(
      handleRazorpayWebhook(
        makeCtx(body, { 'x-razorpay-signature': 'deadbeef' }) as never,
      ),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('accepts duplicate event (23505) and returns 200', async () => {
    const body = JSON.stringify({ event: 'payment.captured', id: 'evt_dup', payload: {} })
    vi.mocked(supabase.from).mockReturnValueOnce(duplicateInsertChain() as never)

    const res = await handleRazorpayWebhook(
      makeCtx(body, { 'x-razorpay-signature': sign(body) }) as never,
    )

    expect(res).toMatchObject({ status: 200, body: { data: { duplicate: true } } })
  })

  it('payment.captured: creates payout from order.entity.transfers[0].id', async () => {
    const body = JSON.stringify({
      event: 'payment.captured',
      id: 'evt_pc_1',
      payload: {
        payment: { entity: { order_id: 'ord_abc', transfers: [] } },
        order: { entity: { id: 'ord_abc', transfers: [{ id: 'trf_123' }] } },
      },
    })

    // 1st from() = insert webhook event
    vi.mocked(supabase.from)
      .mockReturnValueOnce(insertOkChain() as never)
      // 2nd from() = lookup booking by order_id
      .mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'bk_1' }, error: null }),
      } as never)
      // 3rd from() = update processed=true
      .mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as never)

    await handleRazorpayWebhook(
      makeCtx(body, { 'x-razorpay-signature': sign(body) }) as never,
    )

    expect(vi.mocked(createPayoutOnPaymentCaptured)).toHaveBeenCalledWith('bk_1', 'trf_123')
  })

  it('account.activated: flips linked account to activated with timestamp', async () => {
    const body = JSON.stringify({
      event: 'account.activated',
      id: 'evt_acc_1',
      payload: {
        account: {
          entity: { id: 'acc_link_1', activated_at: 1713000000 },
        },
      },
    })

    vi.mocked(supabase.from)
      .mockReturnValueOnce(insertOkChain() as never)
      // userIdForAccount lookup for payouts-enabled notification
      .mockReturnValueOnce(maybeSingleChain(null) as never)
      .mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as never)

    await handleRazorpayWebhook(
      makeCtx(body, { 'x-razorpay-signature': sign(body) }) as never,
    )

    expect(vi.mocked(updateLinkedAccountStatus)).toHaveBeenCalledWith(
      'acc_link_1',
      'activated',
      expect.stringMatching(/^2024-04-13/),
    )
  })

  it('account.suspended: flips linked account to suspended', async () => {
    const body = JSON.stringify({
      event: 'account.suspended',
      id: 'evt_acc_sus',
      payload: { account: { entity: { id: 'acc_bad_1' } } },
    })

    vi.mocked(supabase.from)
      .mockReturnValueOnce(insertOkChain() as never)
      // userIdForAccount lookup (notification path)
      .mockReturnValueOnce(maybeSingleChain(null) as never)
      .mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as never)

    await handleRazorpayWebhook(
      makeCtx(body, { 'x-razorpay-signature': sign(body) }) as never,
    )

    expect(vi.mocked(updateLinkedAccountStatus)).toHaveBeenCalledWith('acc_bad_1', 'suspended')
  })

  it('transfer.settled: marks payout completed', async () => {
    const body = JSON.stringify({
      event: 'transfer.settled',
      id: 'evt_t_set',
      payload: { transfer: { entity: { id: 'trf_9' } } },
    })

    vi.mocked(supabase.from)
      .mockReturnValueOnce(insertOkChain() as never)
      // notifyCompletionIfFirst: payouts lookup returns null → no notify
      .mockReturnValueOnce(maybeSingleChain(null) as never)
      .mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as never)

    await handleRazorpayWebhook(
      makeCtx(body, { 'x-razorpay-signature': sign(body) }) as never,
    )

    expect(vi.mocked(updatePayoutByTransferId)).toHaveBeenCalledWith(
      'trf_9',
      expect.objectContaining({ status: 'completed', processedAt: expect.any(String) }),
    )
  })

  it('payout.reversed: marks payout failed with reason', async () => {
    const body = JSON.stringify({
      event: 'payout.reversed',
      id: 'evt_p_rev',
      payload: {
        payout: {
          entity: {
            id: 'pout_1',
            transfer_id: 'trf_rev',
            failure_reason: 'beneficiary_rejected',
          },
        },
      },
    })

    vi.mocked(supabase.from)
      .mockReturnValueOnce(insertOkChain() as never)
      // payoutContextForTransfer: payouts lookup returns null → no notify
      .mockReturnValueOnce(maybeSingleChain(null) as never)
      .mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as never)

    await handleRazorpayWebhook(
      makeCtx(body, { 'x-razorpay-signature': sign(body) }) as never,
    )

    expect(vi.mocked(updatePayoutByTransferId)).toHaveBeenCalledWith('trf_rev', {
      status: 'failed',
      failureReason: 'beneficiary_rejected',
    })
  })

  it('unknown event type: no-ops and returns 200', async () => {
    const body = JSON.stringify({ event: 'subscription.charged', id: 'evt_unk', payload: {} })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(insertOkChain() as never)
      .mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      } as never)

    const res = await handleRazorpayWebhook(
      makeCtx(body, { 'x-razorpay-signature': sign(body) }) as never,
    )

    expect(res).toMatchObject({ body: { data: { processed: true } } })
    expect(vi.mocked(createPayoutOnPaymentCaptured)).not.toHaveBeenCalled()
    expect(vi.mocked(updatePayoutByTransferId)).not.toHaveBeenCalled()
    expect(vi.mocked(updateLinkedAccountStatus)).not.toHaveBeenCalled()
  })
})
