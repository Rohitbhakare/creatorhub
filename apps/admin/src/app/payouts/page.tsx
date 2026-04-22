import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { AppShell } from '../../components/AppShell'
import {
  AdminPayoutsList,
  type AdminPayoutRow,
} from '../../components/AdminPayoutsList'
import { PayoutStatusFilter } from '../../components/PayoutStatusFilter'
import { API_INTERNAL_URL, ADMIN_SESSION_COOKIE } from '../../lib/env'

export const metadata: Metadata = { title: 'Payouts' }

interface ListEnvelope {
  success: true
  data: AdminPayoutRow[]
  meta: { next_cursor: string | null; has_more: boolean; per_page: number }
}

const VALID_STATUSES = new Set([
  'pending',
  'scheduled',
  'processing',
  'completed',
  'failed',
])

async function loadInitial(
  status: string,
): Promise<
  { items: AdminPayoutRow[]; nextCursor: string | null } | { error: string }
> {
  const jar = await cookies()
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value
  const headers = new Headers()
  if (token) headers.set('Cookie', `${ADMIN_SESSION_COOKIE}=${token}`)

  const qs = new URLSearchParams({ status, limit: '25' })

  try {
    const res = await fetch(
      `${API_INTERNAL_URL}/api/v1/admin/payouts?${qs.toString()}`,
      { headers, cache: 'no-store' },
    )
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as {
        error?: { detail?: string }
      } | null
      return { error: body?.error?.detail ?? res.statusText }
    }
    const body = (await res.json()) as ListEnvelope
    return { items: body.data, nextCursor: body.meta.next_cursor }
  } catch {
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
