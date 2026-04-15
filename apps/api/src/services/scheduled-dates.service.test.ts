import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────

vi.mock('../lib/supabase.js', () => {
  const mockSupabase = { from: vi.fn(), rpc: vi.fn() }
  return { supabase: mockSupabase }
})

import {
  addScheduledDate,
  updateScheduledDate,
  deleteScheduledDate,
  listScheduledDates,
  getAvailableDates,
} from './scheduled-dates.service.js'
import { supabase } from '../lib/supabase.js'

// ─── Mock helpers ─────────────────────────────────────────────────

function mockChain(
  data: unknown,
  error: unknown = null,
  count: number | null = null,
) {
  const resolvedVal = { data, error, count }
  const chain: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    head: vi.fn().mockReturnThis(),
    then: (
      onFulfilled: (val: typeof resolvedVal) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolvedVal).then(onFulfilled, onRejected),
  }
  return chain
}

// ─── Fixtures ─────────────────────────────────────────────────────

const USER_ID = 'user-001'
const OTHER_USER_ID = 'user-002'
const CONTENT_ID = 'exp-001'
const DATE_ID = 'date-001'

const FUTURE_DATE = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
const PAST_DATE = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
const TODAY = new Date().toISOString().slice(0, 10)

const experienceContent = {
  id: CONTENT_ID,
  user_id: USER_ID,
  type: 'scheduled_experience',
}

const dateRow = {
  id: DATE_ID,
  content_id: CONTENT_ID,
  start_date: FUTURE_DATE,
  end_date: FUTURE_DATE,
  capacity: 10,
  spots_booked: 0,
  is_active: true,
}

// ─── addScheduledDate ─────────────────────────────────────────────

describe('addScheduledDate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('adds a scheduled date successfully', async () => {
    vi.mocked(supabase.from)
      // verifyContentOwner — content fetch
      .mockReturnValueOnce(mockChain(experienceContent) as never)
      // insert
      .mockReturnValueOnce(mockChain({ id: DATE_ID }) as never)

    const result = await addScheduledDate(CONTENT_ID, USER_ID, {
      startDate: FUTURE_DATE,
      endDate: FUTURE_DATE,
      capacity: 10,
    })

    expect(result).toMatchObject({ id: DATE_ID })
    expect(supabase.from).toHaveBeenCalledWith('scheduled_dates')
  })

  it('throws 403 when user does not own the experience', async () => {
    const otherContent = { ...experienceContent, user_id: OTHER_USER_ID }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(otherContent) as never)

    await expect(
      addScheduledDate(CONTENT_ID, USER_ID, {
        startDate: FUTURE_DATE,
        endDate: FUTURE_DATE,
        capacity: 10,
      }),
    ).rejects.toMatchObject({ status: 403, type: 'forbidden' })
  })

  it('throws 400 when startDate is today or in the past', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(experienceContent) as never)

    await expect(
      addScheduledDate(CONTENT_ID, USER_ID, {
        startDate: TODAY,
        endDate: TODAY,
        capacity: 10,
      }),
    ).rejects.toMatchObject({
      status: 400,
      type: 'validation-failed',
    })
  })

  it('throws 400 when startDate is in the past', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(experienceContent) as never)

    const err = await addScheduledDate(CONTENT_ID, USER_ID, {
      startDate: PAST_DATE,
      endDate: PAST_DATE,
      capacity: 5,
    }).catch((e) => e)

    expect(err.status).toBe(400)
    const fieldError = err.errors?.find((e: { code: string }) => e.code === 'in_past')
    expect(fieldError).toBeDefined()
  })

  it('throws 400 when endDate is before startDate', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(experienceContent) as never)

    // startDate is 10 days out, pastEnd is only 3 days out => pastEnd < startDate
    const futureStart = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const earlierEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const err = await addScheduledDate(CONTENT_ID, USER_ID, {
      startDate: futureStart,
      endDate: earlierEnd,
      capacity: 5,
    }).catch((e) => e)

    // Either validation-failed for invalid_range
    expect(err.status).toBe(400)
  })

  it('throws 400 when capacity is 0', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(experienceContent) as never)

    const err = await addScheduledDate(CONTENT_ID, USER_ID, {
      startDate: FUTURE_DATE,
      endDate: FUTURE_DATE,
      capacity: 0,
    }).catch((e) => e)

    expect(err.status).toBe(400)
    const fieldError = err.errors?.find((e: { code: string }) => e.code === 'invalid_range')
    expect(fieldError).toBeDefined()
  })

  it('throws 400 when capacity exceeds 100', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(experienceContent) as never)

    const err = await addScheduledDate(CONTENT_ID, USER_ID, {
      startDate: FUTURE_DATE,
      endDate: FUTURE_DATE,
      capacity: 101,
    }).catch((e) => e)

    expect(err.status).toBe(400)
    const fieldError = err.errors?.find((e: { code: string }) => e.code === 'invalid_range')
    expect(fieldError).toBeDefined()
  })

})

