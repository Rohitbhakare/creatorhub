'use client'

/**
 * Browser-side PDF download button (E5.7 T4).
 *
 * Triggers a same-origin GET to the API's `/api/v1/studio/payouts.pdf`
 * route. Server-side authorization gates the response to the requesting
 * creator's ledger only.
 */
export function DownloadPdfButton() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3001'
  const href = `${apiBase}/api/v1/studio/payouts.pdf`
  return (
    <a
      href={href}
      download
      rel="noopener"
      className="ch-btn ch-btn-ghost"
      style={{ padding: '8px 14px', fontSize: 13, textDecoration: 'none' }}
    >
      ↓ Download PDF
    </a>
  )
}
