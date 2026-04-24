import type { Metadata } from 'next'
import { AppShell } from '../../components/AppShell'
import {
  AdminPayoutsList,
  type AdminPayoutRow,
} from '../../components/AdminPayoutsList'
import { PayoutStatusFilter } from '../../components/PayoutStatusFilter'
import {
  serverFetchList,
  ApiRequestError,
  type ListResult,
} from '../../lib/server-api'

export const metadata: Metadata = { title: 'Payouts' }

const VALID_STATUSES = new Set([
  'pending',
  'scheduled',
  'processing',
  'completed',
  'failed',
])

async function loadInitial(
  status: string,
): Promise<ListResult<AdminPayoutRow> | { error: string }> {
  const qs = new URLSearchParams({ status, limit: '25' })

  try {
    return await serverFetchList<AdminPayoutRow>(
      `/api/v1/admin/payouts?${qs.toString()}`,
    )
  } catch (err) {
    if (err instanceof ApiRequestError) return { error: err.message }
    return { error: 'Failed to load payouts.' }
  }
}

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}): Promise<React.JSX.Element> {
  const { status: statusRaw } = await searchParams
  const status =
    statusRaw !== undefined && VALID_STATUSES.has(statusRaw)
      ? statusRaw
      : 'scheduled'
  const result = await loadInitial(status)

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Payouts</h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Queued creator payouts. Force-releasing skips the 48h dispute
            window; the financial safety guards (booking completed, no
            refund in flight) still apply.
          </p>
        </div>

        <PayoutStatusFilter
          current={
            status as
              | 'pending'
              | 'scheduled'
              | 'processing'
              | 'completed'
              | 'failed'
          }
        />

        {'error' in result ? (
          <div
            role="alert"
            className="border rounded-md p-3 text-sm"
            style={{
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-error)',
            }}
          >
            {result.error}
          </div>
        ) : (
          <AdminPayoutsList
            initialItems={result.items}
            initialCursor={result.nextCursor}
            status={status}
          />
        )}
      </div>
    </AppShell>
  )
}
