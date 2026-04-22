import type { Metadata } from 'next'
import Link from 'next/link'
import { AppShell } from '../../../components/AppShell'
import { ModerationActions } from '../../../components/ModerationActions'
import { serverFetch, ApiRequestError } from '../../../lib/server-api'

export const metadata: Metadata = { title: 'Report detail' }

interface Report {
  id: string
  reporter_id: string | null
  reported_type: 'content' | 'user' | 'comment' | 'review'
  reported_id: string
  reason: string
  details: string | null
  status: 'pending' | 'reviewed' | 'dismissed' | 'actioned'
  actioned_by: string | null
  actioned_at: string | null
  action_taken: string | null
  created_at: string
}

async function loadReport(
  reportId: string,
): Promise<{ report: Report } | { notFound: true } | { error: string }> {
  try {
    const report = await serverFetch<Report>(
      `/api/v1/admin/reports/${reportId}`,
    )
    return { report }
  } catch (err) {
    if (err instanceof ApiRequestError) {
      if (err.status === 404) return { notFound: true }
      return { error: err.message }
    }
    return { error: 'Failed to load report.' }
  }
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-xs uppercase tracking-wide"
        style={{ color: 'var(--color-text-subtle)' }}
      >
        {label}
      </span>
      <span className={`text-sm ${mono === true ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }): React.JSX.Element {
  const tone =
    status === 'pending'
      ? 'var(--color-warning)'
      : status === 'actioned'
        ? 'var(--color-error)'
        : status === 'dismissed'
          ? 'var(--color-text-muted)'
          : 'var(--color-success)'
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium text-white"
      style={{ backgroundColor: tone }}
    >
      {status}
    </span>
  )
}

function targetHref(
  reportedType: Report['reported_type'],
  reportedId: string,
): string | null {
  if (reportedType === 'user') return `/users/${reportedId}`
  return null
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>
}): Promise<React.JSX.Element> {
  const { reportId } = await params
  const result = await loadReport(reportId)

  if ('notFound' in result) {
    return (
      <AppShell>
        <div className="flex flex-col gap-4">
          <Link href="/moderation" className="text-sm underline w-fit">
            ← Back to moderation queue
          </Link>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No report with id <code>{reportId}</code>.
          </p>
        </div>
      </AppShell>
    )
  }

  if ('error' in result) {
    return (
      <AppShell>
        <div className="flex flex-col gap-4">
          <Link href="/moderation" className="text-sm underline w-fit">
            ← Back to moderation queue
          </Link>
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
        </div>
      </AppShell>
    )
  }

  const r = result.report
  const resolvable = r.status === 'pending'
  const href = targetHref(r.reported_type, r.reported_id)

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Link href="/moderation" className="text-sm underline w-fit">
          ← Back to moderation queue
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">Report</h1>
            <div className="flex items-center gap-2">
              <StatusBadge status={r.status} />
              <span
                className="text-xs"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Reported {new Date(r.created_at).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          {resolvable && <ModerationActions reportId={r.id} />}
        </div>

        <section
          className="flex flex-col gap-3 border rounded-lg p-5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Subject
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Row label="Type" value={r.reported_type} />
            <Row label="Reason" value={r.reason} />
            <div className="md:col-span-2">
              <span
                className="text-xs uppercase tracking-wide"
                style={{ color: 'var(--color-text-subtle)' }}
              >
                Target
              </span>
              {href !== null ? (
                <div className="text-sm font-mono">
                  <Link href={href} className="underline">
                    {r.reported_id}
                  </Link>
                </div>
              ) : (
                <div className="text-sm font-mono">{r.reported_id}</div>
              )}
            </div>
            {r.details !== null && (
              <div className="md:col-span-2">
                <Row label="Details" value={r.details} />
              </div>
            )}
          </div>
        </section>

        <section
          className="flex flex-col gap-3 border rounded-lg p-5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Reporter
          </h2>
          {r.reporter_id !== null ? (
            <Link
              href={`/users/${r.reporter_id}`}
              className="text-sm font-mono underline w-fit"
            >
              {r.reporter_id}
            </Link>
          ) : (
            <p
              className="text-sm"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Auto-flagged by toxicity check (no human reporter).
            </p>
          )}
        </section>

        {!resolvable && (
          <section
            className="flex flex-col gap-3 border rounded-lg p-5"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide">
              Resolution
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Row label="Disposition" value={r.action_taken ?? '—'} />
              <Row
                label="Actioned at"
                value={
                  r.actioned_at !== null
                    ? new Date(r.actioned_at).toLocaleString('en-IN')
                    : '—'
                }
              />
              <Row label="Actioned by" value={r.actioned_by ?? '—'} mono />
            </div>
          </section>
        )}

        <Row label="Report ID" value={r.id} mono />
      </div>
    </AppShell>
  )
}
