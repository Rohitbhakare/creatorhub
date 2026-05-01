'use client'

import { downloadPayoutsCsv } from '@/lib/studio/csv-export'
import type { PayoutRow } from '@/lib/api'

interface Props {
  rows: readonly PayoutRow[]
}

/**
 * Browser-side CSV download button (E5.7 T3).
 *
 * Builds a Blob from the already-rendered rows and triggers a download.
 * No server round-trip; what the user sees on-screen is what they get.
 */
export function DownloadCsvButton({ rows }: Props) {
  return (
    <button
      type="button"
      onClick={() => {
        downloadPayoutsCsv(rows)
      }}
      disabled={rows.length === 0}
      className="ch-btn ch-btn-ghost"
      style={{ padding: '8px 14px', fontSize: 13 }}
    >
      ↓ Download CSV
    </button>
  )
}
