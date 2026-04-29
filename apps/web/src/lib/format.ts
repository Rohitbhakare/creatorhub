/** Client-safe formatting helpers. No server-only imports. */

export function formatPrice(priceInPaisa: number, isFree: boolean): string {
  if (isFree || priceInPaisa === 0) return 'FREE'
  const rupees = priceInPaisa / 100
  return `₹${rupees.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export function formatPriceShort(priceInPaisa: number): string {
  const r = priceInPaisa / 100
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`
  if (r >= 1000) return `₹${(r / 1000).toFixed(1)}k`
  return `₹${r.toFixed(0)}`
}
