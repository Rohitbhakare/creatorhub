import { serverFetch, ApiRequestError } from '../../../lib/server-api'

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

// Analytics endpoints wrap rows in `{ window, rows }` under the
// standard `data` envelope. `serverFetch` unwraps `data`; we pull
// `.rows` here so each section owns its fetch.
interface RowsResponse<T> {
  window: Window
  rows: T[]
}

async function fetchRows<T>(path: string): Promise<T[] | string> {
  try {
    const res = await serverFetch<RowsResponse<T>>(path)
    return res.rows
  } catch (err) {
    return err instanceof ApiRequestError ? err.message : 'Failed to load.'
  }
}

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <section
      className="flex flex-col gap-3 border rounded-lg p-5"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  )
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

export function SectionSkeleton({
  title,
}: {
  title: string
}): React.JSX.Element {
  return (
    <SectionCard title={title}>
      <div
        className="h-24 rounded animate-pulse"
        style={{ backgroundColor: 'var(--color-surface-muted)' }}
      />
    </SectionCard>
  )
}

export async function TopQueriesSection({
  window,
}: {
  window: Window
}): Promise<React.JSX.Element> {
  const rows = await fetchRows<TopQueryRow>(
    `/api/v1/admin/analytics/search/top?window=${window}&limit=25`,
  )
  return (
    <SectionCard title="Top queries">
      {typeof rows === 'string' ? (
        <SectionError message={rows} />
      ) : rows.length === 0 ? (
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
              {rows.map((r) => (
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
    </SectionCard>
  )
}

export async function ZeroResultsSection({
  window,
}: {
  window: Window
}): Promise<React.JSX.Element> {
  const rows = await fetchRows<ZeroResultRow>(
    `/api/v1/admin/analytics/search/zero-results?window=${window}&limit=25`,
  )
  return (
    <SectionCard title="Zero-result queries">
      {typeof rows === 'string' ? (
        <SectionError message={rows} />
      ) : rows.length === 0 ? (
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
              {rows.map((r) => (
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
    </SectionCard>
  )
}

export async function CtrSection({
  window,
}: {
  window: Window
}): Promise<React.JSX.Element> {
  const rows = await fetchRows<ClickThroughRow>(
    `/api/v1/admin/analytics/search/ctr?window=${window}&limit=25`,
  )
  return (
    <SectionCard title="Click-through rate">
      {typeof rows === 'string' ? (
        <SectionError message={rows} />
      ) : rows.length === 0 ? (
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
              {rows.map((r) => (
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
    </SectionCard>
  )
}
