import type { Metadata } from 'next'
import { AppShell } from '../components/AppShell'
import { DashboardStats } from '../components/DashboardStats'
import { serverFetch } from '../lib/server-api'

export const metadata: Metadata = { title: 'Dashboard' }

interface ActivityRow {
  id: string
  admin_email: string | null
  action: string
  target_type: string | null
  target_id: string | null
  created_at: string
}

interface SummaryPayload {
  pending_kyc: number | null
  open_reports: number | null
  takedowns_today: number | null
  payouts_queued: number | null
  recent_activity: ActivityRow[]
  generated_at: string
}

async function loadSummary(): Promise<SummaryPayload | null> {
  try {
    return await serverFetch<SummaryPayload>(
      '/api/v1/admin/dashboard/summary',
    )
  } catch {
    return null
  }
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${String(mins)} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${String(hrs)}h ago`
  const days = Math.round(hrs / 24)
  return `${String(days)}d ago`
}

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const summary = await loadSummary()

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Overview of platform health and queues.
          </p>
        </div>

        {summary === null ? (
          <div
            role="alert"
            className="border rounded-lg p-4 text-sm"
            style={{
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-error)',
            }}
          >
            Could not load dashboard summary. Refresh the page to retry.
          </div>
        ) : (
          <>
            <DashboardStats
              pendingKyc={summary.pending_kyc}
              openReports={summary.open_reports}
              takedownsToday={summary.takedowns_today}
              payoutsQueued={summary.payouts_queued}
            />

            <section className="flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Recent activity</h2>
              <div
                className="border rounded-lg divide-y"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {summary.recent_activity.length === 0 ? (
                  <div
                    className="p-4 text-sm"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    No admin activity yet.
                  </div>
                ) : (
                  summary.recent_activity.map((row) => (
                    <div
                      key={row.id}
                      className="p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-medium truncate">
                          {row.action}
                        </span>
                        <span
                          className="text-xs truncate"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {row.admin_email ?? 'system'}
                          {row.target_type !== null
                            ? ` · ${row.target_type}`
                            : ''}
                          {row.target_id !== null
                            ? ` · ${row.target_id}`
                            : ''}
                        </span>
                      </div>
                      <span
                        className="text-xs shrink-0"
                        style={{ color: 'var(--color-text-subtle)' }}
                      >
                        {formatRelative(row.created_at)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </AppShell>
  )
}
