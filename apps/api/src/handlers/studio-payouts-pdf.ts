import type { Context } from 'hono'
import { listPayoutsForCreator, getPayoutSummary } from '../services/payout.service.js'
import { renderPayoutsPdf } from '../lib/payouts-pdf.js'
import { supabase } from '../lib/supabase.js'

/**
 * GET /api/v1/studio/payouts.pdf (E5.7 T4)
 *
 * Auth-gated. Returns the requesting creator's payout ledger as a styled
 * PDF (pdfkit, ~30 LOC handler + ~150 LOC renderer). The list is capped
 * at 200 rows; full history is available via the CSV download.
 */
export async function handleStudioPayoutsPdf(c: Context): Promise<Response> {
  const userId = c.get('userId') as string

  // Fetch up to 200 rows + the summary in parallel.
  const [{ items }, summary, userRow] = await Promise.all([
    listPayoutsForCreator(userId, {}, { limit: 200 }),
    getPayoutSummary(userId),
    supabase
      .from('users')
      .select('display_name, email')
      .eq('id', userId)
      .single<{ display_name: string | null; email: string | null }>(),
  ])

  const totalGross = items.reduce((s, p) => s + (p.amountPaisa ?? 0), 0)
  const totalNet = items.reduce(
    (s, p) => s + ((p.amountPaisa ?? 0) - (p.tdsPaisa ?? 0)),
    0,
  )

  const pdf = await renderPayoutsPdf({
    creatorName: userRow.data?.display_name ?? 'Creator',
    ...(userRow.data?.email ? { creatorEmail: userRow.data.email } : {}),
    rows: items.map((p) => ({
      date: p.scheduledAt,
      bookingId: p.bookingId,
      grossPaisa: p.amountPaisa,
      platformFeePaisa: 0, // not tracked at the payout row level
      tdsPaisa: p.tdsPaisa,
      gstPaisa: 0,
      netPaisa: p.amountPaisa - p.tdsPaisa,
      utr: null,
      status: p.status,
    })),
    totals: {
      grossPaisa: totalGross,
      netPaisa: totalNet || summary.paidLast30dPaisa,
    },
  })

  const filename = `creatorhub-payouts-${new Date().toISOString().slice(0, 10)}.pdf`
  return new Response(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'private, max-age=0, must-revalidate',
    },
  })
}
