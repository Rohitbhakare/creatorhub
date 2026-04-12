import { PLATFORM_FEE_RATE, GST_RATE, TDS_RATE } from '../constants/index.js'

// ─── Types ──────────────────────────────────────────────────
export type PricingBreakdown = {
  /** Input base price in paisa */
  basePricePaisa: number
  /** 18% GST on base price (buyer pays, shown separately) */
  gstPaisa: number
  /** base + GST — what the buyer sees at checkout */
  totalBuyerPaisa: number
  /** 17% platform fee on base price (deducted from creator) */
  platformFeePaisa: number
  /** 1% TDS on (base - platformFee) per Sec 194-O */
  tdsPaisa: number
  /** base - platformFee - TDS — creator's net payout */
  creatorTakeHomePaisa: number
}

// ─── Pricing calculator ─────────────────────────────────────
/**
 * Calculate the full pricing breakdown for a paid content item.
 *
 * All amounts are in **paisa** (integer).
 * Fees are rounded up with `Math.ceil` so the creator is never overpaid.
 */
export function calculatePricing(basePricePaisa: number): PricingBreakdown {
  if (basePricePaisa < 0) {
    throw new Error('Price cannot be negative')
  }

  if (basePricePaisa === 0) {
    return {
      basePricePaisa: 0,
      gstPaisa: 0,
      totalBuyerPaisa: 0,
      platformFeePaisa: 0,
      tdsPaisa: 0,
      creatorTakeHomePaisa: 0,
    }
  }

  const gstPaisa = Math.ceil(basePricePaisa * GST_RATE)
  const totalBuyerPaisa = basePricePaisa + gstPaisa
  const platformFeePaisa = Math.ceil(basePricePaisa * PLATFORM_FEE_RATE)
  const creatorNetAfterPlatform = basePricePaisa - platformFeePaisa
  const tdsPaisa = Math.ceil(creatorNetAfterPlatform * TDS_RATE)
  const creatorTakeHomePaisa = creatorNetAfterPlatform - tdsPaisa

  return {
    basePricePaisa,
    gstPaisa,
    totalBuyerPaisa,
    platformFeePaisa,
    tdsPaisa,
    creatorTakeHomePaisa,
  }
}

// ─── Price formatter ─────────────────────────────────────────
/**
 * Format a paisa amount into a human-readable INR string.
 *
 * - Returns `"FREE"` for 0
 * - Uses Indian number grouping (e.g. ₹1,23,456)
 * - Converts paisa → rupees (paisa / 100)
 */
export function formatPricePaisa(paisa: number): string {
  if (paisa === 0) return 'FREE'

  const rupees = paisa / 100

  // Intl with 'en-IN' gives Indian grouping (₹1,23,456)
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees)

  // Intl produces "₹1,23,456" which is exactly what we want.
  // Strip trailing ".00" if whole rupees (maximumFractionDigits handles this,
  // but just in case of environment differences).
  return formatted
}
