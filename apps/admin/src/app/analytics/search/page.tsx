import type { Metadata } from 'next'
import { AppShell } from '../../../components/AppShell'
import { SearchAnalyticsWindow } from '../../../components/SearchAnalyticsWindow'
import { serverFetch, ApiRequestError } from '../../../lib/server-api'

export const metadata: Metadata = { title: 'Search analytics' }

type Window = '7d' | '30d'

interface TopQueryRow {
  query: string
  search_count: number
  unique_users: number
  zero_result_count: number
}
interface ZeroResultRow {
  query: string
  hits: number
  last_seen: string
}
interface ClickThroughRow {
  query: string
  searches: number
  clicks: number
  ctr_pct: number
}

async function loadAll(
  window: Window,
): Promise<{
  top: TopQueryRow[] | string
  zero: ZeroResultRow[] | string
  ctr: ClickThroughRow[] | string
}> {
  const qs = `?window=${window}&limit=25`
  const [top, zero, ctr] = await Promise.all([
    serverFetch<TopQueryRow[]>(`/api/v1/admin/analytics/search/top${qs}`).catch(
      (err: unknown) =>
        err instanceof ApiRequestError ? err.message : 'Failed to load.',
    ),
    serverFetch<ZeroResultRow[]>(
      `/api/v1/admin/analytics/search/zero-results${qs}`,
    ).catch((err: unknown) =>
      err instanceof ApiRequestError ? err.message : 'Failed to load.',
    ),
    serverFetch<ClickThroughRow[]>(`/api/v1/admin/analytics/search/ctr${qs}`).catch(
      (err: unknown) =>
        err instanceof ApiRequestError ? err.message : 'Failed to load.',
    ),
  ])
  return { top, zero, ctr }
}

function SectionError({ message }: { message: string }): React.JSX.Element {
  return (
    <div
      role="alert"
      className="border rounded-md p-3 text-sm"
      style={{
        borderColor: 'var(--color-border-strong)',
        color: 'var(--color-error)',
      }}
    >
      {message}
    </div>
  )
}

function Empty(): React.JSX.Element {
  return (
    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
      No data for the selected window.
    </p>
  )
}

export default async function SearchAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ window?: string }>
}): Promise<React.JSX.Element> {
  const raw = (await searchParams).window
  const window: Window = raw === '30d' ? '30d' : '7d'
  const { top, zero, ctr } = await loadAll(window)

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

        <section
          className="flex flex-col gap-3 border rounded-lg p-5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Top queries
          </h2>
          {typeof top === 'string' ? (
            <SectionError message={top} />
          ) : top.length === 0 ? (
            <Empty />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead
                  className="text-left text-xs uppercase tracking-wide"
                  style={{ color: 'var(--color-text-subtle)' }}
                >
                  <tr>
                    <th className="py-2 font-medium">Query</th>
                    <th className="py-2 font-medium text-right">Searches</th>
                    <th className="py-2 font-medium text-right">Unique users</th>
                    <th className="py-2 font-medium text-right">Zero-result</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((r) => (
                    <tr
                      key={r.query}
                      className="border-t"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <td className="py-2 font-mono text-xs">{r.query}</td>
                      <td className="py-2 text-right">{r.search_count}</td>
                      <td className="py-2 text-right">{r.unique_users}</td>
                      <td className="py-2 text-right">{r.zero_result_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section
          className="flex flex-col gap-3 border rounded-lg p-5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Zero-result queries
          </h2>
          {typeof zero === 'string' ? (
            <SectionError message={zero} />
          ) : zero.length === 0 ? (
            <Empty />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead
                  className="text-left text-xs uppercase tracking-wide"
                  style={{ color: 'var(--color-text-subtle)' }}
                >
                  <tr>
                    <th className="py-2 font-medium">Query</th>
                    <th className="py-2 font-medium text-right">Hits</th>
                    <th className="py-2 font-medium">Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {zero.map((r) => (
                    <tr
                      key={r.query}
                      className="border-t"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <td className="py-2 font-mono text-xs">{r.query}</td>
                      <td className="py-2 text-right">{r.hits}</td>
                      <td
                        className="py-2 text-xs"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {new Date(r.last_seen).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section
          className="flex flex-col gap-3 border rounded-lg p-5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide">
            Click-through rate
          </h2>
          {typeof ctr === 'string' ? (
            <SectionError message={ctr} />
          ) : ctr.length === 0 ? (
            <Empty />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead
                  className="text-left text-xs uppercase tracking-wide"
                  style={{ color: 'var(--color-text-subtle)' }}
                >
                  <tr>
                    <th className="py-2 font-medium">Query</th>
                    <th className="py-2 font-medium text-right">Searches</th>
                    <th className="py-2 font-medium text-right">Clicks</th>
                    <th className="py-2 font-medium text-right">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {ctr.map((r) => (
                    <tr
                      key={r.query}
                      className="border-t"
                      style={{ borderColor: 'var(--color-border)' }}
                    >
                      <td className="py-2 font-mono text-xs">{r.query}</td>
                      <td className="py-2 text-right">{r.searches}</td>
                      <td className="py-2 text-right">{r.clicks}</td>
                      <td className="py-2 text-right">{r.ctr_pct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