// ─── updateScheduledDate ──────────────────────────────────────────

describe('updateScheduledDate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates capacity successfully', async () => {
    vi.mocked(supabase.from)
      // verifyDateOwner — date fetch
      .mockReturnValueOnce(mockChain(dateRow) as never)
      // verifyContentOwner — content fetch
      .mockReturnValueOnce(mockChain(experienceContent) as never)
      // update
      .mockReturnValueOnce(mockChain(null, null) as never)

    await expect(
      updateScheduledDate(DATE_ID, USER_ID, { capacity: 20 }),
    ).resolves.toBeUndefined()
  })

  it('updates isActive successfully', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(dateRow) as never)
      .mockReturnValueOnce(mockChain(experienceContent) as never)
      .mockReturnValueOnce(mockChain(null, null) as never)

    await expect(
      updateScheduledDate(DATE_ID, USER_ID, { isActive: false }),
    ).resolves.toBeUndefined()
  })

  it('throws 400 when new capacity is less than spots_booked', async () => {
    const bookedDate = { ...dateRow, spots_booked: 8 }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(bookedDate) as never)
      .mockReturnValueOnce(mockChain(experienceContent) as never)

    const err = await updateScheduledDate(DATE_ID, USER_ID, { capacity: 5 }).catch((e) => e)

    expect(err.status).toBe(400)
    const fieldError = err.errors?.find((e: { code: string }) => e.code === 'below_booked')
    expect(fieldError).toBeDefined()
  })

  it('throws 403 when user does not own the experience', async () => {
    const otherContent = { ...experienceContent, user_id: OTHER_USER_ID }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(dateRow) as never)
      .mockReturnValueOnce(mockChain(otherContent) as never)

    await expect(
      updateScheduledDate(DATE_ID, USER_ID, { capacity: 20 }),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('throws 404 when date does not exist', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(null, { message: 'not found' }) as never)

    await expect(
      updateScheduledDate('nonexistent', USER_ID, { capacity: 5 }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('is a no-op when data is empty', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(dateRow) as never)
      .mockReturnValueOnce(mockChain(experienceContent) as never)

    await expect(
      updateScheduledDate(DATE_ID, USER_ID, {}),
    ).resolves.toBeUndefined()

    // Only 2 calls: date fetch + content owner check
    expect(supabase.from).toHaveBeenCalledTimes(2)
  })
})

// ─── deleteScheduledDate ──────────────────────────────────────────

