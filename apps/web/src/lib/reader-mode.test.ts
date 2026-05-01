import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

import { cookies } from 'next/headers'
import { getReaderMode, READER_MODE_COOKIE } from './reader-mode'

describe('reader-mode (E5.3 T8 scaffold)', () => {
  beforeEach(() => {
    vi.mocked(cookies).mockReset()
  })

  it('defaults to magazine when no cookie set', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: () => undefined,
    } as unknown as Awaited<ReturnType<typeof cookies>>)
    expect(await getReaderMode()).toBe('magazine')
  })

  it('returns compact when cookie says compact', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) => (name === READER_MODE_COOKIE ? { value: 'compact' } : undefined),
    } as unknown as Awaited<ReturnType<typeof cookies>>)
    expect(await getReaderMode()).toBe('compact')
  })

  it('falls back to magazine when cookie value is junk', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: () => ({ value: 'spaghetti' }),
    } as unknown as Awaited<ReturnType<typeof cookies>>)
    expect(await getReaderMode()).toBe('magazine')
  })
})
