import type { Metadata } from 'next'
import Link from 'next/link'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { ContentCard } from '@/components/content/content-card'
import { DiscoverFilters } from '@/components/discover/discover-filters'
import { getSession } from '@/lib/session'
import {
  searchDiscover,
  fetchPopularCities,
  fetchFeedSection,
  type DiscoverParams,
} from '@/lib/api'

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
    /** When set, render the corresponding home-feed rail instead of search. */
    section?: string
  }>
}

const TYPES: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'post', label: 'Posts' },
  { id: 'itinerary', label: 'Itineraries' },
  { id: 'experience', label: 'Experiences' },
  { id: 'event', label: 'Events' },
]

export default async function DiscoverPage({ searchParams }: Props) {
  const sp = await searchParams
  const session = await getSession()

  const hasQuery = (sp.q ?? '').trim().length > 0
  const sectionId = sp.section
  const useSection = !hasQuery && sectionId !== undefined && sectionId !== ''

  const params: DiscoverParams = {
    sort: (sp.sort as DiscoverParams['sort']) ?? 'relevance',
    ...(sp.q !== undefined ? { q: sp.q } : {}),
    ...(sp.city !== undefined ? { city: sp.city } : {}),
    ...(sp.type !== undefined ? { type: sp.type } : {}),
    ...(sp.priceMin !== undefined ? { priceMin: Number(sp.priceMin) } : {}),
    ...(sp.priceMax !== undefined ? { priceMax: Number(sp.priceMax) } : {}),
  }

  const [searchResults, sectionResult, cities] = await Promise.all([
    useSection ? Promise.resolve({ items: [], total: 0 }) : searchDiscover(params),
    useSection
      ? fetchFeedSection(sectionId, sp.city ? { city: sp.city } : {})
      : Promise.resolve(null),
    fetchPopularCities(),
  ])

  // Apply client-side type filter on top of section results so the chip rail
  // still works on the See-all view.
  const sectionFiltered = sectionResult
    ? sp.type
      ? { ...sectionResult, items: sectionResult.items.filter((i) => i.type === sp.type) }
      : sectionResult
    : null

  const items = useSection ? (sectionFiltered?.items ?? []) : searchResults.items
  const total = useSection ? items.length : searchResults.total

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
        {/* Compact hero — search bar centered, tight vertical rhythm. */}
        <section
          style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--hairline)',
            padding: '24px 32px 20px',
          }}
        >
          <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
            <h1
              className="ch-display"
              style={{
                fontSize: 'clamp(24px, 3.4vw, 36px)',
                color: 'var(--ink)',
                marginBottom: 6,
                lineHeight: 1.15,
              }}
            >
              {hasQuery ? (
                <>
                  Searching for{' '}
                  <em style={{ color: 'var(--primary)', fontStyle: 'italic' }}>
                    &ldquo;{sp.q}&rdquo;
                  </em>
                </>
              ) : useSection ? (
                <>{sectionFiltered?.label ?? 'Browse'}</>
              ) : (
                <>
                  Find your next{' '}
                  <em style={{ color: 'var(--primary)', fontStyle: 'italic' }}>chapter</em>
                </>
              )}
            </h1>
            <p
              style={{
                fontSize: 14,
                color: 'var(--ink-muted)',
                marginBottom: 18,
                margin: '0 auto 18px',
              }}
            >
              {total > 0
                ? `${total.toLocaleString('en-IN')} ${total === 1 ? 'story' : 'stories'} match`
                : 'Browse by mood, city, or type'}
            </p>
            <form
              action="/discover"
              method="get"
              style={{
                display: 'flex',
                gap: 8,
                maxWidth: 640,
                margin: '0 auto',
              }}
            >
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
                  padding: '12px 18px',
                  borderRadius: 999,
                  border: '1.5px solid var(--hairline-strong)',
                  background: 'var(--bg)',
                  fontSize: 15,
                  color: 'var(--ink)',
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="submit"
                className="ch-btn ch-btn-ink"
                style={{ padding: '12px 22px' }}
              >
                Search
              </button>
            </form>
          </div>
        </section>

        <div style={{ maxWidth: 1640, margin: '0 auto', padding: '24px 32px 80px' }}>
          {/* Active section/city/sub-cat chip — lets the user back out without
              losing their place. */}
          {useSection && sectionFiltered && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 18,
                fontSize: 13,
                color: 'var(--ink-muted)',
              }}
            >
              <span>Showing rail:</span>
              <Link
                href={buildHref({ section: undefined })}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'var(--primary-tint)',
                  color: 'var(--primary-deep)',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: 12.5,
                }}
              >
                {sectionFiltered.label}
                <span aria-hidden style={{ fontSize: 14, lineHeight: 1 }}>×</span>
              </Link>
              <Link
                href="/discover"
                style={{ marginLeft: 4, color: 'var(--ink-muted)', fontSize: 12 }}
              >
                Back to all
              </Link>
            </div>
          )}

          {/* Type chips + sort + filters */}
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
                    prefetch
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
            <DiscoverFilters
              sort={sp.sort ?? 'relevance'}
              cities={cities.map((c) => c.name)}
              {...(sp.priceMin !== undefined ? { priceMin: sp.priceMin } : {})}
              {...(sp.priceMax !== undefined ? { priceMax: sp.priceMax } : {})}
              {...(sp.city !== undefined ? { city: sp.city } : {})}
              {...(sp.q !== undefined ? { q: sp.q } : {})}
              {...(sp.type !== undefined ? { type: sp.type } : {})}
              {...(useSection && sectionId ? { section: sectionId } : {})}
            />
          </div>

          {/* City chip rail — only on the empty state so it doesn't compete
              with active filters on a search/section view. */}
          {cities.length > 0 && !hasQuery && !useSection && (
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
                      background:
                        sp.city === c.name ? 'var(--primary-tint)' : 'var(--surface)',
                      color:
                        sp.city === c.name ? 'var(--primary-deep)' : 'var(--ink)',
                      border: '1px solid var(--hairline)',
                      textDecoration: 'none',
                      fontWeight: sp.city === c.name ? 600 : 500,
                    }}
                  >
                    {c.name}{' '}
                    <span style={{ color: 'var(--ink-muted)', fontSize: 12 }}>
                      {c.count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {items.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 32,
              }}
            >
              {items.map((c) => (
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
              <p style={{ fontSize: 14, lineHeight: 1.55, marginBottom: 16 }}>
                {useSection
                  ? 'This rail is empty for your current filters.'
                  : 'Try fewer filters, or browse our handpicked collections.'}
              </p>
              {useSection && (
                <Link
                  href="/discover"
                  className="ch-btn ch-btn-primary"
                  style={{ padding: '10px 18px', fontSize: 13 }}
                >
                  Browse all
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
      <WebFooter />
    </>
  )
}
