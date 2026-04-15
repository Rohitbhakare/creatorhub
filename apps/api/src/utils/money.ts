/**
 * Money utilities — all amounts in paisa (integer), never rupees (float).
 *
 * Tax rules (India):
 *   Platform fee : 17% of base price
 *   GST          : 18% of base price (collected from buyer)
 *   TDS          : 1%  of base price (deducted from creator payout, Sec 194-O)
 */

export type BookingAmounts = {
  basePricePaisa: number
  platformFeePaisa: number   // 17% of base, rounded down
  gstPaisa: number           // 18% of base, rounded down
  tdsPaisa: number           // 1%  of base, rounded down
  totalPaisa: number         // base + platformFee + gst
  creatorPayoutPaisa: number // base - tds
}

/**
 * Calculate all booking-related amounts from a base price in paisa.
 *
 * Uses Math.floor for fees to avoid over-collecting from the buyer.
 * The total the buyer pays = basePricePaisa + platformFeePaisa + gstPaisa.
 * The creator receives    = basePricePaisa - tdsPaisa.
 */
export function calculateBookingAmounts(basePricePaisa: number): BookingAmounts {
  const platformFeePaisa = Math.floor(basePricePaisa * 0.17)
  const gstPaisa = Math.floor(basePricePaisa * 0.18)
  const tdsPaisa = Math.floor(basePricePaisa * 0.01)
  const totalPaisa = basePricePaisa + platformFeePaisa + gstPaisa
  const creatorPayoutPaisa = basePricePaisa - tdsPaisa

  return {
    basePricePaisa,
    platformFeePaisa,
    gstPaisa,
    tdsPaisa,
    totalPaisa,
    creatorPayoutPaisa,
  }
}
