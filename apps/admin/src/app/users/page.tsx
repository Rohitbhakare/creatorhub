import type { Metadata } from 'next'
import Link from 'next/link'
import { AppShell } from '../../components/AppShell'
import { UserSearchForm } from '../../components/UserSearchForm'
import { UserStatusBadges } from '../../components/UserStatusBadges'
import { serverFetch, ApiRequestError } from '../../lib/server-api'

export const metadata: Metadata = { title: 'Users' }

interface UserSearchRow {
  id: string
  username: string | null
  display_name: string | null
  email: string | null
  phone: string | null
  is_suspended: boolean
  is_creator: boolean
  kyc_status: string | null
  created_at: string
}

async function search(q: string): Promise<UserSearchRow[] | { error: string }> {
  const trimmed = q.trim()
  if (trimmed.length === 0) return []
  try {
    return await serverFetch<UserSearchRow[]>(
      `/api/v1/admin/users/search?q=${encodeURIComponent(trimmed)}&limit=50`,
    )
  } catch (err) {
    if (err instanceof ApiRequestError) {
      return { error: err.message }
    }
    return { error: 'Search failed. Retry.' }
  }
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}): Promise<React.JSX.Element> {
  const { q = '' } = await searchParams
  const results = await search(q)
  const hasQuery = q.trim().length > 0
  const errored = !Array.isArray(results)

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Search by username, email, or phone.
          </p>
        </div>

        <UserSearchForm defaultValue={q} />

        {errored ? (
          <div
            role="alert"
            className="border rounded-md p-3 text-sm"
            style={{
              borderColor: 'var(--color-border-strong)',
              color: 'var(--color-error)',
            }}
          >
            {results.error}
          </div>
        ) : !hasQuery ? (
          <p
            className="text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Enter at least one character to search.
          </p>
        ) : results.length === 0 ? (
          <p
            className="text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            No users match that search.
          </p>
        ) : (
          <div
            className="border rounded-lg overflow-hidden"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <table className="w-full text-sm">
              <thead
                className="text-left text-xs uppercase tracking-wide"
                style={{
                  color: 'var(--color-text-subtle)',
                  backgroundColor: 'var(--color-surface-muted)',
                }}
              >
                <tr>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Email / Phone</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {results.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/users/${u.id}`}
                        className="font-medium underline"
                      >
                        {u.display_name ?? u.username ?? u.id}
                      </Link>
                      {u.username !== null && (
                        <span
                          className="ml-2 text-xs"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          @{u.username}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>{u.email ?? '—'}</div>
                      {u.phone !== null && (
                        <div
                          className="text-xs"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {u.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <UserStatusBadges
                        isSuspended={u.is_suspended}
                        isCreator={u.is_creator}
                        kycStatus={u.kyc_status}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {new Date(u.created_at).toLocaleDateString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  )
}
