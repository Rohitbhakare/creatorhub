import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../env.js', () => ({
  env: { INTERNAL_CRON_KEY: 'cron_secret_test_32_chars_xxxxxx' },
}))

vi.mock('../services/payout.service.js', () => ({
  releasePendingPayouts: vi.fn(),
}))

import { handleReleasePayoutsCron } from './internal.cron.js'
import { releasePendingPayouts } from '../services/payout.service.js'

type Headers = Record<string, string>

function makeCtx(headers: Headers = {}) {
  return {
    req: { header: (name: string) => headers[name.toLowerCase()] },
    json: (data: unknown) => ({ body: data }),
  } as unknown as Parameters<typeof handleReleasePayoutsCron>[0]
}

describe('handleReleasePayoutsCron', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects request without x-internal-cron-key', async () => {
    await expect(
      handleReleasePayoutsCron(makeCtx() as never),
    ).rejects.toMatchObject({ status: 401 })
  })

  it('rejects request with wrong key', async () => {
    await expect(
      handleReleasePayoutsCron(
        makeCtx({ 'x-internal-cron-key': 'wrong_key_padding_to_same_length' }) as never,
      ),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('returns release counts on valid key', async () => {
    vi.mocked(releasePendingPayouts).mockResolvedValueOnce({
      released: 3,
      skipped: 1,
      failed: 0,
    })

    const res = (await handleReleasePayoutsCron(
      makeCtx({ 'x-internal-cron-key': 'cron_secret_test_32_chars_xxxxxx' }) as never,
    )) as unknown as { body: { data: { released: number } } }

    expect(res.body.data).toEqual({ released: 3, skipped: 1, failed: 0 })
    expect(vi.mocked(releasePendingPayouts)).toHaveBeenCalledOnce()
  })
})
