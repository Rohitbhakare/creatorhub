import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../services/payout.service.js', () => ({
  listPayoutsForCreator: vi.fn(),
  getPayoutSummary: vi.fn(),
}))

vi.mock('../services/linked-account.service.js', () => ({
  getLinkedAccountForUser: vi.fn(),
}))

import {
  handleListMyPayouts,
  handleGetMyLinkedAccount,
} from './creators.payouts.js'
import {
  listPayoutsForCreator,
  getPayoutSummary,
} from '../services/payout.service.js'
import { getLinkedAccountForUser } from '../services/linked-account.service.js'

type Query = Record<string, string | undefined>

function makeCtx(userId: string, query: Query = {}) {
  return {
    get: (k: string) => (k === 'userId' ? userId : undefined),
    req: {
      query: (k: string) => query[k],
    },
    json: (data: unknown) => ({ body: data }),
  } as unknown as Parameters<typeof handleListMyPayouts>[0]
}

describe('handleListMyPayouts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns items + cursor + summary for the authenticated creator', async () => {
    vi.mocked(listPayoutsForCreator).mockResolvedValueOnce({
      items: [
        {
          id: 'po_1',
          bookingId: 'bk_1',
          amountPaisa: 100000,
          tdsPaisa: 1000,
          status: 'pending',
          scheduledAt: '2026-04-19T00:00:00Z',
          processedAt: null,
          bookingTitle: 'Goa Sunset',
          failureReason: null,
        },
      ],
      nextCursor: 'cur_next',
    })
    vi.mocked(getPayoutSummary).mockResolvedValueOnce({
      pendingPaisa: 100000,
      processingPaisa: 0,
      paidLast30dPaisa: 50000,
    })

    const res = (await handleListMyPayouts(
      makeCtx('creator-1', { limit: '10' }) as never,
    )) as unknown as { body: { data: { items: unknown[]; summary: unknown; next_cursor: string | null } } }

    expect(res.body.data.items).toHaveLength(1)
    expect(res.body.data.next_cursor).toBe('cur_next')
    expect(res.body.data.summary).toEqual({
      pendingPaisa: 100000,
      processingPaisa: 0,
      paidLast30dPaisa: 50000,
    })
    expect(vi.mocked(listPayoutsForCreator)).toHaveBeenCalledWith(
      'creator-1',
      {},
      { limit: 10 },
    )
  })

  it('forwards status filter and cursor', async () => {
    vi.mocked(listPayoutsForCreator).mockResolvedValueOnce({ items: [], nextCursor: null })
    vi.mocked(getPayoutSummary).mockResolvedValueOnce({
      pendingPaisa: 0,
      processingPaisa: 0,
      paidLast30dPaisa: 0,
    })

    await handleListMyPayouts(
      makeCtx('creator-1', { status: 'scheduled', cursor: 'abc', limit: '5' }) as never,
    )

    expect(vi.mocked(listPayoutsForCreator)).toHaveBeenCalledWith(
      'creator-1',
      { status: 'scheduled' },
      { limit: 5, cursor: 'abc' },
    )
  })

  it('rejects invalid status', async () => {
    await expect(
      handleListMyPayouts(makeCtx('creator-1', { status: 'bogus' }) as never),
    ).rejects.toMatchObject({ status: 400 })
  })
})

describe('handleGetMyLinkedAccount', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns linked account snapshot', async () => {
    vi.mocked(getLinkedAccountForUser).mockResolvedValueOnce({
      status: 'activated',
      activatedAt: '2026-04-10T00:00:00Z',
      holderName: 'Rohit B',
      bankAccountMasked: 'XXXXXX5678',
      bankIfsc: 'HDFC0000123',
    })

    const res = (await handleGetMyLinkedAccount(
      makeCtx('creator-1') as never,
    )) as unknown as { body: { data: { status: string } } }

    expect(res.body.data.status).toBe('activated')
    expect(vi.mocked(getLinkedAccountForUser)).toHaveBeenCalledWith('creator-1')
  })

  it('returns null-status snapshot when no account exists', async () => {
    vi.mocked(getLinkedAccountForUser).mockResolvedValueOnce({
      status: null,
      activatedAt: null,
      holderName: null,
      bankAccountMasked: null,
      bankIfsc: null,
    })

    const res = (await handleGetMyLinkedAccount(
      makeCtx('creator-1') as never,
    )) as unknown as { body: { data: { status: string | null } } }

    expect(res.body.data.status).toBeNull()
  })
})
