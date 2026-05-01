import Link from 'next/link'

interface Props {
  queries: string[]
}

/**
 * Inline chip rail of recent popular searches. Clicking a chip navigates
 * to /discover/results?q=… so the result is deep-linkable. Returns null
 * when the API surfaced nothing — we don't want an orphan section header.
 */
export function PopularSearchesChips({ queries }: Props) {
  if (queries.length === 0) return null
  return (
    <section style={{ marginBottom: 32 }}>
      <h2
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--ink-muted)',
          marginBottom: 12,
          fontWeight: 700,
        }}
      >
        Trending searches
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {queries.map((q) => (
          <Link
            key={q}
            href={`/discover/results?q=${encodeURIComponent(q)}`}
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              fontSize: 13,
              background: 'var(--surface)',
              color: 'var(--ink)',
              border: '1px solid var(--hairline)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            {q}
          </Link>
        ))}
      </div>
    </section>
  )
}
