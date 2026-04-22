import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { AppShell } from '../../components/AppShell'
import { ReportTypeFilter } from '../../components/ReportTypeFilter'
import {
  ModerationQueueList,
  type Report,
} from '../../components/ModerationQueueList'
import { API_INTERNAL_URL, ADMIN_SESSION_COOKIE } from '../../lib/env'

export const metadata: Metadata = { title: 'Moderation queue' }

interface ListEnvelope {
  success: true
  data: Report[]
  meta: { next_cursor: string | null; has_more: boolean; per_page: number }
}

const VALID_TYPES = new Set(['content', 'user', 'comment', 'review'])

async function loadInitial(
  type: string | null,
): Promise<
  { items: Report[]; nextCursor: string | null } | { error: string }
> {
  const jar = await cookies()
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value
  const headers = new Headers()
  if (token) headers.set('Cookie', `${ADMIN_SESSION_COOKIE}=${token}`)

  const qs = new URLSearchParams({ limit: '25' })
  if (type !== null) qs.set('reported_type', type)

  try {
    const res = await fetch(
      `${API_INTERNAL_URL}/api/v1/admin/reports?${qs.toString()}`,
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
