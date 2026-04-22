import type { Metadata } from 'next'
import Link from 'next/link'
import { AppShell } from '../../../components/AppShell'
import { UserStatusBadges } from '../../../components/UserStatusBadges'
import { UserActions } from '../../../components/UserActions'
import { serverFetch, ApiRequestError } from '../../../lib/server-api'

export const metadata: Metadata = { title: 'User detail' }

interface UserDetail {
  id: string
  username: string | null
  display_name: string | null
  email: string | null
  phone: string | null
  is_suspended: boolean
  is_creator: boolean
  kyc_status: string | null
  follower_count: number
  following_count: number
  created_at: string
  updated_at: string
}

async function loadUser(
  userId: string,
): Promise<
  { detail: UserDetail } | { notFound: true } | { error: string }
> {
  try {
    const detail = await serverFetch<UserDetail>(
      `/api/v1/admin/users/${userId}`,
    )
    return { detail }
  } catch (err) {
    if (err instanceof ApiRequestError) {
      if (err.status === 404) return { notFound: true }
      return { error: err.message }
    }
    return { error: 'Failed to load user.' }
  }
}

function Row({
  label,
  value,
}: {
  label: string
  value: string
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className="text-xs uppercase tracking-wide"
        style={{ color: 'var(--color-text-subtle)' }}
      >
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  )
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}): Promise<React.JSX.Element> {
  const { userId } = await params
  const result = await loadUser(userId)

  if ('notFound' in result) {
    return (
      <AppShell>
        <div className="flex flex-col gap-4">
          <Link href="/users" className="text-sm underline">
            ← Back to users
          </Link>
          <p
            className="text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            No user with id <code>{userId}</code>.
          </p>
        </div>
      </AppShell>
    )
  }

  if ('error' in result) {
    return (
      <AppShell>
        <div className="flex flex-col gap-4">
          <Link href="/users" className="text-sm underline">
            ← Back to users
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

  const u = result.detail
  const title = u.display_name ?? u.username ?? u.id

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Link href="/users" className="text-sm underline w-fit">
          ← Back to users
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">{title}</h1>
            {u.username !== null && (
              <span
                className="text-sm"
                style={{ color: 'var(--color-text-muted)' }}
              >
                @{u.username}
              </span>
            )}
            <UserStatusBadges
              isSuspended={u.is_suspended}
              isCreator={u.is_creator}
              kycStatus={u.kyc_status}
            />
          </div>
          <UserActions
            userId={u.id}
            isSuspended={u.is_suspended}
            isCreator={u.is_creator}
          />
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Row label="Email" value={u.email ?? '—'} />
          <Row label="Phone" value={u.phone ?? '—'} />
          <Row
            label="Followers"
            value={u.follower_count.toLocaleString('en-IN')}
          />
          <Row
            label="Following"
            value={u.following_count.toLocaleString('en-IN')}
          />
          <Row
            label="Joined"
            value={new Date(u.created_at).toLocaleString('en-IN')}
          />
          <Row
            label="Last updated"
            value={new Date(u.updated_at).toLocaleString('en-IN')}
          />
          <Row label="ID" value={u.id} />
        </div>
      </div>
    </AppShell>
  )
}
