import type { Metadata } from 'next'
import { AppShell } from '../../components/AppShell'
import { AdminsList, type AdminRow } from '../../components/AdminsList'
import { getCurrentAdmin } from '../../lib/session'
import { serverFetch, ApiRequestError } from '../../lib/server-api'

export const metadata: Metadata = { title: 'Admins' }

async function loadAdmins(): Promise<
  { items: AdminRow[] } | { error: string }
> {
  try {
    const items = await serverFetch<AdminRow[]>('/api/v1/admin/admins')
    return { items }
  } catch (err) {
    if (err instanceof ApiRequestError) return { error: err.message }
    return { error: 'Failed to load admins.' }
  }
}

export default async function AdminsPage(): Promise<React.JSX.Element> {
  const me = await getCurrentAdmin()
  if (me === null) {
    // AppShell will also redirect — cheap defense-in-depth for TS.
    return (
      <AppShell>
        <p />
      </AppShell>
    )
  }

  if (me.role !== 'super_admin') {
    return (
      <AppShell>
        <div
          role="alert"
          className="border rounded-md p-4 text-sm"
          style={{
            borderColor: 'var(--color-border-strong)',
            color: 'var(--color-error)',
          }}
        >
          Admin management is restricted to super_admins.
        </div>
      </AppShell>
    )
  }

  const result = await loadAdmins()

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Admins</h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Provisioned operators with access to this panel. Temp passwords
            are shown exactly once on create and reset — share
            out-of-band.
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
          <AdminsList initialItems={result.items} currentAdminId={me.id} />
        )}
      </div>
    </AppShell>
  )
}
