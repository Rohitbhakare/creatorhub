import type { Metadata } from 'next'
import { AppShell } from '../../components/AppShell'
import { ReportTypeFilter } from '../../components/ReportTypeFilter'
import {
  ModerationQueueList,
  type Report,
} from '../../components/ModerationQueueList'
import {
  serverFetchList,
  ApiRequestError,
  type ListResult,
} from '../../lib/server-api'

export const metadata: Metadata = { title: 'Moderation queue' }

const VALID_TYPES = new Set(['content', 'user', 'comment', 'review'])

async function loadInitial(
  type: string | null,
): Promise<ListResult<Report> | { error: string }> {
  const qs = new URLSearchParams({ limit: '25' })
  if (type !== null) qs.set('reported_type', type)

  try {
    return await serverFetchList<Report>(
      `/api/v1/admin/reports?${qs.toString()}`,
    )
  } catch (err) {
    if (err instanceof ApiRequestError) return { error: err.message }
    return { error: 'Failed to load moderation queue.' }
  }
}

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>
}): Promise<React.JSX.Element> {
  const { type: typeRaw } = await searchParams
  const type = typeRaw !== undefined && VALID_TYPES.has(typeRaw) ? typeRaw : null
  const result = await loadInitial(type)

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Moderation queue</h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Pending user reports, newest first. Resolving a report
            records a disposition in the audit log — actual takedowns
            and suspensions happen from the user or content detail
            pages.
          </p>
        </div>

        <ReportTypeFilter current={(type ?? 'all') as 'all' | 'content' | 'user' | 'comment' | 'review'} />

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
          <ModerationQueueList
            initialItems={result.items}
            initialCursor={result.nextCursor}
            typeFilter={type}
          />
        )}
      </div>
    </AppShell>
  )
}
