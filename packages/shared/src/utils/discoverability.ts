import {
  BUDGET_TIER_THRESHOLDS_PAISA,
  WORDS_PER_MINUTE,
  type BudgetTier,
} from '../constants/index.js'

/**
 * Derive budget tier from price_paisa. Server-side derivation only — never
 * persisted to the DB. Bucket thresholds are exclusive upper bounds.
 */
export function toBudgetTier(
  pricePaisa: number | null | undefined,
  pricingModel?: string | null,
): BudgetTier {
  if (pricingModel === 'free' || pricePaisa == null || pricePaisa <= 0) {
    return 'free'
  }
  if (pricePaisa < BUDGET_TIER_THRESHOLDS_PAISA.low) return '₹'
  if (pricePaisa < BUDGET_TIER_THRESHOLDS_PAISA.mid) return '₹₹'
  if (pricePaisa < BUDGET_TIER_THRESHOLDS_PAISA.high) return '₹₹₹'
  return '₹₹₹₹'
}

/**
 * Derive reading-time in minutes from a post/story body. Returns null when
 * the body is empty (so callers can omit the chip rather than render "0m").
 */
export function readTimeMinFromBody(
  body: string | null | undefined,
): number | null {
  if (!body) return null
  const words = body.trim().split(/\s+/).filter(Boolean).length
  if (words <= 0) return null
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
}
