import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { ContentCard } from '@/components/content/content-card'
import { DiscoverHeader } from '@/components/discover/discover-header'
import { DiscoverSidebar, type DiscoverType, type TypeCounts } from '@/components/discover/discover-sidebar'
import { DiscoverGrid } from '@/components/discover/discover-grid'
import { DiscoverSortTabs, type SortTabId } from '@/components/discover/discover-sort-tabs'
import { FilterChipBar } from '@/components/discover/filter-chip-bar'
import { FilterSheet } from '@/components/discover/filter-sheet'
import { FilterSheetProvider } from '@/components/discover/filter-sheet-context'
import { resolveFilterChips } from '@/components/discover/filter-chip-resolver'
import { HandpickedCollectionsRail } from '@/components/discover/handpicked-collections-rail'
import { TopCreatorsRail } from '@/components/discover/top-creators-rail'
import { UpcomingExperiencesRail } from '@/components/discover/upcoming-experiences-rail'
import { getSession } from '@/lib/session'
import {
  fetchFeedSection,
  fetchPopularCities,
  fetchPopularSearches,
  fetchSubCategories,
  fetchHandpickedCollections,
  fetchTopCreators,
  fetchUpcomingExperiences,
} from '@/lib/api'
import {
  fetchDiscoverResults,
  fetchDiscoverResultsCount,
  type DiscoverResultsFilters,
  type DiscoverSort,
} from '@/lib/api/discover'

export const metadata: Metadata = {
  title: 'Discover',
  description:
    'Discover posts, plans, live experiences, and group events from creators across India.',
  alternates: { canonical: '/discover' },
}

interface Props {
  searchParams: Promise<{
    q?: string
    type?: string
    city?: string
    /** When set, render the corresponding home-feed rail instead of search. */
    section?: string
    vibe?: string
    distance_km?: string
    starting_city_id?: string
    sort?: string
    filters?: string
    sub_category_id?: string
    time_window?: string
    duration_buckets?: string
    budget_buckets?: string
    seasons?: string
    difficulties?: string
    group_sizes?: string
  }>
}

const SORT_ALLOWED: readonly string[] = ['recent', 'trending', 'price_asc', 'price_desc']
const TYPE_ALLOWED: readonly string[] = [
  'post',
  'self_paced_itinerary',
  'scheduled_experience',
  'event',
]

