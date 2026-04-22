import type { Metadata } from 'next'
import Link from 'next/link'
import { AppShell } from '../../../components/AppShell'
import { CollectionEditor } from '../../../components/CollectionEditor'
import type { CollectionDetail } from '../../../components/CollectionEditor'
import { serverFetch, ApiRequestError } from '../../../lib/server-api'

export const metadata: Metadata = { title: 'Collection editor' }

async function loadCollection(
  id: string,
): Promise<
  { collection: CollectionDetail } | { notFound: true } | { error: string }
> {
  try {
    const collection = await serverFetch<CollectionDetail>(
      `/api/v1/admin/collections/${id}`,
    )
    return { collection }
  } catch (err) {
    if (err instanceof ApiRequestError) {
      if (err.status === 404) return { notFound: true }
      return { error: err.message }
    }
    return { error: 'Failed to load collection.' }
  }
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<React.JSX.Element> {
  const { id } = await params
  const result = await loadCollection(id)

  if ('notFound' in result) {
    return (
      <AppShell>
        <div className="flex flex-col gap-4">
          <Link href="/editorial" className="text-sm underline w-fit">
            ← Back to collections
          </Link>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            No collection with id <code>{id}</code>.
          </p>
        </div>
      </AppShell>
    )
  }

  if ('error' in result) {
    return (
      <AppShell>
        <div className="flex flex-col gap-4">
          <Link href="/editorial" className="text-sm underline w-fit">
            ← Back to collections
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

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Link href="/editorial" className="text-sm underline w-fit">
          ← Back to collections
        </Link>
        <CollectionEditor initial={result.collection} />
      </div>
    </AppShell>
  )
}
