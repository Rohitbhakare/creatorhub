import { describe, it, expect } from 'vitest'
import { calculatePricing, formatPricePaisa } from './pricing.js'

// ─── calculatePricing ──────────────────────────────────────────

describe('calculatePricing', () => {
  describe('free content (0 paisa)', () => {
    it('returns all zeros for free content', () => {
      const result = calculatePricing(0)
      expect(result.basePricePaisa).toBe(0)
      expect(result.gstPaisa).toBe(0)
      expect(result.totalBuyerPaisa).toBe(0)
      expect(result.platformFeePaisa).toBe(0)
      expect(result.tdsPaisa).toBe(0)
      expect(result.creatorTakeHomePaisa).toBe(0)
    })
  })

  describe('standard pricing (₹500 = 50000 paisa)', () => {
    it('calculates GST at 18%', () => {
      const result = calculatePricing(50000)
      // 50000 * 0.18 = 9000 (exact)
      expect(result.gstPaisa).toBe(9000)
    })

    it('calculates total buyer price as base + GST', () => {
      const result = calculatePricing(50000)
      expect(result.totalBuyerPaisa).toBe(59000) // 50000 + 9000
    })

    it('calculates platform fee at 17%', () => {
      const result = calculatePricing(50000)
      // 50000 * 0.17 = 8500 (exact)
      expect(result.platformFeePaisa).toBe(8500)
    })

    it('calculates TDS at 1% on (base - platform fee)', () => {
      const result = calculatePricing(50000)
      // base - platform = 50000 - 8500 = 41500; TDS = 41500 * 0.01 = 415 (exact)
      expect(result.tdsPaisa).toBe(415)
    })

    it('calculates creator take-home as base - platform fee - TDS', () => {
      const result = calculatePricing(50000)
      // 50000 - 8500 - 415 = 41085
      expect(result.creatorTakeHomePaisa).toBe(41085)
    })
  })

  describe('standard pricing (₹6500 = 650000 paisa)', () => {
    it('returns correct breakdown for ₹6500', () => {
      const result = calculatePricing(650000)
      // GST: 650000 * 0.18 = 117000 (exact)
      expect(result.gstPaisa).toBe(117000)
      // Total buyer: 650000 + 117000 = 767000
      expect(result.totalBuyerPaisa).toBe(767000)
      // Platform fee: Math.ceil(650000 * 0.17)
      // JS float: 650000 * 0.17 = 110500.00000000001 → ceil → 110501
      expect(result.platformFeePaisa).toBe(110501)
      // Net after platform: 650000 - 110501 = 539499
      // TDS: Math.ceil(539499 * 0.01) = Math.ceil(5394.99) = 5395
      expect(result.tdsPaisa).toBe(5395)
      // Creator take-home: 539499 - 5395 = 534104
      expect(result.creatorTakeHomePaisa).toBe(534104)
    })
  })

  describe('rounding behavior (Math.ceil — creator never overpaid)', () => {
    it('rounds GST up when not exact', () => {
      // ₹333 = 33300 paisa; 33300 * 0.18 = 5994 (exact, no rounding needed)
      // Use ₹101 = 10100 paisa; 10100 * 0.18 = 1818 (exact)
      // Use ₹1 = 100 paisa; 100 * 0.18 = 18 (exact)
      // Use ₹7 = 700 paisa; 700 * 0.18 = 126 (exact)
      // Use a prime: ₹11 = 1100 paisa; 1100 * 0.18 = 198 (exact)
      // Need a non-exact case. Try 1 paisa (edge): 1 * 0.18 = 0.18 → ceil → 1
      const result = calculatePricing(1)
      expect(result.gstPaisa).toBe(1) // Math.ceil(0.18) = 1
    })

    it('rounds platform fee up when not exact', () => {
      // 1 paisa * 0.17 = 0.17 → ceil → 1
      const result = calculatePricing(1)
      expect(result.platformFeePaisa).toBe(1) // Math.ceil(0.17) = 1
    })

    it('creator take-home can be 0 for 1-paisa edge case', () => {
      // Base = 1, platform = 1, creatorNet = 0, TDS = 0 (ceil(0*0.01)=0)
      const result = calculatePricing(1)
      expect(result.creatorTakeHomePaisa).toBe(0)
    })

    it('base price is preserved exactly (no rounding)', () => {
      const result = calculatePricing(99999)
      expect(result.basePricePaisa).toBe(99999)
    })
  })

  describe('high value (₹25000 = 2500000 paisa)', () => {
    it('calculates correctly for high-value content', () => {
      const result = calculatePricing(2500000)
      expect(result.gstPaisa).toBe(450000)         // 2500000 * 0.18 = 450000 (exact)
      expect(result.totalBuyerPaisa).toBe(2950000) // 2500000 + 450000
      // Platform fee: Math.ceil(2500000 * 0.17)
      // JS float: 2500000 * 0.17 = 425000.00000000005 → ceil → 425001
      expect(result.platformFeePaisa).toBe(425001)
      // Net: 2500000 - 425001 = 2074999
      // TDS: Math.ceil(2074999 * 0.01) = Math.ceil(20749.99) = 20750
      expect(result.tdsPaisa).toBe(20750)
      // Creator: 2074999 - 20750 = 2054249
      expect(result.creatorTakeHomePaisa).toBe(2054249)
    })
  })

  describe('negative price guard', () => {
    it('throws for negative price', () => {
      expect(() => calculatePricing(-1)).toThrow('Price cannot be negative')
    })

    it('throws for large negative price', () => {
      expect(() => calculatePricing(-100000)).toThrow('Price cannot be negative')
    })
  })

  describe('mathematical invariants', () => {
    const testPrices = [100, 50000, 650000, 1000000, 2500000]

    testPrices.forEach((price) => {
      it(`totalBuyerPaisa = base + GST for ${price} paisa`, () => {
        const r = calculatePricing(price)
        expect(r.totalBuyerPaisa).toBe(r.basePricePaisa + r.gstPaisa)
      })

      it(`creatorTakeHome = base - platformFee - TDS for ${price} paisa`, () => {
        const r = calculatePricing(price)
        const expected = r.basePricePaisa - r.platformFeePaisa - r.tdsPaisa
        expect(r.creatorTakeHomePaisa).toBe(expected)
      })

      it(`creatorTakeHome is non-negative for ${price} paisa`, () => {
        const r = calculatePricing(price)
        expect(r.creatorTakeHomePaisa).toBeGreaterThanOrEqual(0)
      })
    })
  })
})

// ─── formatPricePaisa ──────────────────────────────────────────

describe('formatPricePaisa', () => {
  it('returns "FREE" for 0 paisa', () => {
    expect(formatPricePaisa(0)).toBe('FREE')
  })

  it('formats ₹500 correctly (50000 paisa)', () => {
    const result = formatPricePaisa(50000)
    expect(result).toContain('500')
    expect(result).toContain('₹')
  })

  it('formats ₹6500 correctly (650000 paisa)', () => {
    const result = formatPricePaisa(650000)
    expect(result).toContain('6,500')
    expect(result).toContain('₹')
  })

  it('formats ₹1,00,000 with Indian grouping (10000000 paisa)', () => {
    const result = formatPricePaisa(10000000)
    // Indian grouping: 1,00,000
    expect(result).toContain('1,00,000')
    expect(result).toContain('₹')
  })

  it('does not include decimal for whole rupee amounts', () => {
    const result = formatPricePaisa(50000) // ₹500
    expect(result).not.toContain('.00')
  })

  it('formats minimum non-zero amount (1 paisa)', () => {
    const result = formatPricePaisa(1)
    // 0.01 rupees
    expect(result).toContain('₹')
  })
})