/** Maps a flat URL param bag to the typed filter shape `fetchDiscoverResults` accepts. */
/** Parse a CSV URL param value into a non-empty string array. */
function csvParam(v: string | undefined): string[] {
  if (!v) return []
  return v
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function paramsToFilters(p: Record<string, string>): DiscoverResultsFilters {
  const out: DiscoverResultsFilters = {
    sort: SORT_ALLOWED.includes(p.sort ?? '') ? (p.sort as DiscoverSort) : 'trending',
    limit: 24,
  }
  if (p.type && TYPE_ALLOWED.includes(p.type)) {
    out.type = p.type as NonNullable<DiscoverResultsFilters['type']>
  }
  if (p.sub_category_id) out.subCategoryId = p.sub_category_id
  if (p.starting_city_id) out.startingCityId = p.starting_city_id
  if (p.distance_km) {
    const km = parseInt(p.distance_km, 10)
    if (km === 25 || km === 50 || km === 100 || km === 250) {
      out.distanceKm = km
    }
  }
  if (p.time_window) {
    out.timeWindow = p.time_window as NonNullable<DiscoverResultsFilters['timeWindow']>
  }
  // The "More filters" sheet writes budget/season/difficulty/duration/group as
  // CSV. Round-2 QA caught these being silently dropped here — the URL had
  // them but the page didn't read them, so the API call was never filtered.
  const durations = csvParam(p.duration_buckets)
  if (durations.length > 0) {
    out.durationBuckets = durations as NonNullable<DiscoverResultsFilters['durationBuckets']>
  }
  const budgets = csvParam(p.budget_buckets)
  if (budgets.length > 0) {
    out.budgetBuckets = budgets as NonNullable<DiscoverResultsFilters['budgetBuckets']>
  }
  const seasons = csvParam(p.seasons)
  if (seasons.length > 0) out.seasons = seasons
  const difficulties = csvParam(p.difficulties)
  if (difficulties.length > 0) out.difficulties = difficulties
  const groups = csvParam(p.group_sizes)
  if (groups.length > 0) out.groupSizes = groups
  return out
}

export default async function DiscoverPage({ searchParams }: Props) {
  const sp = await searchParams

  // Redirect FIRST, before any awaited data fetch — otherwise RSC streaming
  // has already started by the time `redirect()` runs, and Next falls back
  // to a meta-refresh tag (with a 1s flash) instead of a clean 307.
  const trimmedQuery = (sp.q ?? '').trim()
  if (trimmedQuery.length > 0) {
    const next = new URLSearchParams({ q: trimmedQuery })
    if (sp.type) next.set('type', sp.type)
    if (sp.city) next.set('starting_city_id', sp.city)
    redirect(`/discover/results?${next.toString()}`)
  }

  const session = await getSession()
  const sectionId = sp.section
  const useSection = sectionId !== undefined && sectionId !== ''

  // Section-specific deep link: /discover?section=hot-near-you renders that
  // rail's full content. Preserves existing "See all" link semantics.
  if (useSection) {
    const sectionResult = await fetchFeedSection(sectionId, sp.city ? { city: sp.city } : {})
    const items = sectionResult
      ? sp.type
        ? sectionResult.items.filter((i) => i.type === sp.type)
        : sectionResult.items
      : []
    return (
      <>
        <WebHeader session={session} active="discover" />
        <main id="main-content">
          <section
            style={{
              background: 'var(--surface)',
              borderBottom: '1px solid var(--hairline)',
              padding: '24px 32px 20px',
            }}
          >
            <div style={{ maxWidth: 880, margin: '0 auto', textAlign: 'center' }}>
              <p
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--ink-muted)',
                  marginBottom: 6,
                  fontWeight: 700,
                }}
              >
                Showing rail
              </p>
              <h1
                className="ch-display"
                style={{
                  fontSize: 'clamp(22px, 3vw, 32px)',
                  color: 'var(--ink)',
                  lineHeight: 1.15,
                  marginBottom: 8,
                }}
              >
                {sectionResult?.label ?? 'Browse'}
              </h1>
              <Link
                href="/discover"
                style={{ color: 'var(--ink-muted)', fontSize: 13, textDecoration: 'underline' }}
              >
                Back to all
              </Link>
            </div>
          </section>
          <div style={{ maxWidth: 1640, margin: '0 auto', padding: '24px 32px 80px' }}>
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
                  style={{ fontSize: 24, color: 'var(--ink)', marginBottom: 12 }}
                >
                  This rail is empty
                </h2>
                <Link
                  href="/discover"
                  className="ch-btn ch-btn-primary"
                  style={{ padding: '10px 18px', fontSize: 13 }}
                >
                  Browse all
                </Link>
              </div>
            )}
          </div>
        </main>
        <WebFooter />
      </>
    )
  }

  // ── v3 Discover (E5.2): editorial header + sidebar + 3-col masonry + rails ──
  // Read URL params upfront so we can both (a) build the filter object for the
  // grid call and (b) thread the same plain dict through to the sidebar so it
  // can preserve them when a pill click navigates.
  const baseParams: Record<string, string> = {}
  if (sp.type) baseParams.type = sp.type
  if (sp.vibe) baseParams.vibe = sp.vibe
  if (sp.distance_km) baseParams.distance_km = sp.distance_km
  if (sp.starting_city_id) baseParams.starting_city_id = sp.starting_city_id
  if (sp.sort) baseParams.sort = sp.sort
  if (sp.sub_category_id) baseParams.sub_category_id = sp.sub_category_id
  if (sp.time_window) baseParams.time_window = sp.time_window
  if (sp.duration_buckets) baseParams.duration_buckets = sp.duration_buckets
  if (sp.budget_buckets) baseParams.budget_buckets = sp.budget_buckets
  if (sp.seasons) baseParams.seasons = sp.seasons
  if (sp.difficulties) baseParams.difficulties = sp.difficulties
  if (sp.group_sizes) baseParams.group_sizes = sp.group_sizes

  const filters = paramsToFilters(baseParams)
  const activeType: DiscoverType =
    sp.type && TYPE_ALLOWED.includes(sp.type) ? (sp.type as DiscoverType) : 'all'
  const activeSort: SortTabId = (() => {
    if (sp.sort === 'recent') return 'recent'
    if (sp.starting_city_id && sp.sort === 'trending') return 'near'
    return 'trending'
  })()
  const activeDistanceKm = (() => {
    const km = parseInt(sp.distance_km ?? '', 10)
    return [25, 50, 100, 250].includes(km) ? km : null
  })()

  // Type-pill counts: re-build the filter object without `type` so each per-type
  // count is computed against the same other-filter context.
  const filtersNoType: DiscoverResultsFilters = { ...filters }
  delete filtersNoType.type

  const [
    gridResult,
    typeCountAll,
    typeCountPost,
    typeCountItin,
    typeCountExp,
    typeCountEvent,
    popularQueries,
    subCategories,
    collections,
    creators,
    experiences,
    cities,
  ] = await Promise.all([
    fetchDiscoverResults(filters),
    fetchDiscoverResultsCount(filtersNoType),
    fetchDiscoverResultsCount({ ...filtersNoType, type: 'post' }),
    fetchDiscoverResultsCount({ ...filtersNoType, type: 'self_paced_itinerary' }),
    fetchDiscoverResultsCount({ ...filtersNoType, type: 'scheduled_experience' }),
    fetchDiscoverResultsCount({ ...filtersNoType, type: 'event' }),
    fetchPopularSearches(8),
    fetchSubCategories('travel'),
    fetchHandpickedCollections({ limit: 4 }),
    fetchTopCreators({ limit: 8 }),
    fetchUpcomingExperiences({ limit: 6 }),
    fetchPopularCities(),
  ])

  const typeCounts: TypeCounts = {
    all: typeCountAll ?? 0,
    post: typeCountPost ?? 0,
    self_paced_itinerary: typeCountItin ?? 0,
    scheduled_experience: typeCountExp ?? 0,
    event: typeCountEvent ?? 0,
  }

  // Vibe sidebar source. Until E5.2/BUG-002 lands (seed `sub_category_id` so
  // /discover/themes returns real data), pull from popular searches — same
  // mix of cities + moods + creator names that v3 mocks anyway.
  const vibeTags = popularQueries.slice(0, 8)

  // Active-filter chips: derived from URL params via the pure resolver. Drop
  // the active sort if it's the default "trending" so we don't spam a chip
  // people didn't explicitly choose.
  const activeFilterChips = resolveFilterChips(baseParams)

  // Headline city — the visible "from creators near {city}" text. Take it
  // from the most-active city in the cities list when nothing's selected.
  const cityHeadline =
    sp.starting_city_id
      ? cities.find((c) => c.id === sp.starting_city_id)?.name ?? null
      : cities[0]?.name ?? null

  // "Load N more" → /discover/results with the same filter set + page=2.
  const loadMoreParams = new URLSearchParams(baseParams)
  loadMoreParams.set('page', '2')
  const loadMoreHref = `/discover/results?${loadMoreParams.toString()}`

  return (
    <>
      <WebHeader session={session} active="discover" />
      <main id="main-content">
        <DiscoverHeader
          totalCount={typeCounts.all}
          citiesCount={cities.length}
          cityHeadline={cityHeadline}
        />

        <FilterSheetProvider initialOpen={sp.filters === 'open'}>
          <div
            style={{
              maxWidth: 1640,
              margin: '32px auto 0',
              padding: '0 32px',
              display: 'grid',
              gridTemplateColumns: '240px 1fr',
              gap: 28,
            }}
            className="ch-discover-shell"
          >
            <DiscoverSidebar
              activeType={activeType}
              activeVibe={sp.vibe ?? null}
              activeDistanceKm={activeDistanceKm}
              vibeTags={vibeTags}
              typeCounts={typeCounts}
              baseParams={baseParams}
            />

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <DiscoverSortTabs
                  activeSort={activeSort}
                  baseParams={baseParams}
                  sessionCityId={null /* SessionPayload.cityId not surfaced yet */}
                />
                <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>
                  Showing <strong style={{ color: 'var(--ink)' }}>{gridResult.items.length}</strong>{' '}
                  of {gridResult.totalCount ?? typeCounts.all}
                </span>
              </div>

              {activeFilterChips.length > 0 && (
                <FilterChipBar params={baseParams} chips={activeFilterChips} />
              )}

              <DiscoverGrid
                items={gridResult.items}
                totalCount={gridResult.totalCount}
                loadMoreHref={loadMoreHref}
                clearFiltersHref="/discover"
              />
            </div>
          </div>

          {/* Context-controlled drawer — sidebar's "+ More filters" button toggles via React state.
            * Pure client toggle: no URL change, no RSC re-render. The `?filters=open` deep-link
            * still works on first paint via initialOpen above. */}
          <FilterSheet subCategories={subCategories} urlParamControlsOpen hideTrigger />
        </FilterSheetProvider>

        <div style={{ maxWidth: 1640, margin: '60px auto 0', padding: '0 32px 80px' }}>
          <HandpickedCollectionsRail collections={collections} />
          <TopCreatorsRail
            creators={creators.creators}
            label={creators.label}
            isAuthenticated={Boolean(session)}
          />
          <UpcomingExperiencesRail experiences={experiences} />

          {cities.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <header style={{ marginBottom: 16 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: 'var(--ink-muted)',
                    marginBottom: 4,
                    fontWeight: 700,
                  }}
                >
                  Places
                </p>
                <h2 className="ch-display" style={{ fontSize: 22, color: 'var(--ink)' }}>
                  Or browse by city
                </h2>
              </header>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {cities.slice(0, 16).map((c) => (
                  <Link
                    key={c.name}
                    href={
                      c.id
                        ? `/discover/results?starting_city_id=${encodeURIComponent(c.id)}`
                        : `/discover/results?q=${encodeURIComponent(c.name)}`
                    }
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
                    {c.name}{' '}
                    <span style={{ color: 'var(--ink-muted)', fontSize: 12 }}>{c.count}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <WebFooter />
    </>
  )
}
