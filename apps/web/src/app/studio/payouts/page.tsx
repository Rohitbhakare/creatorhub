import type { Metadata } from 'next'
import { StudioShell, EmptyState } from '@/components/chrome/studio-shell'
import { DownloadCsvButton } from '@/components/studio/download-csv-button'
import { DownloadPdfButton } from '@/components/studio/download-pdf-button'
import { fetchPayouts } from '@/lib/api'
import { formatPrice } from '@/lib/format'

export const metadata: Metadata = {
  title: 'Payouts',
  robots: { index: false, follow: false },
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--ink-muted)',
  initiated: 'var(--info)',
  settled: 'var(--success)',
  failed: 'var(--danger)',
}

export default async function PayoutsPage() {
  const rows = await fetchPayouts()
  const totals = rows.reduce(
    (acc, r) => ({
      gross: acc.gross + r.grossPaisa,
      fee: acc.fee + r.platformFeePaisa,
      tds: acc.tds + r.tdsPaisa,
      gst: acc.gst + r.gstPaisa,
      net: acc.net + r.netPaisa,
    }),
    { gross: 0, fee: 0, tds: 0, gst: 0, net: 0 },
  )

  return (
    <StudioShell kicker="Studio · Payouts" title="Payouts ledger">
      {rows.length === 0 ? (
        <EmptyState
          title="No payouts yet"
          body="Your first payout lands 48 hours after the first completed booking. We deduct 17% platform fee, 1% TDS (Sec 194-O), and the buyer's 18% GST goes straight to government."
        />
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginBottom: 14,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginRight: 'auto' }}>
              {String(rows.length)} {rows.length === 1 ? 'row' : 'rows'} · download a copy
            </span>
            <DownloadCsvButton rows={rows} />
            <DownloadPdfButton />
          </div>
          <div className="ch-card" style={{ padding: 0, overflow: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
              minWidth: 720,
            }}
          >
            <thead>
              <tr
                style={{
                  background: 'var(--surface-alt)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-muted)',
                }}
              >
                <Th align="left">Date</Th>
                <Th align="right">Gross</Th>
                <Th align="right">Fee 17%</Th>
                <Th align="right">TDS 1%</Th>
                <Th align="right">Net</Th>
                <Th align="left">UTR</Th>
                <Th align="left">Status</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid var(--hairline)' }}>
                  <Td>
                    {new Date(r.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Td>
                  <Td align="right">{formatPrice(r.grossPaisa, false)}</Td>
                  <Td align="right" muted>
                    -{formatPrice(r.platformFeePaisa, false)}
                  </Td>
                  <Td align="right" muted>
                    -{formatPrice(r.tdsPaisa, false)}
                  </Td>
                  <Td align="right" emph>
                    {formatPrice(r.netPaisa, false)}
                  </Td>
                  <Td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {r.utr ?? '—'}
                    </span>
                  </Td>
                  <Td>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: STATUS_COLORS[r.status],
                      }}
                    >
                      {r.status}
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr
                style={{
                  borderTop: '2px solid var(--hairline-strong)',
                  background: 'var(--surface-alt)',
                  fontWeight: 600,
                }}
              >
                <Td>Total</Td>
                <Td align="right">{formatPrice(totals.gross, false)}</Td>
                <Td align="right" muted>
                  -{formatPrice(totals.fee, false)}
                </Td>
                <Td align="right" muted>
                  -{formatPrice(totals.tds, false)}
                </Td>
                <Td align="right" emph>
                  {formatPrice(totals.net, false)}
                </Td>
                <Td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
        </>
      )}
    </StudioShell>
  )
}

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
}) {
  return <th style={{ padding: '12px 16px', textAlign: align, fontWeight: 700 }}>{children}</th>
}

function Td({
  children,
  align = 'left',
  muted,
  emph,
  colSpan,
}: {
  children?: React.ReactNode
  align?: 'left' | 'right'
  muted?: boolean
  emph?: boolean
  colSpan?: number
}) {
  return (
    <td
      colSpan={colSpan}
      style={{
        padding: '14px 16px',
        textAlign: align,
        color: muted ? 'var(--ink-muted)' : emph ? 'var(--ink)' : 'var(--ink-soft)',
        fontFamily: emph ? 'var(--font-serif)' : 'inherit',
        fontSize: emph ? 15 : 13,
        fontWeight: emph ? 500 : 400,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </td>
  )
}
