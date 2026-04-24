import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AppShell } from '../../../components/AppShell'
import { SearchAnalyticsWindow } from '../../../components/SearchAnalyticsWindow'
import {
  TopQueriesSection,
  ZeroResultsSection,
  CtrSection,
  SectionSkeleton,
} from './sections'

export const metadata: Metadata = { title: 'Search analytics' }

type Window = '7d' | '30d'

export default async function SearchAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>
}): Promise<React.JSX.Element> {
  const raw = (await searchParams).window
  const window: Window = raw === '30d' ? '30d' : '7d'

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Search analytics</h1>
            <p
              className="text-sm mt-1"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Top queries, zero-result queries, and click-through rate over
              the selected window. Driven by server-logged search events
              (T10).
            </p>
          </div>
          <SearchAnalyticsWindow current={window} />
        </div>

        <Suspense fallback={<SectionSkeleton title="Top queries" />}>
          <TopQueriesSection window={window} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton title="Zero-result queries" />}>
          <ZeroResultsSection window={window} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton title="Click-through rate" />}>
          <CtrSection window={window} />
        </Suspense>
      </div>
    </AppShell>
  )
}
