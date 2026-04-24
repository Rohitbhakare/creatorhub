import { describe, it, expect } from 'vitest'
import { toBudgetTier, readTimeMinFromBody } from './discoverability.js'

describe('toBudgetTier', () => {
  it('returns "free" for zero, null, undefined, or negative paisa', () => {
    expect(toBudgetTier(0)).toBe('free')
    expect(toBudgetTier(null)).toBe('free')
    expect(toBudgetTier(undefined)).toBe('free')
    expect(toBudgetTier(-100)).toBe('free')
  })

  it('returns "free" when pricing_model is "free" even if price is set', () => {
    expect(toBudgetTier(250_000, 'free')).toBe('free')
  })

  it('buckets prices according to DISC-FR-023a thresholds', () => {
    expect(toBudgetTier(1)).toBe('₹')            // any paid > 0
    expect(toBudgetTier(99_999)).toBe('₹')        // just under ₹1,000
    expect(toBudgetTier(100_000)).toBe('₹₹')      // ₹1,000 boundary
    expect(toBudgetTier(249_999)).toBe('₹₹')      // just under ₹2,500
    expect(toBudgetTier(250_000)).toBe('₹₹₹')     // ₹2,500 boundary
    expect(toBudgetTier(499_999)).toBe('₹₹₹')     // just under ₹5,000
    expect(toBudgetTier(500_000)).toBe('₹₹₹₹')    // ₹5,000 boundary
    expect(toBudgetTier(9_999_900)).toBe('₹₹₹₹')  // big-ticket
  })
})

describe('readTimeMinFromBody', () => {
  it('returns null for empty/nullish bodies', () => {
    expect(readTimeMinFromBody(null)).toBeNull()
    expect(readTimeMinFromBody(undefined)).toBeNull()
    expect(readTimeMinFromBody('')).toBeNull()
    expect(readTimeMinFromBody('   \n\t  ')).toBeNull()
  })

  it('returns at least 1 for any non-empty body', () => {
    expect(readTimeMinFromBody('hello')).toBe(1)
    expect(readTimeMinFromBody('one two three')).toBe(1)
  })

  it('ceils at 200 words per minute', () => {
    const twoHundred = Array(200).fill('word').join(' ')
    expect(readTimeMinFromBody(twoHundred)).toBe(1)

    const twoHundredOne = Array(201).fill('word').join(' ')
    expect(readTimeMinFromBody(twoHundredOne)).toBe(2)

    const thousand = Array(1000).fill('word').join(' ')
    expect(readTimeMinFromBody(thousand)).toBe(5)
  })

  it('collapses whitespace runs — "a   b" counts as 2 words', () => {
    expect(readTimeMinFromBody('a   b\n\nc\td')).toBe(1)
  })
})
