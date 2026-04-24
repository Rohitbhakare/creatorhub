import type { Metadata } from 'next'
import { AppShell } from '../../components/AppShell'
import {
  AuditLogList,
  type AuditEntry,
} from '../../components/AuditLogList'
import {
  serverFetchList,
  ApiRequestError,
  type ListResult,
} from '../../lib/server-api'

export const metadata: Metadata = { title: 'Audit log' }

async function loadInitial(): Promise<
  ListResult<AuditEntry> | { error: string }
> {
  try {
    return await serverFetchList<AuditEntry>(
      '/api/v1/admin/audit-log?limit=25',
    )
  } catch (err) {
    if (err instanceof ApiRequestError) return { error: err.message }
    return { error: 'Failed to load audit log.' }
  }
}

export default async function AuditLogPage(): Promise<React.JSX.Element> {
  const result = await loadInitial()

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Audit log</h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Every admin mutation — suspensions, takedowns, feature toggles,
            KYC decisions, refunds, payout force-releases, editorial edits.
            Non-super_admin sessions see only their own actions.
          </p>
        </div>

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
          <AuditLogList
            initialItems={result.items}
            initialCursor={result.nextCursor}
          />
        )}
      </div>
    </AppShell>
  )
}
