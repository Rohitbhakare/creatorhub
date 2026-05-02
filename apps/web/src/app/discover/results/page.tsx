import type { Metadata } from 'next'
import Link from 'next/link'
import { WebHeader } from '@/components/chrome/web-header'
import { WebFooter } from '@/components/chrome/web-footer'
import { FilterSheet } from '@/components/discover/filter-sheet'
import { FilterChipBar } from '@/components/discover/filter-chip-bar'
import { SortSelect } from '@/components/discover/sort-select'
import { DiscoverGrid } from '@/components/discover/discover-grid'
import { getSession } from '@/lib/session'
import { fetchDiscoverResults, fetchSubCategories } from '@/lib/api'
import { paramsToFilters, activeFilterCount } from '@/lib/discover-filters-url'

export const metadata: Metadata = {
  title: 'Search results · Discover',
  description:
    'Filtered results from across CreatorHub — posts, plans, live experiences, and events.',
  robots: { index: false, follow: true },
}

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const TYPE_LABELS: Record<string, string> = {
  post: 'Posts',
  self_paced_itinerary: 'Itineraries',
  scheduled_experience: 'Experiences',
  event: 'Events',
}
const DURATION_LABELS: Record<string, string> = {
  day_trip: 'Day trip',
  weekend: 'Weekend',
  short: 'Short',
  long: 'Long',
}
const BUDGET_LABELS: Record<string, string> = {
  free: 'Free',
  lt2k: 'Under ₹2k',
  '2to5k': '₹2k–5k',
  '5to15k': '₹5k–15k',
  gt15k: 'Over ₹15k',
}
const TIME_LABELS: Record<string, string> = {
  today: 'Today',
  this_weekend: 'This weekend',
  next_7d: 'Next 7 days',
  this_month: 'This month',
}

function plain(sp: Record<string, string | string[] | undefined>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === 'string') out[k] = v
    else if (Array.isArray(v) && v[0]) out[k] = v[0]
  }
  return out
}

interface ChipDef {
  key: string
  label: string
  value?: string
}

function buildChips(
  sp: Record<string, string>,
  subCatLookup: Map<string, string>,
): ChipDef[] {
  const chips: ChipDef[] = []
  if (sp.q) chips.push({ key: 'q', label: `“${sp.q}”` })
  if (sp.sub_category_id) {
    const name = subCatLookup.get(sp.sub_category_id) ?? sp.sub_category_id
    chips.push({ key: 'sub_category_id', label: name })
  }
  if (sp.type) chips.push({ key: 'type', label: TYPE_LABELS[sp.type] ?? sp.type })
  if (sp.time_window)
    chips.push({ key: 'time_window', label: TIME_LABELS[sp.time_window] ?? sp.time_window })
  if (sp.duration_buckets) {
    for (const v of sp.duration_buckets.split(',')) {
      if (v) chips.push({ key: 'duration_buckets', value: v, label: DURATION_LABELS[v] ?? v })
    }
  }
  if (sp.budget_buckets) {
    for (const v of sp.budget_buckets.split(',')) {
      if (v) chips.push({ key: 'budget_buckets', value: v, label: BUDGET_LABELS[v] ?? v })
    }
  }
  const titleCase = (s: string): string =>
    s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s
  if (sp.seasons) {
    for (const v of sp.seasons.split(',')) {
      if (v) chips.push({ key: 'seasons', value: v, label: titleCase(v) })
    }
  }
  if (sp.difficulties) {
    for (const v of sp.difficulties.split(',')) {
      if (v) chips.push({ key: 'difficulties', value: v, label: titleCase(v) })
    }
  }
  if (sp.group_sizes) {
    for (const v of sp.group_sizes.split(',')) {
      if (v) chips.push({ key: 'group_sizes', value: v, label: titleCase(v) })
    }
  }
  if (sp.distance_km) chips.push({ key: 'distance_km', label: `${sp.distance_km} km` })
  return chips
}

export default async function DiscoverResultsPage({ searchParams }: Props) {
  const sp = plain(await searchParams)
  const session = await getSession()
  const filters = paramsToFilters(sp)
  const sortValue = filters.sort ?? 'recent'

  const [{ items, totalCount }, subCategories] = await Promise.all([
    fetchDiscoverResults(filters),
    fetchSubCategories('travel'),
  ])

  const subCatLookup = new Map(subCategories.map((sc) => [sc.id, sc.name]))
  const chips = buildChips(sp, subCatLookup)
  const hasFilters = activeFilterCount(filters) > 0 || Boolean(sp.q)

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
          <div style={{ maxWidth: 1640, margin: '0 auto' }}>
            <Link
              href="/discover"
              style={{
                fontSize: 12,
                color: 'var(--ink-muted)',
                textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              ← Discover
            </Link>
            <h1
              className="ch-display"
              style={{
                fontSize: 'clamp(24px, 3vw, 32px)',
                color: 'var(--ink)',
                marginTop: 8,
                marginBottom: 4,
                lineHeight: 1.15,
              }}
            >
              {sp.q ? (
                <>
                  Searching for{' '}
                  <em style={{ color: 'var(--primary-text-bg)', fontStyle: 'italic' }}>
                    “{sp.q}”
                  </em>
                </>
              ) : (
                <>Filtered results</>
              )}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>
              {totalCount !== null
                ? `${totalCount.toLocaleString('en-IN')} ${
                    totalCount === 1 ? 'result' : 'results'
                  }`
                : `${String(items.length)} shown`}
            </p>
          </div>
        </section>

        <div style={{ maxWidth: 1640, margin: '0 auto', padding: '20px 32px 80px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 18,
            }}
          >
            <SortSelect current={sortValue} />
            <FilterSheet subCategories={subCategories} />
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
              {hasFilters ? 'Filtered' : 'Showing all'}
            </span>
          </div>

          <FilterChipBar params={sp} chips={chips} />

          <DiscoverGrid
            items={items}
            totalCount={totalCount}
            loadMoreHref={`/discover/results?${new URLSearchParams({ ...sp, page: '2' }).toString()}`}
            clearFiltersHref="/discover"
          />
        </div>
      </main>
      <WebFooter />
    </>
  )
}
