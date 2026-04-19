import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../env.js', () => ({
  env: {
    RAZORPAY_KEY_ID: 'rzp_test_xxx',
    RAZORPAY_KEY_SECRET: 'super_secret_never_log',
  },
}))

import {
  createLinkedAccount,
  fetchLinkedAccount,
  editTransfer,
  reverseTransfer,
  fetchPayout,
} from './razorpay.js'
import { AppError } from '../errors/AppError.js'

type FetchCall = { url: string; init: RequestInit }

function mockFetch(responses: Array<{ status: number; body: unknown } | Error>) {
  const calls: FetchCall[] = []
  const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
    const next = responses.shift()
    calls.push({ url: String(url), init: init ?? {} })
    if (next instanceof Error) throw next
    if (!next) throw new Error('No more mocked responses')
    return new Response(
      next.body === undefined ? '' : JSON.stringify(next.body),
      { status: next.status },
    )
  })
  vi.stubGlobal('fetch', fetchMock)
  return { calls }
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('razorpay lib', () => {
  describe('createLinkedAccount', () => {
    it('returns linked account on 200 with type=route injected', async () => {
      const { calls } = mockFetch([
        { status: 200, body: { id: 'acc_123', status: 'created' } },
      ])
      const res = await createLinkedAccount({
        email: 'c@x.com',
        phone: '+919999999999',
        legal_business_name: 'Creator LLP',
        business_type: 'individual',
        contact_name: 'Asha',
        profile: {
          category: 'education',
          subcategory: 'others',
          addresses: {
            registered: {
              street1: 'x',
              city: 'Pune',
              state: 'Maharashtra',
              postal_code: '411001',
              country: 'IN',
            },
          },
        },
      })
      expect(res.id).toBe('acc_123')
      expect(calls[0]!.url).toBe('https://api.razorpay.com/v2/accounts')
      expect(calls[0]!.init.method).toBe('POST')
      const parsed = JSON.parse(calls[0]!.init.body as string) as { type: string }
      expect(parsed.type).toBe('route')
      // Auth header present and base64-encoded; plaintext secret must not leak.
      const auth = (calls[0]!.init.headers as Record<string, string>).Authorization
      expect(auth).toMatch(/^Basic /)
      expect(auth).not.toContain('super_secret')
    })

    it('4xx → AppError external_service with razorpay code suffix, no secret leak', async () => {
      mockFetch([
        {
          status: 400,
          body: { error: { code: 'BAD_REQUEST_ERROR', description: 'Invalid IFSC' } },
        },
      ])
      await expect(
        createLinkedAccount({
          email: 'c@x.com',
          phone: '+919999999999',
          legal_business_name: 'x',
          business_type: 'individual',
          contact_name: 'Asha',
          profile: {
            category: 'x',
            subcategory: 'x',
            addresses: {
              registered: {
                street1: 'x',
                city: 'x',
                state: 'x',
                postal_code: '000000',
                country: 'IN',
              },
            },
          },
        }),
      ).rejects.toMatchObject({
        name: 'AppError',
        type: 'external_service',
        status: 502,
      })
    })
  })

  describe('fetchLinkedAccount', () => {
    it('returns status on 200', async () => {
      const { calls } = mockFetch([
        { status: 200, body: { id: 'acc_9', status: 'activated' } },
      ])
      const res = await fetchLinkedAccount('acc_9')
      expect(res.status).toBe('activated')
      expect(calls[0]!.url).toBe('https://api.razorpay.com/v2/accounts/acc_9')
    })

    it('5xx → external_service 502 (retryable shape)', async () => {
      mockFetch([{ status: 503, body: {} }])
      try {
        await fetchLinkedAccount('acc_9')
        expect.fail('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(AppError)
        expect((err as AppError).status).toBe(502)
        expect((err as AppError).type).toBe('external_service')
        expect((err as AppError).detail).not.toContain('super_secret')
      }
    })
  })

  describe('editTransfer', () => {
    it('sends PATCH with on_hold flag', async () => {
      const { calls } = mockFetch([
        {
          status: 200,
          body: { id: 'trf_1', status: 'processed', on_hold: false, amount: 100, currency: 'INR', recipient: 'acc_1' },
        },
      ])
      const res = await editTransfer('trf_1', { on_hold: 0 })
      expect(res.id).toBe('trf_1')
      expect(calls[0]!.url).toBe('https://api.razorpay.com/v1/transfers/trf_1')
      expect(calls[0]!.init.method).toBe('PATCH')
      const body = JSON.parse(calls[0]!.init.body as string) as { on_hold: number }
      expect(body.on_hold).toBe(0)
    })
  })

  describe('reverseTransfer', () => {
    it('POSTs to /reversals with amount', async () => {
      const { calls } = mockFetch([
        { status: 200, body: { id: 'rv_1', status: 'processed', transfer_id: 'trf_1', amount: 500 } },
      ])
      const res = await reverseTransfer('trf_1', 500)
      expect(res.id).toBe('rv_1')
      expect(calls[0]!.url).toBe('https://api.razorpay.com/v1/transfers/trf_1/reversals')
      expect(calls[0]!.init.method).toBe('POST')
      const body = JSON.parse(calls[0]!.init.body as string) as { amount: number }
      expect(body.amount).toBe(500)
    })
  })

  describe('fetchPayout', () => {
    it('returns payout details', async () => {
      const { calls } = mockFetch([
        { status: 200, body: { id: 'pout_1', status: 'processed', amount: 10000 } },
      ])
      const res = await fetchPayout('pout_1')
      expect(res.status).toBe('processed')
      expect(calls[0]!.url).toBe('https://api.razorpay.com/v1/payouts/pout_1')
    })
  })

  describe('network failure', () => {
    it('timeout / network error → external_service 502', async () => {
      mockFetch([new Error('ECONNRESET')])
      try {
        await fetchPayout('pout_1')
        expect.fail('should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(AppError)
        expect((err as AppError).status).toBe(502)
      }
    })
  })
})
