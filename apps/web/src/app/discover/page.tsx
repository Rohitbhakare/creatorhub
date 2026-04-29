import type { Metadata } from 'next'
import Link from 'next/link'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { ContentCard } from '@/components/content/content-card'
import { getSession } from '@/lib/session'
import { searchDiscover, fetchPopularCities, type DiscoverParams } from '@/lib/api'

export const metadata: Metadata = {
  title: 'Discover',
  description: 'Discover travel stories, itineraries, and experiences across India.',
}

interface Props {
  searchParams: Promise<{
    q?: string
    city?: string
    type?: string
    sort?: string
    priceMin?: string
    priceMax?: string
  }>
}

const TYPES: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'post', label: 'Posts' },
  { id: 'itinerary', label: 'Itineraries' },
  { id: 'experience', label: 'Experiences' },
  { id: 'event', label: 'Events' },
]

const SORTS = [
  { id: 'relevance', label: 'Most relevant' },
  { id: 'newest', label: 'Newest' },
  { id: 'price_asc', label: 'Price low → high' },
  { id: 'price_desc', label: 'Price high → low' },
  { id: 'rating', label: 'Top rated' },
]

export default async function DiscoverPage({ searchParams }: Props) {
  const sp = await searchParams
  const session = await getSession()

  const params: DiscoverParams = {
    sort: (sp.sort as DiscoverParams['sort']) ?? 'relevance',
    ...(sp.q !== undefined ? { q: sp.q } : {}),
    ...(sp.city !== undefined ? { city: sp.city } : {}),
    ...(sp.type !== undefined ? { type: sp.type } : {}),
    ...(sp.priceMin !== undefined ? { priceMin: Number(sp.priceMin) } : {}),
    ...(sp.priceMax !== undefined ? { priceMax: Number(sp.priceMax) } : {}),
  }

  const [results, cities] = await Promise.all([
    searchDiscover(params),
    fetchPopularCities(),
  ])

  const buildHref = (override: Record<string, string | undefined>) => {
    const q = new URLSearchParams()
    const merged: Record<string, string | undefined> = { ...sp, ...override }
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== '') q.set(k, v)
    }
    return `/discover${q.toString() ? `?${q.toString()}` : ''}`
  }

  return (
    <>
      <WebHeader session={session} active="discover" />
      <main id="main-content">
        <section
          style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--hairline)',
            padding: '40px 32px',
          }}
        >
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <h1
              className="ch-display"
              style={{ fontSize: 'clamp(32px, 5vw, 56px)', color: 'var(--ink)', marginBottom: 12 }}
            >
              {sp.q != null && sp.q !== '' ? (
                <>
                  Searching for{' '}
                  <em style={{ color: 'var(--primary)', fontStyle: 'italic' }}>
                    &ldquo;{sp.q}&rdquo;
                  </em>
                </>
              ) : (
                <>
                  Find your next <em style={{ color: 'var(--primary)', fontStyle: 'italic' }}>chapter</em>
                </>
              )}
            </h1>
            <p style={{ fontSize: 16, color: 'var(--ink-muted)', marginBottom: 24 }}>
              {results.total > 0
                ? `${results.total.toLocaleString('en-IN')} ${results.total === 1 ? 'story' : 'stories'} match`
                : 'Browse by mood, city, or type'}
            </p>
            <form action="/discover" method="get" style={{ display: 'flex', gap: 8, maxWidth: 720 }}>
              {sp.type && <input type="hidden" name="type" value={sp.type} />}
              {sp.city && <input type="hidden" name="city" value={sp.city} />}
              <input
                type="search"
                name="q"
                defaultValue={sp.q ?? ''}
                placeholder="Try Konkan road trip, monsoon trekking…"
                aria-label="Search"
                style={{
                  flex: 1,
                  padding: '14px 18px',
                  borderRadius: 999,
                  border: '1.5px solid var(--hairline-strong)',
                  background: 'var(--bg)',
                  fontSize: 15,
                  color: 'var(--ink)',
                  fontFamily: 'inherit',
                }}
              />
              <button type="submit" className="ch-btn ch-btn-ink" style={{ padding: '14px 24px' }}>
                Search
              </button>
            </form>
          </div>
        </section>

        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 32px 80px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TYPES.map((t) => {
                const typeValue = t.id === 'all' ? undefined : t.id
                const isActive = (sp.type ?? 'all') === t.id
                return (
                  <Link
                    key={t.id}
                    href={buildHref({ type: typeValue })}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'white' : 'var(--ink-soft)',
                      background: isActive ? 'var(--ink)' : 'var(--surface)',
                      border: '1px solid var(--hairline)',
                      textDecoration: 'none',
                    }}
                  >
                    {t.label}
                  </Link>
                )
              })}
            </div>
            <div style={{ flex: 1 }} />
            <select
              defaultValue={sp.sort ?? 'relevance'}
              style={{
                padding: '10px 16px',
                borderRadius: 999,
                border: '1px solid var(--hairline)',
                background: 'var(--surface)',
                fontSize: 13,
                color: 'var(--ink)',
              }}
              aria-label="Sort"
              name="sort"
              onChange={undefined}
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {cities.length > 0 && !sp.q && (
            <div style={{ marginBottom: 32 }}>
              <h2
                className="ch-display"
                style={{ fontSize: 22, color: 'var(--ink)', marginBottom: 14 }}
              >
                Explore by city
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {cities.slice(0, 16).map((c) => (
                  <Link
                    key={c.name}
                    href={buildHref({ city: c.name })}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 999,
                      fontSize: 13,
                      background: sp.city === c.name ? 'var(--primary-tint)' : 'var(--surface)',
                      color: sp.city === c.name ? 'var(--primary-deep)' : 'var(--ink)',
                      border: '1px solid var(--hairline)',
                      textDecoration: 'none',
                      fontWeight: sp.city === c.name ? 600 : 500,
                    }}
                  >
                    {c.name} <span style={{ color: 'var(--ink-muted)', fontSize: 12 }}>{c.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.items.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 32,
              }}
            >
              {results.items.map((c) => (
                <ContentCard key={c.id} content={c} />
              ))}
            </div>
          ) : (
            <div
              className="ch-card"
              style={{ padding: 64, textAlign: 'center', color: 'var(--ink-muted)' }}
            >
              <h2
                className="ch-display"
                style={{ fontSize: 28, color: 'var(--ink)', marginBottom: 12 }}
              >
                Nothing matches that yet
              </h2>
              <p style={{ fontSize: 14, lineHeight: 1.55 }}>
                Try fewer filters, or browse our handpicked collections.
              </p>
            </div>
          )}
        </div>
      </main>
      <WebFooter />
    </>
  )
}
