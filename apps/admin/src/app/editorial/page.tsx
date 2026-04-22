import type { Metadata } from 'next'
import { AppShell } from '../../components/AppShell'
import {
  CollectionsList,
  type CollectionSummary,
} from '../../components/CollectionsList'
import { serverFetch, ApiRequestError } from '../../lib/server-api'

export const metadata: Metadata = { title: 'Editorial collections' }

async function loadCollections(): Promise<
  { items: CollectionSummary[] } | { error: string }
> {
  try {
    const items =
      await serverFetch<CollectionSummary[]>('/api/v1/admin/collections')
    return { items }
  } catch (err) {
    if (err instanceof ApiRequestError) return { error: err.message }
    return { error: 'Failed to load collections.' }
  }
}

export default async function EditorialPage(): Promise<React.JSX.Element> {
  const result = await loadCollections()

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Editorial collections</h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Curated content rails surfaced in the mobile feed. Priority
            orders rails top-to-bottom; inactive rails are hidden from the
            feed but retained for reuse.
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
          <CollectionsList initialItems={result.items} />
        )}
      </div>
    </AppShell>
  )
}