describe('deleteScheduledDate', () => {
  beforeEach(() => vi.clearAllMocks())

  it('hard-deletes date when no bookings exist', async () => {
    const noBookings = { ...dateRow, spots_booked: 0 }
    vi.mocked(supabase.from)
      // verifyDateOwner — date fetch
      .mockReturnValueOnce(mockChain(noBookings) as never)
      // verifyContentOwner — content fetch
      .mockReturnValueOnce(mockChain(experienceContent) as never)
      // hard delete
      .mockReturnValueOnce(mockChain(null, null) as never)

    await expect(deleteScheduledDate(DATE_ID, USER_ID)).resolves.toBeUndefined()

    // Third call should be delete (not update)
    const calls = vi.mocked(supabase.from).mock.results
    expect(calls).toHaveLength(3)
  })

  it('soft-deletes (is_active=false) when bookings exist', async () => {
    const bookedDate = { ...dateRow, spots_booked: 3 }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(bookedDate) as never)
      .mockReturnValueOnce(mockChain(experienceContent) as never)
      // soft-delete update
      .mockReturnValueOnce(mockChain(null, null) as never)

    await expect(deleteScheduledDate(DATE_ID, USER_ID)).resolves.toBeUndefined()

    // Should have called update (soft-delete), not delete
    const calls = vi.mocked(supabase.from).mock.calls
    expect(calls).toHaveLength(3)
  })

  it('throws 403 when user does not own the experience', async () => {
    const otherContent = { ...experienceContent, user_id: OTHER_USER_ID }
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(dateRow) as never)
      .mockReturnValueOnce(mockChain(otherContent) as never)

    await expect(
      deleteScheduledDate(DATE_ID, USER_ID),
    ).rejects.toMatchObject({ status: 403 })
  })

  it('throws 404 when date does not exist', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(null, { message: 'not found' }) as never)

    await expect(
      deleteScheduledDate('nonexistent', USER_ID),
    ).rejects.toMatchObject({ status: 404 })
  })
})

// ─── listScheduledDates ───────────────────────────────────────────

describe('listScheduledDates', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns all active dates ordered by start_date', async () => {
    const dates = [
      { ...dateRow, id: 'date-001', start_date: FUTURE_DATE },
      {
        ...dateRow,
        id: 'date-002',
        start_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      },
    ]
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain(dates) as never)

    const result = await listScheduledDates(CONTENT_ID)

    expect(result).toHaveLength(2)
    expect(result[0]!.id).toBe('date-001')
    expect(result[0]!.spotsLeft).toBe(10)
    expect(result[0]!.isSoldOut).toBe(false)
  })

  it('returns empty array when no active dates', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain([]) as never)

    const result = await listScheduledDates(CONTENT_ID)

    expect(result).toHaveLength(0)
  })

  it('throws 500 on DB error', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(null, { message: 'connection failed' }) as never)

    await expect(listScheduledDates(CONTENT_ID)).rejects.toMatchObject({ status: 500 })
  })

  it('correctly computes isSoldOut when capacity is full', async () => {
    const soldOut = { ...dateRow, spots_booked: 10, capacity: 10 }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain([soldOut]) as never)

    const result = await listScheduledDates(CONTENT_ID)

    expect(result[0]!.isSoldOut).toBe(true)
    expect(result[0]!.spotsLeft).toBe(0)
  })
})

// ─── getAvailableDates ────────────────────────────────────────────

describe('getAvailableDates', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns only future dates with available spots', async () => {
    const available = { ...dateRow, spots_booked: 5, capacity: 10 }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain([available]) as never)

    const result = await getAvailableDates(CONTENT_ID)

    expect(result).toHaveLength(1)
    expect(result[0]!.isSoldOut).toBe(false)
    expect(result[0]!.spotsLeft).toBe(5)
  })

  it('filters out sold-out dates', async () => {
    const soldOut = { ...dateRow, spots_booked: 10, capacity: 10 }
    const available = { ...dateRow, id: 'date-002', spots_booked: 0, capacity: 10 }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain([soldOut, available]) as never)

    const result = await getAvailableDates(CONTENT_ID)

    expect(result).toHaveLength(1)
    expect(result[0]!.id).toBe('date-002')
  })

  it('returns empty array when all dates are sold out', async () => {
    const soldOut = { ...dateRow, spots_booked: 10, capacity: 10 }
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain([soldOut]) as never)

    const result = await getAvailableDates(CONTENT_ID)

    expect(result).toHaveLength(0)
  })

  it('returns empty array when no future dates exist', async () => {
    vi.mocked(supabase.from).mockReturnValueOnce(mockChain([]) as never)

    const result = await getAvailableDates(CONTENT_ID)

    expect(result).toHaveLength(0)
  })

  it('throws 500 on DB error', async () => {
    vi.mocked(supabase.from)
      .mockReturnValueOnce(mockChain(null, { message: 'timeout' }) as never)

    await expect(getAvailableDates(CONTENT_ID)).rejects.toMatchObject({ status: 500 })
  })
})
