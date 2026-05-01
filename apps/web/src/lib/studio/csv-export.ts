import type { PayoutRow } from '@/lib/api'

/**
 * RFC 4180 escape — wrap in quotes and double any embedded quote.
 * Also handles commas, CR/LF inside the field.
 */
function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/** Convert paisa to "1234.56" string in rupees, zero-padded to 2 dp. */
function paisaToRupees(paisa: number): string {
  return (paisa / 100).toFixed(2)
}

const PAYOUT_HEADERS = [
  'Date',
  'Booking ID',
  'Gross (₹)',
  'Platform Fee (₹)',
  'TDS (₹)',
  'GST (₹)',
  'Net (₹)',
  'UTR',
  'Status',
] as const

/**
 * Build a CSV string for a payouts ledger (E5.7 T3).
 *
 * - RFC-4180 escaping (quoted fields, doubled quotes)
 * - CRLF line terminators
 * - First row is the header
 */
export function payoutsToCsv(rows: readonly PayoutRow[]): string {
  const lines: string[] = []
  lines.push(PAYOUT_HEADERS.join(','))
  for (const r of rows) {
    lines.push(
      [
        csvEscape(r.date),
        csvEscape(r.bookingId),
        csvEscape(paisaToRupees(r.grossPaisa)),
        csvEscape(paisaToRupees(r.platformFeePaisa)),
        csvEscape(paisaToRupees(r.tdsPaisa)),
        csvEscape(paisaToRupees(r.gstPaisa)),
        csvEscape(paisaToRupees(r.netPaisa)),
        csvEscape(r.utr),
        csvEscape(r.status),
      ].join(','),
    )
  }
  return lines.join('\r\n') + '\r\n'
}

/**
 * Trigger a browser download of the CSV via a Blob URL.
 * No-op on server.
 */
export function downloadPayoutsCsv(rows: readonly PayoutRow[]): void {
  if (typeof window === 'undefined') return
  const csv = payoutsToCsv(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `creatorhub-payouts-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Defer revoke so the click handler completes first.
  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 0)
}
