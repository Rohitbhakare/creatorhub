import type { Metadata } from 'next'
import { AppShell } from '../../components/AppShell'
import { KycQueueList, type KycQueueItem } from '../../components/KycQueueList'
import {
  serverFetchList,
  ApiRequestError,
  type ListResult,
} from '../../lib/server-api'

export const metadata: Metadata = { title: 'KYC queue' }

async function loadInitial(): Promise<
  ListResult<KycQueueItem> | { error: string }
> {
  try {
    return await serverFetchList<KycQueueItem>('/api/v1/admin/kyc?limit=25')
  } catch (err) {
    if (err instanceof ApiRequestError) return { error: err.message }
    return { error: 'Failed to load KYC queue.' }
  }
}

export default async function KycQueuePage(): Promise<React.JSX.Element> {
  const result = await loadInitial()

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">KYC queue</h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Pending submissions, oldest first. Document URLs are never
            embedded in HTML — links resolve server-side via a 302
            redirect so the storage URL stays off the wire.
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
          <KycQueueList
            initialItems={result.items}
            initialCursor={result.nextCursor}
          />
        )}
      </div>
    </AppShell>
  )
}
