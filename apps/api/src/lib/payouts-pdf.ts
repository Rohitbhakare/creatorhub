import PDFDocument from 'pdfkit'

interface PayoutLike {
  date?: string | Date | null
  bookingId?: string | null
  booking_id?: string | null
  grossPaisa?: number
  gross_paisa?: number
  platformFeePaisa?: number
  platform_fee_paisa?: number
  tdsPaisa?: number
  tds_paisa?: number
  gstPaisa?: number
  gst_paisa?: number
  netPaisa?: number
  net_paisa?: number
  utr?: string | null
  status?: string
}

export interface PayoutPdfInput {
  creatorName: string
  creatorEmail?: string
  rows: PayoutLike[]
  totals: {
    grossPaisa: number
    netPaisa: number
  }
  generatedAt?: Date
}

/**
 * Renders a payouts ledger PDF (E5.7 T4) and returns a Buffer.
 *
 * Layout:
 *   - Header: CreatorHub logotype + "Payout ledger" + creator name + email +
 *     generated-at timestamp.
 *   - Summary row: gross / net (rupees).
 *   - Table: Date · Booking · Gross · Fee · TDS · GST · Net · UTR · Status.
 *   - Footer: small print with cancellation/refund + "see CSV for full set".
 *
 * Capped at 200 rows; if more, the footer notes the cap and points to CSV.
 */
export function renderPayoutsPdf(input: PayoutPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []
    doc.on('data', (b: Buffer) => chunks.push(b))
    doc.on('end', () => {
      resolve(Buffer.concat(chunks))
    })
    doc.on('error', reject)

    const generatedAt = input.generatedAt ?? new Date()
    const rows = input.rows.slice(0, 200)
    const truncated = input.rows.length > 200

    // Header
    doc
      .fontSize(20)
      .fillColor('#0E2643')
      .text('CreatorHub', { continued: true })
      .fillColor('#E15A41')
      .text(' · Payout ledger')
    doc.moveDown(0.4)
    doc.fontSize(10).fillColor('#5A6878').text(`Creator: ${input.creatorName}`)
    if (input.creatorEmail) doc.text(`Email: ${input.creatorEmail}`)
    doc.text(`Generated: ${generatedAt.toLocaleString('en-IN')}`)
    doc.moveDown(0.8)

    // Summary
    doc
      .fontSize(11)
      .fillColor('#0E2643')
      .text(
        `Total gross: ₹${(input.totals.grossPaisa / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` +
          `   ·   Total net: ₹${(input.totals.netPaisa / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      )
    doc.moveDown(1)

    // Table header
    const tableTop = doc.y
    const cols = [
      { label: 'Date', x: 50, w: 70 },
      { label: 'Booking', x: 120, w: 75 },
      { label: 'Gross', x: 195, w: 60 },
      { label: 'Fee', x: 255, w: 50 },
      { label: 'TDS', x: 305, w: 45 },
      { label: 'GST', x: 350, w: 50 },
      { label: 'Net', x: 400, w: 60 },
      { label: 'UTR', x: 460, w: 60 },
      { label: 'Status', x: 520, w: 40 },
    ] as const
    doc.fontSize(9).fillColor('#7B8896')
    for (const c of cols) {
      doc.text(c.label, c.x, tableTop, { width: c.w, align: c.x >= 195 && c.x <= 400 ? 'right' : 'left' })
    }
    doc
      .moveTo(50, tableTop + 14)
      .lineTo(560, tableTop + 14)
      .strokeColor('#E1E5EA')
      .stroke()

    // Rows
    let y = tableTop + 20
    doc.fontSize(9).fillColor('#0E2643')
    for (const r of rows) {
      if (y > 760) {
        doc.addPage()
        y = 50
      }
      const date = r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''
      const bid = (r.bookingId ?? r.booking_id ?? '').toString().slice(0, 8) + '…'
      const gross = (r.grossPaisa ?? r.gross_paisa ?? 0) / 100
      const fee = (r.platformFeePaisa ?? r.platform_fee_paisa ?? 0) / 100
      const tds = (r.tdsPaisa ?? r.tds_paisa ?? 0) / 100
      const gst = (r.gstPaisa ?? r.gst_paisa ?? 0) / 100
      const net = (r.netPaisa ?? r.net_paisa ?? 0) / 100
      const fmt = (n: number): string => n.toLocaleString('en-IN', { maximumFractionDigits: 0 })

      doc.text(date, cols[0].x, y, { width: cols[0].w })
      doc.text(bid, cols[1].x, y, { width: cols[1].w })
      doc.text(fmt(gross), cols[2].x, y, { width: cols[2].w, align: 'right' })
      doc.text(fmt(fee), cols[3].x, y, { width: cols[3].w, align: 'right' })
      doc.text(fmt(tds), cols[4].x, y, { width: cols[4].w, align: 'right' })
      doc.text(fmt(gst), cols[5].x, y, { width: cols[5].w, align: 'right' })
      doc.text(fmt(net), cols[6].x, y, { width: cols[6].w, align: 'right' })
      doc.text(r.utr ?? '—', cols[7].x, y, { width: cols[7].w })
      doc.text(r.status ?? '', cols[8].x, y, { width: cols[8].w })
      y += 16
    }

    // Footer
    if (truncated) {
      doc.moveDown(2)
      doc.fontSize(8).fillColor('#7B8896').text(
        `Showing the most recent 200 of ${String(input.rows.length)} rows. Download the CSV for the full set.`,
      )
    }
    doc.fontSize(8).fillColor('#A0ACBA').text(
      'CreatorHub · creatorhub.in · Issued for the named creator only.',
      50,
      790,
      { width: 510, align: 'center' },
    )

    doc.end()
  })
}
