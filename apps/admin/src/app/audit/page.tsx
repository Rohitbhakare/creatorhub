import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { AppShell } from '../../components/AppShell'
import {
  AuditLogList,
  type AuditEntry,
} from '../../components/AuditLogList'
import { API_INTERNAL_URL, ADMIN_SESSION_COOKIE } from '../../lib/env'

export const metadata: Metadata = { title: 'Audit log' }

interface ListEnvelope {
  success: true
  data: AuditEntry[]
  meta: { next_cursor: string | null; has_more: boolean; per_page: number }
}

async function loadInitial(): Promise<
  { items: AuditEntry[]; nextCursor: string | null } | { error: string }
> {
  const jar = await cookies()
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value
  const headers = new Headers()
  if (token) headers.set('Cookie', `${ADMIN_SESSION_COOKIE}=${token}`)

  try {
    const res = await fetch(
      `${API_INTERNAL_URL}/api/v1/admin/audit-log?limit=25`,
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
